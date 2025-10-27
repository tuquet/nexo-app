import React, { useState, useRef, useEffect } from 'react';
import { Root } from '../types';
import { ThemeSwitcher, Theme } from './ThemeSwitcher';

type ScriptViewMode = 'formatted' | 'json';

interface AppHeaderProps {
  scripts: Root[];
  activeScript: Root | null;
  onSelectScript: (id: number) => void;
  onNewScript: () => void;
  onDeleteActiveScript: () => void;
  onClearAllData: () => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportZip: () => void;
  isZipping: boolean;
  currentView: 'script' | 'assets';
  onViewChange: (view: 'script' | 'assets') => void;
  theme: Theme;
  onToggleTheme: () => void;
  scriptViewMode: ScriptViewMode;
  onScriptViewModeChange: (mode: ScriptViewMode) => void;
  onOpenSettings: () => void;
}

const Dropdown: React.FC<{ trigger: React.ReactNode; children: React.ReactNode; contentClasses?: string }> = ({ trigger, children, contentClasses = "w-56" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 origin-top-right z-20 rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${contentClasses}`}
        >
          <div className="py-1" onClick={(e) => {
              if ((e.target as HTMLElement).closest('a, button')) {
                  setIsOpen(false);
              }
          }}>{children}</div>
        </div>
      )}
    </div>
  );
};

const AppHeader: React.FC<AppHeaderProps> = ({
  scripts,
  activeScript,
  onSelectScript,
  onNewScript,
  onDeleteActiveScript,
  onClearAllData,
  onExportData,
  onImportData,
  onExportZip,
  isZipping,
  currentView,
  onViewChange,
  theme,
  onToggleTheme,
  scriptViewMode,
  onScriptViewModeChange,
  onOpenSettings
}) => {
  const importRef = useRef<HTMLInputElement>(null);
  const [confirmationPending, setConfirmationPending] = useState<'deleteScript' | 'clearAll' | null>(null);
  const confirmationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  const handleDestructiveActionClick = (action: 'deleteScript' | 'clearAll') => {
    if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
    }

    if (confirmationPending === action) {
        if (action === 'deleteScript') {
            onDeleteActiveScript();
        } else if (action === 'clearAll') {
            onClearAllData();
        }
        setConfirmationPending(null);
    } else {
        setConfirmationPending(action);
        confirmationTimeoutRef.current = window.setTimeout(() => {
            setConfirmationPending(null);
        }, 3000);
    }
  };


  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">CineGenie</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Dropdown
          trigger={
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
              <span className="truncate max-w-[200px]">{activeScript?.title || 'Chọn kịch bản'}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          }
        >
          {scripts.length > 0 ? (
            scripts.map(script => (
              <a key={script.id} href="#" onClick={(e) => { e.preventDefault(); onSelectScript(script.id!); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">{script.title}</a>
            ))
          ) : (
            <span className="block px-4 py-2 text-sm text-slate-500">Chưa có kịch bản nào</span>
          )}
        </Dropdown>
        <button onClick={onNewScript} className="inline-flex items-center gap-2 rounded-md border border-transparent bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark">
          + Mới
        </button>
      </div>

      <div className="flex items-center gap-2">
        {activeScript && (
          <div className="flex rounded-md shadow-sm bg-slate-100 dark:bg-slate-700 p-0.5">
            <button
              onClick={() => onViewChange('script')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentView === 'script' ? 'bg-white dark:bg-slate-600 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}
            >
              Kịch bản
            </button>
            <button
              onClick={() => onViewChange('assets')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentView === 'assets' ? 'bg-white dark:bg-slate-600 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}
            >
              Tài sản
            </button>
          </div>
        )}
        {activeScript && currentView === 'script' && (
             <div className="flex rounded-md shadow-sm bg-slate-100 dark:bg-slate-700 p-0.5">
                <button onClick={() => onScriptViewModeChange('formatted')} className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${scriptViewMode === 'formatted' ? 'bg-white dark:bg-slate-600 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>Định dạng</button>
                <button onClick={() => onScriptViewModeChange('json')} className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${scriptViewMode === 'json' ? 'bg-white dark:bg-slate-600 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}>JSON</button>
             </div>
        )}
        <Dropdown
          trigger={
            <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
          }
        >
          <a href="#" onClick={(e) => { e.preventDefault(); if (activeScript) onExportZip(); }} className={`flex items-center gap-2 px-4 py-2 text-sm ${!activeScript ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
             {isZipping ? 'Đang nén...' : 'Xuất ZIP'}
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); onExportData(); }} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
            Xuất JSON
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); importRef.current?.click(); }} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
            Nhập JSON
          </a>
          <input type="file" accept=".json" onChange={onImportData} ref={importRef} className="hidden" />
          <hr className="my-1 border-slate-200 dark:border-slate-600" />
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); if (activeScript) handleDestructiveActionClick('deleteScript'); }} 
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                !activeScript 
                ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : confirmationPending === 'deleteScript' 
                    ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/50'
                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50'
            }`}
          >
            {confirmationPending === 'deleteScript' ? 'Bạn chắc chắn?' : 'Xóa kịch bản'}
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); handleDestructiveActionClick('clearAll'); }} 
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                confirmationPending === 'clearAll'
                    ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/50'
                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50'
            }`}
          >
            {confirmationPending === 'clearAll' ? 'Xác nhận xóa tất cả?' : 'Dọn dẹp tất cả'}
          </a>
        </Dropdown>
        <ThemeSwitcher theme={theme} onToggle={onToggleTheme} />
         <button
            onClick={onOpenSettings}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 text-slate-500 dark:text-slate-400"
            aria-label="Mở cài đặt API Key"
            title="Mở cài đặt API Key"
        >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
