import React, { useState, useEffect } from 'react';
import { AspectRatio } from '../types';

interface ImageGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (finalPrompt: string, finalNegativePrompt: string, finalAspectRatio: AspectRatio) => void;
    initialPrompt: string;
    initialNegativePrompt: string;
    initialAspectRatio: AspectRatio;
    isGenerating: boolean;
}

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialPrompt,
    initialNegativePrompt,
    initialAspectRatio,
    isGenerating
}) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [negativePrompt, setNegativePrompt] = useState(initialNegativePrompt);
    const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);

    useEffect(() => {
        if (isOpen) {
            setPrompt(initialPrompt);
            setNegativePrompt(initialNegativePrompt);
            setAspectRatio(initialAspectRatio);
        }
    }, [isOpen, initialPrompt, initialNegativePrompt, initialAspectRatio]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(prompt, negativePrompt, aspectRatio);
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all p-6 space-y-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cấu hình tạo ảnh</h3>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Câu lệnh (Prompt)</label>
                        <textarea id="prompt" rows={5} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm disabled:opacity-70" value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isGenerating} />
                    </div>
                     <div>
                        <label htmlFor="negativePrompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Câu lệnh phủ định (Negative Prompt)</label>
                        <textarea id="negativePrompt" rows={3} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm disabled:opacity-70" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} disabled={isGenerating} />
                    </div>
                     <div>
                        <label htmlFor="aspectRatioModal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tỷ lệ khung hình</label>
                        <select id="aspectRatioModal" className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm py-2 pl-3 pr-10 text-base transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm disabled:opacity-70" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} disabled={isGenerating}>
                            <option value="16:9">16:9 (Ngang)</option>
                            <option value="9:16">9:16 (Dọc)</option>
                            <option value="1:1">1:1 (Vuông)</option>
                            <option value="4:3">4:3 (Cổ điển)</option>
                            <option value="3:4">3:4 (Chân dung)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="rounded-md bg-slate-200 dark:bg-slate-600 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors" disabled={isGenerating}>
                            Hủy
                        </button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={isGenerating}>
                            {isGenerating ? (
                                <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
                                <span>Đang tạo...</span>
                                </>
                            ) : (
                                'Tạo ảnh'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImageGenerationModal;