import React from 'react';
import { Root } from '../types';
import SceneCard from './SceneCard';
import EditableField from './EditableField';

type ActiveSceneIdentifier = { actIndex: number; sceneIndex: number } | null;
type ScriptViewMode = 'formatted' | 'json';

interface ScriptDisplayProps {
  script: Root;
  onUpdateField: (path: string, value: any) => void;
  language: 'en-US' | 'vi-VN';
  activeSceneIdentifier: ActiveSceneIdentifier;
  onSelectScene: (identifier: { actIndex: number, sceneIndex: number } | null) => void;
  viewMode: ScriptViewMode;
}

const ScriptDisplay: React.FC<ScriptDisplayProps> = ({
  script,
  onUpdateField,
  language,
  activeSceneIdentifier,
  onSelectScene,
  viewMode
}) => {
  if (viewMode === 'json') {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
          {JSON.stringify(script, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="text-center border-b border-slate-200 dark:border-slate-700 pb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          <EditableField initialValue={script.title} onSave={(v) => onUpdateField('title', v)} context="Movie Title" language={language} as="input" textClassName="text-center w-full" />
        </h1>
        <div className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"> {/* This was already a div, so no change here */}
          <EditableField initialValue={script.logline} onSave={(v) => onUpdateField('logline', v)} context="Movie Logline" language={language} />
        </div> 
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {script.genre.map((g) => (
            <span key={g} className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full">{g}</span>
          ))}
        </div>
      </header>

      {script.acts.map((act, actIndex) => (
        <section key={act.act_number}>
          <div className="sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 py-4 -my-4 mb-4">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">HỒI {act.act_number}</h2>
             <div className="mt-1 text-slate-600 dark:text-slate-400"> {/* Changed from <p> to <div> */}
                <EditableField initialValue={act.summary} onSave={(v) => onUpdateField(`acts[${actIndex}].summary`, v)} context={`Summary for Act ${act.act_number}`} language={language} />
             </div>
          </div>

          <div className="space-y-8">
            {act.scenes.map((scene, sceneIndex) => {
              const isActive = activeSceneIdentifier?.actIndex === actIndex && activeSceneIdentifier?.sceneIndex === sceneIndex;
              return (
                <div 
                  key={scene.scene_number} 
                  onClick={() => onSelectScene({ actIndex, sceneIndex })}
                  className={`cursor-pointer rounded-lg transition-all duration-300 ${isActive ? 'ring-2 ring-primary ring-offset-4 ring-offset-slate-50 dark:ring-offset-slate-900' : 'hover:ring-2 hover:ring-primary/50'}`}
                  id={`scene-${actIndex}-${sceneIndex}`}
                >
                  <SceneCard 
                    scene={scene} 
                    onUpdateField={(path, value) => onUpdateField(`acts[${actIndex}].scenes[${sceneIndex}].${path}`, value)} 
                    language={language}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ScriptDisplay;
