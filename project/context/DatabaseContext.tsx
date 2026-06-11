import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

interface DatabaseContextType {
  db: SQLite.SQLiteDatabase | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isReady: false,
});

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('crediario.db');
        
        // Criar tabela de clientes
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT,
            endereco TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Criar tabela de crediários
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS crediarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            cliente_nome TEXT NOT NULL,
            data_emissao DATE NOT NULL,
            data_vencimento_primeira DATE NOT NULL,
            valor_total REAL NOT NULL,
            juros_diario REAL NOT NULL,
            numero_parcelas INTEGER NOT NULL,
            valor_parcela REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cliente_id) REFERENCES clientes (id)
          );
        `);

        // Criar tabela de parcelas
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS parcelas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crediario_id INTEGER NOT NULL,
            numero_parcela INTEGER NOT NULL,
            valor_original REAL NOT NULL,
            data_vencimento DATE NOT NULL,
            status TEXT DEFAULT 'pendente',
            data_pagamento DATE,
            valor_pago REAL,
            dias_atraso INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (crediario_id) REFERENCES crediarios (id)
          );
        `);

        setDb(database);
        setIsReady(true);
      } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
      }
    };

    initializeDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
};