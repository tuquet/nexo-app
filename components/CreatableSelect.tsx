import React, { useState, useRef, useEffect } from 'react';

interface CreatableSelectProps {
  options: string[];
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Thêm thể loại...",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRemoveValue = (itemToRemove: string) => {
    if (disabled) return;
    onChange(value.filter((item) => item !== itemToRemove));
  };

  const handleAddValue = (itemToAdd: string) => {
    const trimmedItem = itemToAdd.trim();
    if (trimmedItem && !value.find(v => v.toLowerCase() === trimmedItem.toLowerCase())) {
      onChange([...value, trimmedItem]);
    }
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        const matchingOption = filteredOptions.find(opt => opt.toLowerCase() === inputValue.trim().toLowerCase());
        handleAddValue(matchingOption || inputValue);
      }
    }
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      handleRemoveValue(value[value.length - 1]);
    }
  };

  const filteredOptions = options.filter(
    (option) =>
      option.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.find(v => v.toLowerCase() === option.toLowerCase())
  );

  const showCreateOption = inputValue.trim() && !options.find(opt => opt.toLowerCase() === inputValue.trim().toLowerCase()) && !value.find(v => v.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className={`flex flex-wrap items-center gap-2 rounded-lg border bg-white dark:bg-slate-800 p-2 shadow-sm transition ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-slate-300 dark:border-slate-600'} ${disabled ? 'bg-slate-100 dark:bg-slate-700 opacity-70' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((item) => (
          <span key={item} className="inline-flex items-center gap-x-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 text-sm font-medium text-indigo-800 dark:text-indigo-300 capitalize">
            {item}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemoveValue(item); }}
              className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 transition-colors"
              disabled={disabled}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-grow bg-transparent p-1 outline-none text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
          disabled={disabled}
        />
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-auto">
          <ul className="py-1">
            {filteredOptions.map((option) => (
              <li
                key={option}
                onClick={() => handleAddValue(option)}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                {option}
              </li>
            ))}
            {showCreateOption && (
              <li
                onClick={() => handleAddValue(inputValue)}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Tạo mới "{inputValue.trim()}"
              </li>
            )}
            {filteredOptions.length === 0 && !showCreateOption && (
                <li className="px-3 py-2 text-sm text-slate-500">Không tìm thấy kết quả</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreatableSelect;