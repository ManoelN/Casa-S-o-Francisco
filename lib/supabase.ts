import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SB_URL_KEY = 'sb_custom_url';
const SB_KEY_KEY = 'sb_custom_key';

function readCustomCredentials(): { url: string; key: string } | null {
  if (typeof localStorage === 'undefined') return null;
  const url = localStorage.getItem(SB_URL_KEY);
  const key = localStorage.getItem(SB_KEY_KEY);
  if (url && key) return { url, key };
  return null;
}

export function saveCustomCredentials(url: string, key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SB_URL_KEY, url.trim());
    localStorage.setItem(SB_KEY_KEY, key.trim());
  }
}

export function clearCustomCredentials(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SB_URL_KEY);
    localStorage.removeItem(SB_KEY_KEY);
  }
}

export function getActiveCredentials(): { url: string; key: string; isCustom: boolean } {
  const custom = readCustomCredentials();
  if (custom) return { ...custom, isCustom: true };
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    isCustom: false,
  };
}

const creds = readCustomCredentials() ?? {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
};

export const supabase = createClient(creds.url, creds.key);

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: number;
          nome: string;
          telefone: string | null;
          endereco: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          nome: string;
          telefone?: string | null;
          endereco?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          nome?: string;
          telefone?: string | null;
          endereco?: string | null;
          created_at?: string | null;
        };
      };
      crediarios: {
        Row: {
          id: number;
          cliente_id: number;
          cliente_nome: string;
          data_emissao: string;
          data_vencimento_primeira: string;
          valor_total: number;
          juros_diario: number;
          numero_parcelas: number;
          valor_parcela: number;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          cliente_id: number;
          cliente_nome: string;
          data_emissao: string;
          data_vencimento_primeira: string;
          valor_total: number;
          juros_diario: number;
          numero_parcelas: number;
          valor_parcela: number;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          cliente_id?: number;
          cliente_nome?: string;
          data_emissao?: string;
          data_vencimento_primeira?: string;
          valor_total?: number;
          juros_diario?: number;
          numero_parcelas?: number;
          valor_parcela?: number;
          created_at?: string | null;
        };
      };
      parcelas: {
        Row: {
          id: number;
          crediario_id: number;
          numero_parcela: number;
          valor_original: number;
          valor_restante: number | null;
          valor_pago_parcial: number | null;
          data_vencimento: string;
          status: string | null;
          data_pagamento: string | null;
          valor_pago: number | null;
          dias_atraso: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          crediario_id: number;
          numero_parcela: number;
          valor_original: number;
          valor_restante?: number | null;
          valor_pago_parcial?: number | null;
          data_vencimento: string;
          status?: string | null;
          data_pagamento?: string | null;
          valor_pago?: number | null;
          dias_atraso?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          crediario_id?: number;
          numero_parcela?: number;
          valor_original?: number;
          valor_restante?: number | null;
          valor_pago_parcial?: number | null;
          data_vencimento?: string;
          status?: string | null;
          data_pagamento?: string | null;
          valor_pago?: number | null;
          dias_atraso?: number | null;
          created_at?: string | null;
        };
      };
      configuracoes: {
        Row: {
          id: number;
          nome: string;
          endereco: string | null;
          telefone: string | null;
          aviso_personalizado: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          nome?: string;
          endereco?: string | null;
          telefone?: string | null;
          aviso_personalizado?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          nome?: string;
          endereco?: string | null;
          telefone?: string | null;
          aviso_personalizado?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
};
