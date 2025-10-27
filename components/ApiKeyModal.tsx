import React, { useState, useEffect } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
    const { apiKey, setApiKey } = useApiKey();
    const [localKey, setLocalKey] = useState(apiKey || '');

    useEffect(() => {
        setLocalKey(apiKey || '');
    }, [apiKey, isOpen]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSave = () => {
        setApiKey(localKey);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg transform p-6 space-y-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cài đặt Khóa API</h3>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        &times;
                    </button>
                </div>
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Vui lòng nhập khóa API Gemini của bạn. Khóa của bạn sẽ được lưu trữ an toàn trong trình duyệt của bạn.
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Lấy khóa API tại đây</a>.
                    </p>
                    <input 
                        type="password"
                        value={localKey}
                        onChange={(e) => setLocalKey(e.target.value)}
                        placeholder="Dán khóa API của bạn vào đây"
                        className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="rounded-md bg-slate-200 dark:bg-slate-600 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                        Hủy
                    </button>
                    <button type="button" onClick={handleSave} className="rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark">
                        Lưu Khóa API
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
