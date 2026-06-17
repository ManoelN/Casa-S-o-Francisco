import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

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

export interface ConfiguracaoEmpresa {
  nome: string;
  endereco: string;
  telefone: string;
  avisoPersonalizado: string;
}

export class SupabaseService {
  private client = supabase;

  constructor() {}

  // Métodos para clientes
  async criarCliente(cliente: Cliente): Promise<number> {
    const { data, error } = await this.client
      .from('clientes')
      .insert({
        nome: cliente.nome,
        telefone: cliente.telefone || null,
        endereco: cliente.endereco || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Erro ao criar cliente');
    }

    return data.id;
  }

  async buscarClientes(): Promise<Cliente[]> {
    const { data, error } = await this.client
      .from('clientes')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error('Erro ao buscar clientes');
    }

    return data || [];
  }

  async buscarClientesPorNome(nome: string): Promise<Cliente[]> {
    const { data, error } = await this.client
      .from('clientes')
      .select('*')
      .ilike('nome', `%${nome}%`)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar clientes por nome:', error);
      throw new Error('Erro ao buscar clientes');
    }

    return data || [];
  }

  async buscarClientePorId(id: number): Promise<Cliente | null> {
    const { data, error } = await this.client
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Erro ao buscar cliente por ID:', error);
      throw new Error('Erro ao buscar cliente');
    }

    return data;
  }

  async atualizarCliente(id: number, dados: Partial<Cliente>): Promise<void> {
    const { error } = await this.client
      .from('clientes')
      .update(dados)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error('Erro ao atualizar cliente');
    }
  }

  // Métodos para crediários
  async criarCrediario(crediario: Crediario): Promise<number> {
    const { data, error } = await this.client
      .from('crediarios')
      .insert({
        cliente_id: crediario.cliente_id,
        cliente_nome: crediario.cliente_nome,
        data_emissao: crediario.data_emissao,
        data_vencimento_primeira: crediario.data_vencimento_primeira,
        valor_total: crediario.valor_total,
        juros_diario: crediario.juros_diario,
        numero_parcelas: crediario.numero_parcelas,
        valor_parcela: crediario.valor_parcela
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar crediário:', error);
      throw new Error('Erro ao criar crediário');
    }

    return data.id;
  }

  async buscarCrediarios(): Promise<Crediario[]> {
    const { data, error } = await this.client
      .from('crediarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar crediários:', error);
      throw new Error('Erro ao buscar crediários');
    }

    return data || [];
  }

  async buscarCrediarioPorId(id: number): Promise<Crediario | null> {
    const { data, error } = await this.client
      .from('crediarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Erro ao buscar crediário por ID:', error);
      throw new Error('Erro ao buscar crediário');
    }

    return data;
  }

  async buscarCrediariosPorCliente(clienteId: number): Promise<Crediario[]> {
    const { data, error } = await this.client
      .from('crediarios')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar crediários por cliente:', error);
      throw new Error('Erro ao buscar crediários');
    }

    return data || [];
  }

  // Métodos para parcelas
  async criarParcelas(parcelas: Parcela[]): Promise<void> {
    const parcelasInsert = parcelas.map(parcela => ({
      crediario_id: parcela.crediario_id,
      numero_parcela: parcela.numero_parcela,
      valor_original: parcela.valor_original,
      valor_restante: parcela.valor_original,
      valor_pago_parcial: 0,
      data_vencimento: parcela.data_vencimento,
      status: 'pendente',
      dias_atraso: 0
    }));

    const { error } = await supabase
      .from('parcelas')
      .insert(parcelasInsert);

    if (error) {
      console.error('Erro ao criar parcelas:', error);
      throw new Error('Erro ao criar parcelas');
    }
  }

  async buscarParcelasPorCliente(clienteNome: string): Promise<Parcela[]> {
    const { data, error } = await supabase
      .from('parcelas')
      .select(`
        *,
        crediarios!inner(cliente_nome, juros_diario)
      `)
      .ilike('crediarios.cliente_nome', `%${clienteNome}%`)
      .eq('status', 'pendente')
      .order('data_vencimento');

    if (error) {
      console.error('Erro ao buscar parcelas por cliente:', error);
      throw new Error('Erro ao buscar parcelas');
    }

    return data?.map(item => ({
      ...item,
      juros_diario: item.crediarios.juros_diario
    })) || [];
  }

  async buscarTodasParcelasPorCliente(clienteId: number): Promise<Parcela[]> {
    const { data, error } = await supabase
      .from('parcelas')
      .select(`
        *,
        crediarios!inner(cliente_id)
      `)
      .eq('crediarios.cliente_id', clienteId)
      .order('data_vencimento');

    if (error) {
      console.error('Erro ao buscar todas as parcelas por cliente:', error);
      throw new Error('Erro ao buscar parcelas');
    }

    return data || [];
  }

  async quitarParcela(parcelaId: number, valorPago: number, diasAtraso: number, isPagamentoParcial: boolean = false): Promise<void> {
    // Buscar parcela atual
    const { data: parcelaAtual, error: errorBusca } = await supabase
      .from('parcelas')
      .select('*')
      .eq('id', parcelaId)
      .single();

    if (errorBusca) {
      console.error('Erro ao buscar parcela:', errorBusca);
      throw new Error('Erro ao buscar parcela');
    }

    const valorPagoAnterior = parcelaAtual.valor_pago_parcial || 0;
    const novoValorPago = valorPagoAnterior + valorPago;
    const valorRestante = parcelaAtual.valor_original - novoValorPago;

    let updateData: any = {
      valor_pago_parcial: novoValorPago,
      valor_restante: Math.max(0, valorRestante),
      dias_atraso: diasAtraso
    };

    if (!isPagamentoParcial || valorRestante <= 0) {
      // Pagamento total - quitar parcela
      updateData = {
        ...updateData,
        status: 'paga',
        data_pagamento: new Date().toISOString().split('T')[0],
        valor_pago: novoValorPago,
        valor_restante: 0
      };
    }

    const { error } = await supabase
      .from('parcelas')
      .update(updateData)
      .eq('id', parcelaId);

    if (error) {
      console.error('Erro ao quitar parcela:', error);
      throw new Error('Erro ao quitar parcela');
    }
  }

  async buscarParcelasEmAberto(): Promise<any[]> {
    const { data, error } = await supabase
      .from('parcelas')
      .select(`
        *,
        crediarios!inner(cliente_nome, juros_diario)
      `)
      .eq('status', 'pendente')
      .order('data_vencimento');

    if (error) {
      console.error('Erro ao buscar parcelas em aberto:', error);
      throw new Error('Erro ao buscar parcelas em aberto');
    }

    return data?.map(item => ({
      ...item,
      cliente_nome: item.crediarios.cliente_nome,
      juros_diario: item.crediarios.juros_diario
    })) || [];
  }

  async buscarParcelasPagas(): Promise<any[]> {
    const { data, error } = await supabase
      .from('parcelas')
      .select(`
        *,
        crediarios!inner(cliente_nome, juros_diario)
      `)
      .eq('status', 'paga')
      .order('data_pagamento', { ascending: false });

    if (error) {
      console.error('Erro ao buscar parcelas pagas:', error);
      throw new Error('Erro ao buscar parcelas pagas');
    }

    return data?.map(item => ({
      ...item,
      cliente_nome: item.crediarios.cliente_nome,
      juros_diario: item.crediarios.juros_diario
    })) || [];
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
    // Buscar contadores
    const [
      { count: totalClientes },
      { count: totalCrediarios },
      { count: totalParcelas },
      { count: parcelasPagas },
      { count: parcelasEmAberto }
    ] = await Promise.all([
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      supabase.from('crediarios').select('*', { count: 'exact', head: true }),
      supabase.from('parcelas').select('*', { count: 'exact', head: true }),
      supabase.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'paga'),
      supabase.from('parcelas').select('*', { count: 'exact', head: true }).eq('status', 'pendente')
    ]);

    // Buscar valores
    const { data: crediarios } = await supabase.from('crediarios').select('valor_total');
    const { data: parcelasPagasData } = await supabase.from('parcelas').select('valor_pago, valor_original').eq('status', 'paga');
    const { data: parcelasAbertasData } = await supabase.from('parcelas').select('valor_original').eq('status', 'pendente');

    const valorTotalCrediarios = crediarios?.reduce((sum, c) => sum + c.valor_total, 0) || 0;
    const valorTotalPago = parcelasPagasData?.reduce((sum, p) => sum + (p.valor_pago || p.valor_original), 0) || 0;
    const valorTotalEmAberto = parcelasAbertasData?.reduce((sum, p) => sum + p.valor_original, 0) || 0;

    return {
      totalClientes: totalClientes || 0,
      totalCrediarios: totalCrediarios || 0,
      totalParcelas: totalParcelas || 0,
      parcelasPagas: parcelasPagas || 0,
      parcelasEmAberto: parcelasEmAberto || 0,
      valorTotalCrediarios,
      valorTotalPago,
      valorTotalEmAberto
    };
  }

  // Métodos para configurações
  async salvarConfiguracoes(config: ConfiguracaoEmpresa): Promise<void> {
    const { error } = await supabase
      .from('configuracoes')
      .upsert({
        id: 1,
        nome: config.nome,
        endereco: config.endereco,
        telefone: config.telefone,
        aviso_personalizado: config.avisoPersonalizado,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao salvar configurações:', error);
      throw new Error('Erro ao salvar configurações');
    }
  }

  async buscarConfiguracoes(): Promise<ConfiguracaoEmpresa | null> {
    const { data, error } = await this.client
      .from('configuracoes')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Erro ao buscar configurações:', error);
      throw new Error('Erro ao buscar configurações');
    }

    return {
      nome: data.nome,
      endereco: data.endereco || '',
      telefone: data.telefone || '',
      avisoPersonalizado: data.aviso_personalizado || ''
    };
  }
}