import { createClient } from '@supabase/supabase-js'

// Função para criar cliente Supabase apenas quando necessário
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: number
          nome: string
          telefone: string | null
          endereco: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          nome: string
          telefone?: string | null
          endereco?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          nome?: string
          telefone?: string | null
          endereco?: string | null
          created_at?: string | null
        }
      }
      crediarios: {
        Row: {
          id: number
          cliente_id: number
          cliente_nome: string
          data_emissao: string
          data_vencimento_primeira: string
          valor_total: number
          juros_diario: number
          numero_parcelas: number
          valor_parcela: number
          created_at: string | null
        }
        Insert: {
          id?: number
          cliente_id: number
          cliente_nome: string
          data_emissao: string
          data_vencimento_primeira: string
          valor_total: number
          juros_diario: number
          numero_parcelas: number
          valor_parcela: number
          created_at?: string | null
        }
        Update: {
          id?: number
          cliente_id?: number
          cliente_nome?: string
          data_emissao?: string
          data_vencimento_primeira?: string
          valor_total?: number
          juros_diario?: number
          numero_parcelas?: number
          valor_parcela?: number
          created_at?: string | null
        }
      }
      parcelas: {
        Row: {
          id: number
          crediario_id: number
          numero_parcela: number
          valor_original: number
          valor_restante: number | null
          valor_pago_parcial: number | null
          data_vencimento: string
          status: string | null
          data_pagamento: string | null
          valor_pago: number | null
          dias_atraso: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          crediario_id: number
          numero_parcela: number
          valor_original: number
          valor_restante?: number | null
          valor_pago_parcial?: number | null
          data_vencimento: string
          status?: string | null
          data_pagamento?: string | null
          valor_pago?: number | null
          dias_atraso?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          crediario_id?: number
          numero_parcela?: number
          valor_original?: number
          valor_restante?: number | null
          valor_pago_parcial?: number | null
          data_vencimento?: string
          status?: string | null
          data_pagamento?: string | null
          valor_pago?: number | null
          dias_atraso?: number | null
          created_at?: string | null
        }
      }
      configuracoes: {
        Row: {
          id: number
          nome: string
          endereco: string | null
          telefone: string | null
          aviso_personalizado: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          nome?: string
          endereco?: string | null
          telefone?: string | null
          aviso_personalizado?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          nome?: string
          endereco?: string | null
          telefone?: string | null
          aviso_personalizado?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}