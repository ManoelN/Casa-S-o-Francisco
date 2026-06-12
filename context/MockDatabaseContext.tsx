import React, { createContext, useContext, useEffect, useState } from 'react';

interface MockDatabaseContextType {
  isReady: boolean;
}

const MockDatabaseContext = createContext<MockDatabaseContextType>({
  isReady: false,
});

export const useMockDatabase = () => {
  const context = useContext(MockDatabaseContext);
  if (!context) {
    throw new Error('useMockDatabase must be used within a MockDatabaseProvider');
  }
  return context;
};

export const MockDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simular inicialização do banco
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <MockDatabaseContext.Provider value={{ isReady }}>
      {children}
    </MockDatabaseContext.Provider>
  );
};