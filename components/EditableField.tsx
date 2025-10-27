import React, { useState, useRef, useEffect } from 'react';
import { enhanceText } from '../services/geminiService';
import { useApiKey } from '../contexts/ApiKeyContext';

interface EditableFieldProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  context: string; // e.g., "Movie Logline", "Scene Action"
  language: 'en-US' | 'vi-VN';
  as?: 'textarea' | 'input';
  className?: string;
  textClassName?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  initialValue,
  onSave,
  context,
  language,
  as = 'textarea',
  className = '',
  textClassName = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const { apiKey } = useApiKey();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (as === 'textarea' && inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      }
    }
  }, [isEditing, as]);

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const handleEnhance = async () => {
    if (!value.trim() || !apiKey) return;
    setIsEnhancing(true);
    try {
      const enhancedValue = await enhanceText(value, context, language, apiKey);
      setValue(enhancedValue);
    } catch (error) {
      console.error("Failed to enhance text:", error);
      // alert() is blocked in sandboxed environments. The user will see the spinner stop, indicating the operation failed.
    } finally {
      setIsEnhancing(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setValue(e.target.value);
    if (as === 'textarea' && e.target instanceof HTMLTextAreaElement) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }
  }

  if (isEditing) {
    const InputComponent = as;
    return (
      <div className={`w-full ${className}`}>
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={handleChange}
          className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm resize-none"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={handleEnhance}
            disabled={isEnhancing || !value.trim() || !apiKey}
            title={!apiKey ? "Vui lòng đặt khóa API trong cài đặt để sử dụng tính năng này" : ""}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/50 px-2 py-1 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEnhancing ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/50 border-t-primary"></span>
            ) : (
               <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            )}
            Nâng cao
          </button>
          <button
            onClick={handleCancel}
            className="rounded-md bg-slate-200 dark:bg-slate-600 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative cursor-pointer min-h-[24px] ${className}`}>
      <div className={textClassName}>{initialValue || <span className="text-slate-400 italic">Trống</span>}</div>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
        aria-label={`Sửa ${context}`}
        title={`Sửa ${context}`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
      </button>
    </div>
  );
};

export default EditableField;
