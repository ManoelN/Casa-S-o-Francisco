import React, { createContext, useContext } from 'react';
import { SupabaseService } from '@/services/supabaseService';

interface SupabaseContextType {
  supabaseService: SupabaseService;
  isReady: boolean;
  isUsingSupabase: boolean;
}

const service = new SupabaseService();

const SupabaseContext = createContext<SupabaseContextType>({
  supabaseService: service,
  isReady: true,
  isUsingSupabase: true,
});

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={{ supabaseService: service, isReady: true, isUsingSupabase: true }}>
      {children}
    </SupabaseContext.Provider>
  );
};
