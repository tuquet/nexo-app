import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isApiKeySet: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('gemini-api-key');
    } catch (error) {
      console.error("Không thể truy cập localStorage:", error);
      return null;
    }
  });

  const setApiKey = (key: string | null) => {
    try {
      if (key) {
        localStorage.setItem('gemini-api-key', key);
      } else {
        localStorage.removeItem('gemini-api-key');
      }
    } catch (error) {
       console.error("Không thể lưu khóa API vào localStorage:", error);
    }
    setApiKeyState(key);
  };
  
  const isApiKeySet = !!apiKey && apiKey.trim().length > 0;

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isApiKeySet }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey phải được sử dụng trong một ApiKeyProvider');
  }
  return context;
};
