import * as SQLite from 'expo-sqlite';

export interface Cliente {
  id?: number;
  nome: string;
  telefone?: string;
  endereco?: string;
  created_at?: string;
}

export interface Crediario {
  id?: number;
  cliente_id: number;
  cliente_nome: string;
  data_emissao: string;
  data_vencimento_primeira: string;
  valor_total: number;
  juros_diario: number;
  numero_parcelas: number;
  valor_parcela: number;
  created_at?: string;
}

export interface Parcela {
  id?: number;
  crediario_id: number;
  numero_parcela: number;
  valor_original: number;
  data_vencimento: string;
  status: 'pendente' | 'paga';
  data_pagamento?: string;
  valor_pago?: number;
  dias_atraso: number;
  created_at?: string;
}

export class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  // Métodos para clientes
  async criarCliente(cliente: Cliente): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO clientes (nome, telefone, endereco) VALUES (?, ?, ?)',
      [cliente.nome, cliente.telefone || '', cliente.endereco || '']
    );
    return result.lastInsertRowId;
  }

  async buscarClientes(): Promise<Cliente[]> {
    const result = await this.db.getAllAsync(
      'SELECT * FROM clientes ORDER BY nome'
    );
    return result as Cliente[];
  }

  async buscarClientesPorNome(nome: string): Promise<Cliente[]> {
    const result = await this.db.getAllAsync(
      'SELECT * FROM clientes WHERE nome LIKE ? ORDER BY nome',
      [`%${nome}%`]
    );
    return result as Cliente[];
  }

  // Métodos para crediários
  async criarCrediario(crediario: Crediario): Promise<number> {
    const result = await this.db.runAsync(
      `INSERT INTO crediarios (cliente_id, cliente_nome, data_emissao, data_vencimento_primeira, 
       valor_total, juros_diario, numero_parcelas, valor_parcela) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crediario.cliente_id,
        crediario.cliente_nome,
        crediario.data_emissao,
        crediario.data_vencimento_primeira,
        crediario.valor_total,
        crediario.juros_diario,
        crediario.numero_parcelas,
        crediario.valor_parcela
      ]
    );
    return result.lastInsertRowId;
  }

  async buscarCrediarios(): Promise<Crediario[]> {
    const result = await this.db.getAllAsync(
      'SELECT * FROM crediarios ORDER BY created_at DESC'
    );
    return result as Crediario[];
  }

  // Métodos para parcelas
  async criarParcelas(parcelas: Parcela[]): Promise<void> {
    for (const parcela of parcelas) {
      await this.db.runAsync(
        `INSERT INTO parcelas (crediario_id, numero_parcela, valor_original, data_vencimento, dias_atraso) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          parcela.crediario_id,
          parcela.numero_parcela,
          parcela.valor_original,
          parcela.data_vencimento,
          parcela.dias_atraso
        ]
      );
    }
  }

  async buscarParcelasPorCliente(clienteNome: string): Promise<Parcela[]> {
    const result = await this.db.getAllAsync(
      `SELECT p.* FROM parcelas p 
       INNER JOIN crediarios c ON p.crediario_id = c.id 
       WHERE c.cliente_nome LIKE ? AND p.status = 'pendente'
       ORDER BY p.data_vencimento`,
      [`%${clienteNome}%`]
    );
    return result as Parcela[];
  }

  async quitarParcela(parcelaId: number, valorPago: number, diasAtraso: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE parcelas SET status = 'paga', data_pagamento = DATE('now'), 
       valor_pago = ?, dias_atraso = ? WHERE id = ?`,
      [valorPago, diasAtraso, parcelaId]
    );
  }

  async buscarParcelasEmAberto(): Promise<Parcela[]> {
    const result = await this.db.getAllAsync(
      `SELECT p.*, c.cliente_nome, c.juros_diario 
       FROM parcelas p 
       INNER JOIN crediarios c ON p.crediario_id = c.id 
       WHERE p.status = 'pendente' 
       ORDER BY p.data_vencimento`
    );
    return result as Parcela[];
  }

  async buscarCrediarioPorId(id: number): Promise<Crediario | null> {
    const result = await this.db.getFirstAsync(
      'SELECT * FROM crediarios WHERE id = ?',
      [id]
    );
    return result as Crediario | null;
  }
}