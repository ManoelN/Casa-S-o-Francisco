import AsyncStorage from '@react-native-async-storage/async-storage';

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
  valor_restante?: number;
  valor_pago_parcial?: number;
  data_vencimento: string;
  status: 'pendente' | 'paga';
  data_pagamento?: string;
  valor_pago?: number;
  dias_atraso: number;
  created_at?: string;
}

const STORAGE_KEYS = {
  CLIENTES: '@crediario:clientes',
  CREDIARIOS: '@crediario:crediarios',
  PARCELAS: '@crediario:parcelas',
  COUNTERS: '@crediario:counters',
  CONFIGURACOES: '@crediario:configuracoes'
};

interface Counters {
  cliente: number;
  crediario: number;
  parcela: number;
}

export interface ConfiguracaoEmpresa {
  nome: string;
  endereco: string;
  telefone: string;
  avisoPersonalizado: string;
}

export class LocalStorageService {
  // Métodos auxiliares para AsyncStorage
  private async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Erro ao buscar ${key}:`, error);
      return defaultValue;
    }
  }

  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
      throw error;
    }
  }

  private async getCounters(): Promise<Counters> {
    return this.getItem(STORAGE_KEYS.COUNTERS, { cliente: 1, crediario: 1, parcela: 1 });
  }

  private async updateCounters(counters: Partial<Counters>): Promise<void> {
    const current = await this.getCounters();
    await this.setItem(STORAGE_KEYS.COUNTERS, { ...current, ...counters });
  }

  // Métodos para clientes
  async criarCliente(cliente: Cliente): Promise<number> {
    const clientes = await this.getItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
    const counters = await this.getCounters();
    
    const novoCliente: Cliente = {
      ...cliente,
      id: counters.cliente,
      created_at: new Date().toISOString().split('T')[0]
    };
    
    clientes.push(novoCliente);
    await this.setItem(STORAGE_KEYS.CLIENTES, clientes);
    await this.updateCounters({ cliente: counters.cliente + 1 });
    
    return novoCliente.id!;
  }

  async buscarClientes(): Promise<Cliente[]> {
    const clientes = await this.getItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
    return clientes.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async buscarClientesPorNome(nome: string): Promise<Cliente[]> {
    const clientes = await this.getItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
    return clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(nome.toLowerCase())
    );
  }

  async buscarClientePorId(id: number): Promise<Cliente | null> {
    const clientes = await this.getItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
    return clientes.find(c => c.id === id) || null;
  }

  async atualizarCliente(id: number, dados: Partial<Cliente>): Promise<void> {
    const clientes = await this.getItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
    const clienteIndex = clientes.findIndex(c => c.id === id);
    
    if (clienteIndex !== -1) {
      clientes[clienteIndex] = { ...clientes[clienteIndex], ...dados };
      await this.setItem(STORAGE_KEYS.CLIENTES, clientes);
    }
  }

  // Métodos para crediários
  async criarCrediario(crediario: Crediario): Promise<number> {
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    const counters = await this.getCounters();
    
    const novoCrediario: Crediario = {
      ...crediario,
      id: counters.crediario,
      created_at: new Date().toISOString().split('T')[0]
    };
    
    crediarios.push(novoCrediario);
    await this.setItem(STORAGE_KEYS.CREDIARIOS, crediarios);
    await this.updateCounters({ crediario: counters.crediario + 1 });
    
    return novoCrediario.id!;
  }

  async buscarCrediarios(): Promise<Crediario[]> {
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    return crediarios.sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  }

  async buscarCrediarioPorId(id: number): Promise<Crediario | null> {
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    return crediarios.find(c => c.id === id) || null;
  }

  async buscarCrediariosPorCliente(clienteId: number): Promise<Crediario[]> {
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    return crediarios.filter(c => c.cliente_id === clienteId);
  }

  async buscarParcelasPorCrediario(crediarioId: number): Promise<Parcela[]> {
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    return parcelas
      .filter(p => p.crediario_id === crediarioId)
      .sort((a, b) => a.numero_parcela - b.numero_parcela);
  }

  // Métodos para parcelas
  async criarParcelas(parcelas: Parcela[]): Promise<void> {
    const parcelasExistentes = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    const counters = await this.getCounters();
    let nextParcelaId = counters.parcela;
    
    const novasParcelas = parcelas.map(parcela => ({
      ...parcela,
      id: nextParcelaId++,
      valor_restante: parcela.valor_original,
      valor_pago_parcial: 0,
      created_at: new Date().toISOString().split('T')[0]
    }));
    
    parcelasExistentes.push(...novasParcelas);
    await this.setItem(STORAGE_KEYS.PARCELAS, parcelasExistentes);
    await this.updateCounters({ parcela: nextParcelaId });
  }

  async buscarParcelasPorCliente(clienteNome: string): Promise<Parcela[]> {
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    
    const crediarios_cliente = crediarios.filter(c => 
      c.cliente_nome.toLowerCase().includes(clienteNome.toLowerCase())
    );
    
    const crediarioIds = crediarios_cliente.map(c => c.id!);
    
    return parcelas
      .filter(p => crediarioIds.includes(p.crediario_id) && p.status === 'pendente')
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }

  async buscarTodasParcelasPorCliente(clienteId: number): Promise<Parcela[]> {
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    
    const crediarios_cliente = crediarios.filter(c => c.cliente_id === clienteId);
    const crediarioIds = crediarios_cliente.map(c => c.id!);
    
    return parcelas
      .filter(p => crediarioIds.includes(p.crediario_id))
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }

  async buscarParcelasPorCrediario(crediarioId: number): Promise<Parcela[]> {
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    return parcelas
      .filter(p => p.crediario_id === crediarioId)
      .sort((a, b) => a.numero_parcela - b.numero_parcela);
  }

  async quitarParcela(parcelaId: number, valorPago: number, diasAtraso: number, isPagamentoParcial: boolean = false): Promise<void> {
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    const parcelaIndex = parcelas.findIndex(p => p.id === parcelaId);
    
    if (parcelaIndex !== -1) {
      const parcela = parcelas[parcelaIndex];
      const valorPagoAnterior = parcela.valor_pago_parcial || 0;
      const novoValorPago = valorPagoAnterior + valorPago;
      const valorRestante = parcela.valor_original - novoValorPago;
      
      if (isPagamentoParcial && valorRestante > 0) {
        // Pagamento parcial - mantém parcela pendente
        parcelas[parcelaIndex] = {
          ...parcela,
          valor_pago_parcial: novoValorPago,
          valor_restante: valorRestante,
          dias_atraso: diasAtraso
        };
      } else {
        // Pagamento total - quita a parcela
        parcelas[parcelaIndex] = {
          ...parcela,
          status: 'paga',
          data_pagamento: new Date().toISOString().split('T')[0],
          valor_pago: novoValorPago,
          valor_pago_parcial: novoValorPago,
          valor_restante: 0,
          dias_atraso: diasAtraso
        };
      }
      
      await this.setItem(STORAGE_KEYS.PARCELAS, parcelas);
    }
  }

  async buscarParcelasEmAberto(): Promise<any[]> {
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    
    return parcelas
      .filter(p => p.status === 'pendente')
      .map(parcela => {
        const crediario = crediarios.find(c => c.id === parcela.crediario_id);
        return {
          ...parcela,
          cliente_nome: crediario?.cliente_nome || '',
          juros_diario: crediario?.juros_diario || 0
        };
      })
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }

  async buscarParcelasPagas(): Promise<any[]> {
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    
    return parcelas
      .filter(p => p.status === 'paga')
      .map(parcela => {
        const crediario = crediarios.find(c => c.id === parcela.crediario_id);
        return {
          ...parcela,
          cliente_nome: crediario?.cliente_nome || '',
          juros_diario: crediario?.juros_diario || 0
        };
      })
      .sort((a, b) => new Date(b.data_pagamento || '').getTime() - new Date(a.data_pagamento || '').getTime());
  }

  // Métodos para relatórios
  async gerarEstatisticas(): Promise<{
    totalClientes: number;
    totalCrediarios: number;
    totalParcelas: number;
    parcelasPagas: number;
    parcelasEmAberto: number;
    valorTotalCrediarios: number;
    valorTotalPago: number;
    valorTotalEmAberto: number;
  }> {
    const clientes = await this.getItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    
    const parcelasPagas = parcelas.filter(p => p.status === 'paga');
    const parcelasEmAberto = parcelas.filter(p => p.status === 'pendente');
    
    const valorTotalCrediarios = crediarios.reduce((sum, c) => sum + c.valor_total, 0);
    const valorTotalPago = parcelasPagas.reduce((sum, p) => sum + (p.valor_pago || p.valor_original), 0);
    const valorTotalEmAberto = parcelasEmAberto.reduce((sum, p) => sum + p.valor_original, 0);
    
    const stats = {
      totalClientes: clientes.length,
      totalCrediarios: crediarios.length,
      totalParcelas: parcelas.length,
      parcelasPagas: parcelasPagas.length,
      parcelasEmAberto: parcelasEmAberto.length,
      valorTotalCrediarios,
      valorTotalPago,
      valorTotalEmAberto
    };
    
    console.log('📊 Estatísticas geradas:', stats);
    
    return stats;
  }

  // Método para limpar todos os dados (útil para testes)
  async limparTodosDados(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CLIENTES,
      STORAGE_KEYS.CREDIARIOS,
      STORAGE_KEYS.PARCELAS,
      STORAGE_KEYS.COUNTERS
    ]);
  }

  // Método para exportar dados (backup)
  async exportarDados(): Promise<{
    clientes: Cliente[];
    crediarios: Crediario[];
    parcelas: Parcela[];
    counters: Counters;
  }> {
    const clientes = await this.getItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []);
    const crediarios = await this.getItem<Crediario[]>(STORAGE_KEYS.CREDIARIOS, []);
    const parcelas = await this.getItem<Parcela[]>(STORAGE_KEYS.PARCELAS, []);
    const counters = await this.getCounters();
    
    return { clientes, crediarios, parcelas, counters };
  }

  // Método para importar dados (restore)
  async importarDados(dados: {
    clientes: Cliente[];
    crediarios: Crediario[];
    parcelas: Parcela[];
    counters: Counters;
  }): Promise<void> {
    await this.setItem(STORAGE_KEYS.CLIENTES, dados.clientes);
    await this.setItem(STORAGE_KEYS.CREDIARIOS, dados.crediarios);
    await this.setItem(STORAGE_KEYS.PARCELAS, dados.parcelas);
    await this.setItem(STORAGE_KEYS.COUNTERS, dados.counters);
  }

  // Métodos para configurações
  async salvarConfiguracoes(config: ConfiguracaoEmpresa): Promise<void> {
    await this.setItem(STORAGE_KEYS.CONFIGURACOES, config);
  }

  async buscarConfiguracoes(): Promise<ConfiguracaoEmpresa | null> {
    return this.getItem<ConfiguracaoEmpresa | null>(STORAGE_KEYS.CONFIGURACOES, null);
  }
}