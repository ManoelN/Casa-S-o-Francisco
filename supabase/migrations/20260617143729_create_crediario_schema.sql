/*
# Schema do Sistema de Crediário

## Tabelas criadas
- `clientes` - cadastro de clientes
- `crediarios` - registros de crediário por cliente
- `parcelas` - parcelas de cada crediário
- `configuracoes` - configurações da empresa (registro único)

## Segurança
- RLS habilitado em todas as tabelas
- Políticas abertas para anon + authenticated (app single-tenant sem autenticação)
*/

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  telefone text,
  endereco text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_clientes" ON clientes;
CREATE POLICY "anon_select_clientes" ON clientes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_clientes" ON clientes;
CREATE POLICY "anon_insert_clientes" ON clientes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_clientes" ON clientes;
CREATE POLICY "anon_update_clientes" ON clientes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_clientes" ON clientes;
CREATE POLICY "anon_delete_clientes" ON clientes FOR DELETE TO anon, authenticated USING (true);

-- Crediários
CREATE TABLE IF NOT EXISTS crediarios (
  id serial PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  cliente_nome text NOT NULL,
  data_emissao text NOT NULL,
  data_vencimento_primeira text NOT NULL,
  valor_total numeric(10,2) NOT NULL,
  juros_diario numeric(5,4) NOT NULL DEFAULT 0,
  numero_parcelas integer NOT NULL,
  valor_parcela numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crediarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_crediarios" ON crediarios;
CREATE POLICY "anon_select_crediarios" ON crediarios FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_crediarios" ON crediarios;
CREATE POLICY "anon_insert_crediarios" ON crediarios FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_crediarios" ON crediarios;
CREATE POLICY "anon_update_crediarios" ON crediarios FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_crediarios" ON crediarios;
CREATE POLICY "anon_delete_crediarios" ON crediarios FOR DELETE TO anon, authenticated USING (true);

-- Parcelas
CREATE TABLE IF NOT EXISTS parcelas (
  id serial PRIMARY KEY,
  crediario_id integer NOT NULL REFERENCES crediarios(id) ON DELETE CASCADE,
  numero_parcela integer NOT NULL,
  valor_original numeric(10,2) NOT NULL,
  valor_restante numeric(10,2),
  valor_pago_parcial numeric(10,2) DEFAULT 0,
  data_vencimento text NOT NULL,
  status text DEFAULT 'pendente',
  data_pagamento text,
  valor_pago numeric(10,2),
  dias_atraso integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_parcelas" ON parcelas;
CREATE POLICY "anon_select_parcelas" ON parcelas FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_parcelas" ON parcelas;
CREATE POLICY "anon_insert_parcelas" ON parcelas FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_parcelas" ON parcelas;
CREATE POLICY "anon_update_parcelas" ON parcelas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_parcelas" ON parcelas;
CREATE POLICY "anon_delete_parcelas" ON parcelas FOR DELETE TO anon, authenticated USING (true);

-- Configurações da empresa
CREATE TABLE IF NOT EXISTS configuracoes (
  id integer PRIMARY KEY DEFAULT 1,
  nome text NOT NULL DEFAULT 'Minha Empresa',
  endereco text,
  telefone text,
  aviso_personalizado text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_configuracoes" ON configuracoes;
CREATE POLICY "anon_select_configuracoes" ON configuracoes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_configuracoes" ON configuracoes;
CREATE POLICY "anon_insert_configuracoes" ON configuracoes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_configuracoes" ON configuracoes;
CREATE POLICY "anon_update_configuracoes" ON configuracoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_configuracoes" ON configuracoes;
CREATE POLICY "anon_delete_configuracoes" ON configuracoes FOR DELETE TO anon, authenticated USING (true);

-- Indexes para queries frequentes
CREATE INDEX IF NOT EXISTS idx_crediarios_cliente_id ON crediarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_crediario_id ON parcelas(crediario_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_vencimento ON parcelas(data_vencimento);
