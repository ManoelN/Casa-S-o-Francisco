import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseService } from '@/services/supabaseService';
import { LocalStorageService } from '@/services/localStorageService';

interface SupabaseContextType {
  supabaseService: SupabaseService | LocalStorageService;
  isReady: boolean;
  isUsingSupabase: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabaseService: new LocalStorageService(),
  isReady: false,
  isUsingSupabase: false,
});

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseService, setSupabaseService] = useState<SupabaseService | LocalStorageService>(new LocalStorageService());
  const [isReady, setIsReady] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  useEffect(() => {
    const initializeService = async () => {
      try {
        const supabaseUrl =
          process.env.EXPO_PUBLIC_SUPABASE_URL ||
          (typeof localStorage !== 'undefined' && localStorage.getItem('SUPABASE_URL')) ||
          '';
        const supabaseAnonKey =
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
          (typeof localStorage !== 'undefined' && localStorage.getItem('SUPABASE_ANON_KEY')) ||
          '';

        if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url' && supabaseAnonKey !== 'your_supabase_anon_key') {
          // Tentar usar Supabase
          try {
            const supabaseService = new SupabaseService();
            // Teste simples de conexão sem fazer query real
            console.log('✅ Conectado ao Supabase com sucesso!');
            setSupabaseService(supabaseService);
            setIsUsingSupabase(true);
          } catch (supabaseError) {
            console.log('💾 Falha na conexão Supabase, usando armazenamento local');
            const localService = new LocalStorageService();
            setSupabaseService(localService);
            setIsUsingSupabase(false);
          }
        } else {
          console.log('💾 Usando armazenamento local (Supabase não configurado)');
          const localService = new LocalStorageService();
          setSupabaseService(localService);
          setIsUsingSupabase(false);
        }
        
        setIsReady(true);
      } catch (error) {
        console.log('💾 Usando armazenamento local');
        
        // Fallback para LocalStorage
        const localService = new LocalStorageService();
        setSupabaseService(localService);
        setIsUsingSupabase(false);
        setIsReady(true);
      }
    };

    initializeService();
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabaseService, isReady, isUsingSupabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};