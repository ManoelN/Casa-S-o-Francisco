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

// Dados simulados
let mockClientes: Cliente[] = [
  { id: 1, nome: 'Maria Silva', telefone: '(11) 99999-1234', endereco: 'Rua das Flores, 123', created_at: '2024-01-15' },
  { id: 2, nome: 'João Santos', telefone: '(11) 98888-5678', endereco: 'Av. Principal, 456', created_at: '2024-01-20' },
  { id: 3, nome: 'Ana Costa', telefone: '(11) 97777-9012', endereco: 'Rua do Comércio, 789', created_at: '2024-02-01' },
  { id: 4, nome: 'Pedro Oliveira', telefone: '(11) 96666-3456', endereco: 'Praça Central, 321', created_at: '2024-02-10' },
];

let mockCrediarios: Crediario[] = [
  {
    id: 1,
    cliente_id: 1,
    cliente_nome: 'Maria Silva',
    data_emissao: '2024-01-15',
    data_vencimento_primeira: '2024-02-15',
    valor_total: 500.00,
    juros_diario: 0.50,
    numero_parcelas: 5,
    valor_parcela: 100.00,
    created_at: '2024-01-15'
  },
  {
    id: 2,
    cliente_id: 2,
    cliente_nome: 'João Santos',
    data_emissao: '2024-01-20',
    data_vencimento_primeira: '2024-02-20',
    valor_total: 800.00,
    juros_diario: 0.75,
    numero_parcelas: 4,
    valor_parcela: 200.00,
    created_at: '2024-01-20'
  },
  {
    id: 3,
    cliente_id: 3,
    cliente_nome: 'Ana Costa',
    data_emissao: '2024-02-01',
    data_vencimento_primeira: '2024-03-01',
    valor_total: 1200.00,
    juros_diario: 1.00,
    numero_parcelas: 6,
    valor_parcela: 200.00,
    created_at: '2024-02-01'
  }
];

let mockParcelas: Parcela[] = [
  // Maria Silva - Crediário 1
  { id: 1, crediario_id: 1, numero_parcela: 1, valor_original: 100.00, data_vencimento: '2024-02-15', status: 'paga', dias_atraso: 0 },
  { id: 2, crediario_id: 1, numero_parcela: 2, valor_original: 100.00, data_vencimento: '2024-03-15', status: 'pendente', dias_atraso: 0 },
  { id: 3, crediario_id: 1, numero_parcela: 3, valor_original: 100.00, data_vencimento: '2024-04-15', status: 'pendente', dias_atraso: 0 },
  { id: 4, crediario_id: 1, numero_parcela: 4, valor_original: 100.00, data_vencimento: '2024-05-15', status: 'pendente', dias_atraso: 0 },
  { id: 5, crediario_id: 1, numero_parcela: 5, valor_original: 100.00, data_vencimento: '2024-06-15', status: 'pendente', dias_atraso: 0 },
  
  // João Santos - Crediário 2
  { id: 6, crediario_id: 2, numero_parcela: 1, valor_original: 200.00, data_vencimento: '2024-02-20', status: 'paga', dias_atraso: 0 },
  { id: 7, crediario_id: 2, numero_parcela: 2, valor_original: 200.00, data_vencimento: '2024-01-20', status: 'pendente', dias_atraso: 0 }, // Atrasada
  { id: 8, crediario_id: 2, numero_parcela: 3, valor_original: 200.00, data_vencimento: '2024-04-20', status: 'pendente', dias_atraso: 0 },
  { id: 9, crediario_id: 2, numero_parcela: 4, valor_original: 200.00, data_vencimento: '2024-05-20', status: 'pendente', dias_atraso: 0 },
  
  // Ana Costa - Crediário 3
  { id: 10, crediario_id: 3, numero_parcela: 1, valor_original: 200.00, data_vencimento: '2024-03-01', status: 'pendente', dias_atraso: 0 },
  { id: 11, crediario_id: 3, numero_parcela: 2, valor_original: 200.00, data_vencimento: '2024-04-01', status: 'pendente', dias_atraso: 0 },
  { id: 12, crediario_id: 3, numero_parcela: 3, valor_original: 200.00, data_vencimento: '2024-05-01', status: 'pendente', dias_atraso: 0 },
  { id: 13, crediario_id: 3, numero_parcela: 4, valor_original: 200.00, data_vencimento: '2024-06-01', status: 'pendente', dias_atraso: 0 },
  { id: 14, crediario_id: 3, numero_parcela: 5, valor_original: 200.00, data_vencimento: '2024-07-01', status: 'pendente', dias_atraso: 0 },
  { id: 15, crediario_id: 3, numero_parcela: 6, valor_original: 200.00, data_vencimento: '2024-08-01', status: 'pendente', dias_atraso: 0 },
];

let nextId = {
  cliente: 5,
  crediario: 4,
  parcela: 16
};

export class MockDatabaseService {
  // Métodos para clientes
  async criarCliente(cliente: Cliente): Promise<number> {
    const novoCliente = {
      ...cliente,
      id: nextId.cliente++,
      created_at: new Date().toISOString().split('T')[0]
    };
    mockClientes.push(novoCliente);
    return novoCliente.id!;
  }

  async buscarClientes(): Promise<Cliente[]> {
    return [...mockClientes].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async buscarClientesPorNome(nome: string): Promise<Cliente[]> {
    return mockClientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(nome.toLowerCase())
    );
  }

  // Métodos para crediários
  async criarCrediario(crediario: Crediario): Promise<number> {
    const novoCrediario = {
      ...crediario,
      id: nextId.crediario++,
      created_at: new Date().toISOString().split('T')[0]
    };
    mockCrediarios.push(novoCrediario);
    return novoCrediario.id!;
  }

  async buscarCrediarios(): Promise<Crediario[]> {
    return [...mockCrediarios].sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  }

  // Métodos para parcelas
  async criarParcelas(parcelas: Parcela[]): Promise<void> {
    for (const parcela of parcelas) {
      const novaParcela = {
        ...parcela,
        id: nextId.parcela++,
        created_at: new Date().toISOString().split('T')[0]
      };
      mockParcelas.push(novaParcela);
    }
  }

  async buscarParcelasPorCliente(clienteNome: string): Promise<Parcela[]> {
    const crediarios = mockCrediarios.filter(c => 
      c.cliente_nome.toLowerCase().includes(clienteNome.toLowerCase())
    );
    
    const crediarioIds = crediarios.map(c => c.id!);
    
    return mockParcelas
      .filter(p => crediarioIds.includes(p.crediario_id) && p.status === 'pendente')
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }

  async quitarParcela(parcelaId: number, valorPago: number, diasAtraso: number): Promise<void> {
    const parcela = mockParcelas.find(p => p.id === parcelaId);
    if (parcela) {
      parcela.status = 'paga';
      parcela.data_pagamento = new Date().toISOString().split('T')[0];
      parcela.valor_pago = valorPago;
      parcela.dias_atraso = diasAtraso;
    }
  }

  async buscarParcelasEmAberto(): Promise<any[]> {
    return mockParcelas
      .filter(p => p.status === 'pendente')
      .map(parcela => {
        const crediario = mockCrediarios.find(c => c.id === parcela.crediario_id);
        return {
          ...parcela,
          cliente_nome: crediario?.cliente_nome || '',
          juros_diario: crediario?.juros_diario || 0
        };
      })
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }

  async buscarCrediarioPorId(id: number): Promise<Crediario | null> {
    return mockCrediarios.find(c => c.id === id) || null;
  }
}