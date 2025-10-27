import React, { useState, useEffect, useMemo } from 'react';
import { generateScript, suggestPlotPoints } from './services/geminiService';
import { Root, Scene, AspectRatio } from './types';
import ScriptDisplay from './components/ScriptDisplay';
import Loader from './components/Loader';
import AssetDisplay from './components/AssetDisplay';
import AssetGallery from './components/AssetGallery';
import CreatableSelect from './components/CreatableSelect';
import AppHeader from './components/AppHeader';
import 'jszip'; // Import for side-effect: loads the library and creates the global JSZip variable
import { useTheme } from './hooks/useTheme';
import { useScripts } from './hooks/useScripts';
import { useAssets } from './hooks/useAssets';
import { PREDEFINED_GENRES, DEFAULT_ASPECT_RATIO } from './constants';
import { db } from './db';
import { useApiKey } from './contexts/ApiKeyContext';
import ApiKeyModal from './components/ApiKeyModal';


// To satisfy TypeScript since JSZip is loaded globally via a script tag
declare var JSZip: any;

type ScriptViewMode = 'formatted' | 'json';


function App() {
  const [theme, toggleTheme] = useTheme();
  const { apiKey, isApiKeySet } = useApiKey();

  const {
    savedScripts,
    activeScript,
    activeSceneIdentifier,
    scriptsError,
    selectScript,
    newScript,
    deleteActiveScript,
    updateScriptField,
    addScript,
    setActiveSceneIdentifier,
    setActiveScript,
    clearAllData,
    saveActiveScript,
  } = useScripts();

  const [error, setError] = useState<string | null>(null);
  
  const {
      generateSceneImage,
      cancelGenerateSceneImage,
      generateSceneVideo,
      deleteSceneImage,
      deleteSceneVideo,
      deleteAssetFromGallery
  } = useAssets(setActiveScript, saveActiveScript, setError);

  // State for the creation form
  const [logline, setLogline] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [language, setLanguage] = useState<'en-US' | 'vi-VN'>('vi-VN');
  const [scriptLength, setScriptLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [defaultAspectRatio, setDefaultAspectRatio] = useState<AspectRatio>(DEFAULT_ASPECT_RATIO);
  
  // UI and process-specific state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [plotSuggestions, setPlotSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'script' | 'assets'>('script');
  const [scriptViewMode, setScriptViewMode] = useState<ScriptViewMode>('formatted');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);


  // Effect to sync script errors with the main error state
  useEffect(() => {
    setError(scriptsError);
  }, [scriptsError]);


  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError("Vui lòng thiết lập khóa API của bạn trong phần cài đặt (⚙️) trước khi tạo kịch bản.");
      return;
    }
    if (!logline.trim()) {
      setError("Vui lòng nhập tóm tắt hoặc ý tưởng chính để tạo kịch bản.");
      return;
    }
    setIsLoading(true);
    setError(null);
    newScript(); // Reset active script via hook

    const finalPrompt = `
      **Logline / Core Idea:** ${logline}
      **Genres:** ${genres.join(', ')}
      **Desired Script Length:** ${scriptLength}
      Based on the provided logline, genres, and desired length, please generate a full movie script.`.trim();

    try {
      const generatedScript = await generateScript(finalPrompt, language, apiKey);
      generatedScript.setting.defaultAspectRatio = defaultAspectRatio;
      await addScript(generatedScript);
      
      setLogline('');
      setGenres([]);
      setPlotSuggestions([]);
      setScriptLength('medium');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestPlotPoints = async () => {
    if (!apiKey) {
      setSuggestionError("Vui lòng thiết lập khóa API của bạn trong phần cài đặt (⚙️) để nhận gợi ý.");
      return;
    }
    if (!logline.trim()) return;
    setIsSuggesting(true);
    setSuggestionError(null);
    setPlotSuggestions([]);
    const suggestionPrompt = `**Logline / Core Idea:**\n${logline}\n\n**Genres:**\n${genres.join(', ')}`.trim();
    try {
        const suggestions = await suggestPlotPoints(suggestionPrompt, language, apiKey);
        setPlotSuggestions(suggestions);
    } catch (err) {
        setSuggestionError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gợi ý tình tiết.');
    } finally {
        setIsSuggesting(false);
    }
  };
  
  const handleAddSuggestionToLogline = (suggestion: string) => {
    setLogline(prev => `${prev}\n\n- ${suggestion}`.trim());
  };

  const handleNewScript = () => {
    newScript();
    setLogline('');
    setGenres([]);
    setError(null);
    setPlotSuggestions([]);
    setScriptLength('medium');
    setCurrentView('script');
    setScriptViewMode('formatted');
  };

  const handleExportData = async () => {
    try {
      const allScripts = await db.scripts.toArray();
      const jsonString = JSON.stringify(allScripts, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinegenie-scripts-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi xuất dữ liệu:', error);
      setError('Đã xảy ra lỗi trong quá trình xuất dữ liệu kịch bản.');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Không thể đọc tệp.");
        }
        const importedData = JSON.parse(text);
        
        const scriptsToImport = Array.isArray(importedData) ? importedData : [importedData];
        
        const isValidScript = (script: any): script is Root => {
            return script && typeof script === 'object' && 'title' in script && 'acts' in script;
        };
        
        if (scriptsToImport.length === 0) {
            setIsImporting(false);
            return;
        }

        if (!scriptsToImport.every(isValidScript)) {
             throw new Error("Tệp không chứa định dạng kịch bản hợp lệ.");
        }

        const scriptsToAdd = scriptsToImport.map(({ id, ...rest }) => rest);
        await db.scripts.bulkAdd(scriptsToAdd);
        window.location.reload();
      } catch (error) {
        console.error('Lỗi nhập dữ liệu:', error);
        setError(`Không thể nhập dữ liệu. ${error instanceof Error ? error.message : 'Tệp có thể bị hỏng hoặc không đúng định dạng.'}`);
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
       setError("Đã xảy ra lỗi khi đọc tệp.");
       setIsImporting(false);
    }
    reader.readAsText(file);
  };

  const handleExportZip = async () => {
    if (!activeScript) return;
    setIsZipping(true);
    setError(null);
    try {
      const zip = new JSZip();
      
      const scriptJson = JSON.stringify(activeScript, null, 2);
      zip.file('script.json', scriptJson);

      for (const act of activeScript.acts) {
        for (const scene of act.scenes) {
          if (scene.generatedImageId) {
            const imageRecord = await db.images.get(scene.generatedImageId);
            if (imageRecord?.data) {
              zip.file(`scene_${act.act_number}_${scene.scene_number}.png`, imageRecord.data);
            }
          }
          if (scene.generatedVideoId) {
            const videoRecord = await db.videos.get(scene.generatedVideoId);
            if (videoRecord?.data) {
              zip.file(`scene_${act.act_number}_${scene.scene_number}.mp4`, videoRecord.data);
            }
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      const safeTitle = activeScript.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.href = url;
      a.download = `${safeTitle || 'script'}.zip`;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (err) {
        console.error("Lỗi xuất file ZIP:", err);
        setError(err instanceof Error ? err.message : "Không thể tạo file ZIP.");
    } finally {
        setIsZipping(false);
    }
  };

  const CreationForm = (
      <form onSubmit={handleGenerateScript} className="space-y-6">
        <div>
          <label htmlFor="logline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tóm tắt / Ý tưởng chính</label>
          <textarea id="logline" rows={5} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:opacity-70 placeholder:text-slate-400 dark:placeholder:text-slate-500" value={logline} onChange={(e) => setLogline(e.target.value)} placeholder="VD: Một thám tử trong thành phố cyberpunk đuổi theo một AI nổi loạn..." disabled={isLoading} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Thể loại</label>
          <CreatableSelect options={PREDEFINED_GENRES} value={genres} onChange={setGenres} placeholder="Chọn hoặc tạo thể loại..." disabled={isLoading}/>
        </div>
        <div>
          <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" onClick={handleSuggestPlotPoints} disabled={!logline.trim() || isLoading || isSuggesting || !isApiKeySet} title={!isApiKeySet ? "Vui lòng đặt khóa API trong cài đặt để sử dụng" : ""}>
            {isSuggesting ? '🤔 Đang gợi ý...' : '💡 Gợi ý tình tiết'}
          </button>
        </div>
        {suggestionError && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300 flex items-start gap-3">🚨 {suggestionError}</div>}
        {plotSuggestions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gợi ý (nhấp để thêm vào tóm tắt)</label>
            <div className="mt-2 space-y-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">{plotSuggestions.map((item, index) => (<div key={index}><a onClick={() => handleAddSuggestionToLogline(item)} className="block cursor-pointer p-3 text-sm text-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">{item}</a></div>))}</div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
              <label htmlFor="language" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngôn ngữ</label>
              <select id="language" className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm py-2 pl-3 pr-10 text-base transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:opacity-70" value={language} onChange={(e) => setLanguage(e.target.value as 'en-US' | 'vi-VN')} disabled={isLoading}>
                <option value="vi-VN">Tiếng Việt</option>
                <option value="en-US">Tiếng Anh (Mỹ)</option>
              </select>
            </div>
            <div>
              <label htmlFor="length" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Độ dài kịch bản</label>
              <select id="length" className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm py-2 pl-3 pr-10 text-base transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:opacity-70" value={scriptLength} onChange={(e) => setScriptLength(e.target.value as 'short' | 'medium' | 'long')} disabled={isLoading}>
                <option value="short">Ngắn</option>
                <option value="medium">Trung bình</option>
                <option value="long">Dài</option>
              </select>
            </div>
        </div>
         <div>
              <label htmlFor="aspectRatio" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Định dạng Video (Mặc định)</label>
              <select id="aspectRatio" className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm py-2 pl-3 pr-10 text-base transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:opacity-70" value={defaultAspectRatio} onChange={(e) => setDefaultAspectRatio(e.target.value as AspectRatio)} disabled={isLoading}>
                <option value="16:9">16:9 (Ngang)</option>
                <option value="9:16">9:16 (Dọc)</option>
                <option value="1:1">1:1 (Vuông)</option>
                <option value="4:3">4:3 (Cổ điển)</option>
                <option value="3:4">3:4 (Chân dung)</option>
              </select>
            </div>
        <div className="pt-2">
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading || !isApiKeySet} title={!isApiKeySet ? "Vui lòng đặt khóa API trong cài đặt để tạo kịch bản" : ""}>
            {isLoading ? '⏳ Đang tạo...' : '🎬 Tạo kịch bản'}
          </button>
        </div>
        {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300 flex items-start gap-3">🚨 {error}</div>}
      </form>
  );

  const activeScene: Scene | null = activeScript && activeSceneIdentifier
    ? activeScript.acts[activeSceneIdentifier.actIndex].scenes[activeSceneIdentifier.sceneIndex]
    : null;

  const allScenesFlat = useMemo(() => {
    if (!activeScript) return [];
    return activeScript.acts.flatMap((act, actIndex) => 
      act.scenes.map((scene, sceneIndex) => ({
        identifier: { actIndex, sceneIndex },
        scene: scene
      }))
    );
  }, [activeScript]);

  const currentSceneLinearIndex = useMemo(() => {
    if (!activeSceneIdentifier || allScenesFlat.length === 0) return -1;
    return allScenesFlat.findIndex(s => 
      s.identifier.actIndex === activeSceneIdentifier.actIndex &&
      s.identifier.sceneIndex === activeSceneIdentifier.sceneIndex
    );
  }, [activeSceneIdentifier, allScenesFlat]);

  const handleGoToPreviousScene = () => {
    if (currentSceneLinearIndex > 0) {
      const prevScene = allScenesFlat[currentSceneLinearIndex - 1];
      setActiveSceneIdentifier(prevScene.identifier);
    }
  };

  const handleGoToNextScene = () => {
    if (currentSceneLinearIndex !== -1 && currentSceneLinearIndex < allScenesFlat.length - 1) {
      const nextScene = allScenesFlat[currentSceneLinearIndex + 1];
      setActiveSceneIdentifier(nextScene.identifier);
    }
  };


  return (
    <>
      <ApiKeyModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      {isImporting && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center z-50" aria-modal="true" role="dialog">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-primary"></div>
          <h4 className="mt-6 text-lg font-semibold text-white">Đang nhập dữ liệu...</h4>
          <p className="text-slate-300">Ứng dụng sẽ sớm được tải lại.</p>
        </div>
      )}
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
        <AppHeader 
          scripts={savedScripts}
          activeScript={activeScript}
          onSelectScript={selectScript}
          onNewScript={handleNewScript}
          onDeleteActiveScript={deleteActiveScript}
          onClearAllData={clearAllData}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onExportZip={handleExportZip}
          isZipping={isZipping}
          currentView={currentView}
          onViewChange={setCurrentView}
          theme={theme}
          onToggleTheme={toggleTheme}
          scriptViewMode={scriptViewMode}
          onScriptViewModeChange={setScriptViewMode}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
        
        <div className="flex flex-1 overflow-hidden">
            {currentView === 'script' ? (
              <div className="flex flex-1 overflow-hidden">
                  <main className="flex-1 p-6 overflow-y-auto">
                    <div className={activeScript ? "max-w-4xl mx-auto" : "max-w-2xl mx-auto"}>
                      {isLoading ? (
                        <div className="flex h-full items-center justify-center"><Loader /></div>
                      ) : activeScript ? (
                        <ScriptDisplay 
                          script={activeScript} 
                          onUpdateField={(path, value) => updateScriptField(path, value, apiKey)}
                          language={language}
                          activeSceneIdentifier={activeSceneIdentifier}
                          onSelectScene={setActiveSceneIdentifier}
                          viewMode={scriptViewMode}
                        />
                      ) : (
                        <div className="bg-white dark:bg-slate-800/50 p-8 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tạo kịch bản mới</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Bắt đầu bằng cách điền vào các chi tiết bên dưới.</p>
                            {CreationForm}
                        </div>
                      )}
                    </div>
                  </main>
                  {activeScript && (
                    <aside className="w-[350px] flex-shrink-0 bg-white dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700/50 p-6 overflow-y-auto">
                      <AssetDisplay 
                          activeScene={activeScene}
                          actIndex={activeSceneIdentifier?.actIndex ?? null}
                          sceneIndex={activeSceneIdentifier?.sceneIndex ?? null}
                          defaultAspectRatio={activeScript?.setting.defaultAspectRatio}
                          onGenerateSceneImage={(actIndex, sceneIndex, finalPrompt, finalNegativePrompt, aspectRatio) => 
                              activeScript && generateSceneImage(activeScript, actIndex, sceneIndex, finalPrompt, finalNegativePrompt, aspectRatio)
                          }
                          onCancelGenerateSceneImage={(actIndex, sceneIndex) => 
                              activeScript && cancelGenerateSceneImage(activeScript, actIndex, sceneIndex)
                          }
                          onGenerateSceneVideo={(actIndex, sceneIndex, aspectRatio) => 
                              activeScript && generateSceneVideo(activeScript, actIndex, sceneIndex, aspectRatio)
                          }
                          onDeleteSceneImage={(actIndex, sceneIndex) => 
                              activeScript && deleteSceneImage(activeScript, actIndex, sceneIndex)
                          }
                          onDeleteSceneVideo={(actIndex, sceneIndex) => 
                              activeScript && deleteSceneVideo(activeScript, actIndex, sceneIndex)
                          }
                          isApiKeySet={isApiKeySet}
                          currentSceneNumber={currentSceneLinearIndex + 1}
                          totalScenes={allScenesFlat.length}
                          onGoToPreviousScene={handleGoToPreviousScene}
                          onGoToNextScene={handleGoToNextScene}
                        />
                    </aside>
                  )}
              </div>
            ) : (
              <main className="flex-1 p-6 overflow-y-auto">
                <AssetGallery onDeleteAsset={deleteAssetFromGallery} />
              </main>
            )}
        </div>
      </div>
    </>
  );
}

export default App;
