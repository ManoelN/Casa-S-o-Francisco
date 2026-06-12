import React, { createContext, useContext, useEffect, useState } from 'react';
import { LocalStorageService } from '@/services/localStorageService';

interface LocalStorageContextType {
  storageService: LocalStorageService;
  isReady: boolean;
}

const LocalStorageContext = createContext<LocalStorageContextType>({
  storageService: new LocalStorageService(),
  isReady: false,
});

export const useLocalStorage = () => {
  const context = useContext(LocalStorageContext);
  if (!context) {
    throw new Error('useLocalStorage must be used within a LocalStorageProvider');
  }
  return context;
};

export const LocalStorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storageService] = useState(new LocalStorageService());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simular inicialização
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LocalStorageContext.Provider value={{ storageService, isReady }}>
      {children}
    </LocalStorageContext.Provider>
  );
};