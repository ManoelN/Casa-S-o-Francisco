import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { useSupabase } from '@/context/SupabaseContext';
import { Parcela, Crediario, Cliente } from '@/services/supabaseService';
import { calcularDiasAtraso, formatDateBR } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/validation';
import { Check, Search, TriangleAlert as AlertTriangle, CreditCard, User, Calendar, DollarSign, Clock, FileText } from 'lucide-react-native';

interface ParcelaComJuros extends Parcela {
  valor_com_juros: number;
  valor_restante_com_juros: number;
  juros_diario: number;
  cliente_nome: string;
  selecionada: boolean;
}

interface ClienteInfo {
  cliente: Cliente;
  crediarios: Crediario[];
  totalParcelas: number;
  parcelasPagas: number;
  parcelasAtrasadas: number;
  valorTotal: number;
  valorPago: number;
  valorEmAberto: number;
}

export default function BaixaScreen() {
  const { supabaseService, isReady } = useSupabase();
  const [busca, setBusca] = useState('');
  const [parcelas, setParcelas] = useState<ParcelaComJuros[]>([]);
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [diasAtraso, setDiasAtraso] = useState<Record<number, number>>({});
  const [valoresPagamento, setValoresPagamento] = useState<Record<number, string>>({});
  const [showPartialPayment, setShowPartialPayment] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (busca.trim().length > 2) {
      buscarClienteEParcelas();
    } else {
      setParcelas([]);
      setClienteInfo(null);
    }
  }, [busca]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (busca.trim().length > 2) {
      await buscarClienteEParcelas();
    }
    setRefreshing(false);
  };

  const buscarClienteEParcelas = async () => {
    setLoading(true);
    try {
      // Buscar cliente
      const clientes = await supabaseService.buscarClientesPorNome(busca);
      if (clientes.length === 0) {
        setParcelas([]);
        setClienteInfo(null);
        setLoading(false);
        return;
      }
      
      const cliente = clientes[0];
      
      // Buscar crediários do cliente
      const crediariosCliente = await supabaseService.buscarCrediariosPorCliente(cliente.id!);
      
      // Buscar parcelas em aberto
      const result = await supabaseService.buscarParcelasPorCliente(busca);
      
      const parcelasComJuros: ParcelaComJuros[] = await Promise.all(
        result.map(async (parcela) => {
          const crediario = await supabaseService.buscarCrediarioPorId(parcela.crediario_id);
          const diasAtrasoCalculado = calcularDiasAtraso(parcela.data_vencimento);
          const valorRestante = parcela.valor_restante || parcela.valor_original;
          const jurosDiario = crediario?.juros_diario || 0;
          const valorComJuros = parcela.valor_original + (diasAtrasoCalculado * jurosDiario);
          const valorRestanteComJuros = valorRestante + (diasAtrasoCalculado * jurosDiario);
          
          return {
            ...parcela,
            valor_com_juros: valorComJuros,
            valor_restante_com_juros: valorRestanteComJuros,
            juros_diario: jurosDiario,
            cliente_nome: cliente.nome,
            selecionada: false,
          };
        })
      );
      
      // Calcular estatísticas do cliente
      const todasParcelasCliente = await supabaseService.buscarTodasParcelasPorCliente(cliente.id!);
      const totalParcelas = crediariosCliente.reduce((sum, c) => sum + c.numero_parcelas, 0);
      const parcelasPagas = todasParcelasCliente.filter(p => p.status === 'paga').length;
      const parcelasAtrasadas = parcelasComJuros.filter(p => calcularDiasAtraso(p.data_vencimento) > 0).length;
      const valorTotal = crediariosCliente.reduce((sum, c) => sum + c.valor_total, 0);
      const valorPago = todasParcelasCliente
        .filter(p => p.status === 'paga')
        .reduce((sum, p) => sum + (p.valor_pago || p.valor_original), 0);
      const valorEmAberto = parcelasComJuros.reduce((sum, p) => sum + p.valor_original, 0);
      
      setClienteInfo({
        cliente,
        crediarios: crediariosCliente,
        totalParcelas,
        parcelasPagas,
        parcelasAtrasadas,
        valorTotal,
        valorPago,
        valorEmAberto,
      });
      
      setParcelas(parcelasComJuros);
      
      // Inicializar dias de atraso
      const novosDiasAtraso: Record<number, number> = {};
      parcelasComJuros.forEach(parcela => {
        if (parcela.id) {
          novosDiasAtraso[parcela.id] = calcularDiasAtraso(parcela.data_vencimento);
        }
      });
      setDiasAtraso(novosDiasAtraso);
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      Alert.alert('Erro', 'Erro ao buscar dados do cliente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecaoParcela = (parcelaId: number) => {
    setParcelas(prev => 
      prev.map(parcela => 
        parcela.id === parcelaId 
          ? { ...parcela, selecionada: !parcela.selecionada }
          : parcela
      )
    );
  };

  const atualizarDiasAtraso = (parcelaId: number, dias: number) => {
    setDiasAtraso(prev => ({ ...prev, [parcelaId]: dias }));
    
    setParcelas(prev =>
      prev.map(parcela =>
        parcela.id === parcelaId
          ? { 
              ...parcela, 
              valor_com_juros: parcela.valor_original + (dias * parcela.juros_diario),
              valor_restante_com_juros: (parcela.valor_restante || parcela.valor_original) + (dias * parcela.juros_diario)
            }
          : parcela
      )
    );
  };

  const atualizarValorPagamento = (parcelaId: number, valor: string) => {
    setValoresPagamento(prev => ({ ...prev, [parcelaId]: valor }));
  };

  const togglePagamentoParcial = (parcelaId: number) => {
    setShowPartialPayment(prev => ({ 
      ...prev, 
      [parcelaId]: !prev[parcelaId] 
    }));
    
    // Resetar valor quando esconder
    if (showPartialPayment[parcelaId]) {
      setValoresPagamento(prev => ({ ...prev, [parcelaId]: '' }));
    }
  };

  const darBaixa = async () => {
    const parcelasSelecionadas = parcelas.filter(p => p.selecionada);
    if (parcelasSelecionadas.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos uma parcela para dar baixa.');
      return;
    }
    
    setLoading(true);
    
    try {
      for (const parcela of parcelasSelecionadas) {
        if (parcela.id) {
          const dias = diasAtraso[parcela.id] || 0;
          const valorPersonalizado = valoresPagamento[parcela.id];
          
          if (valorPersonalizado && parseFloat(valorPersonalizado) > 0) {
            // Pagamento parcial
            const valorPagar = parseFloat(valorPersonalizado);
            const valorRestante = (parcela.valor_restante || parcela.valor_original);
            const isPagamentoParcial = valorPagar < valorRestante;
            
            await supabaseService.quitarParcela(parcela.id, valorPagar, dias, isPagamentoParcial);
          } else {
            // Pagamento total
            const valorPagar = parcela.valor_restante_com_juros;
            await supabaseService.quitarParcela(parcela.id, valorPagar, dias, false);
          }
        }
      }
      
      Alert.alert('Sucesso', `${parcelasSelecionadas.length} parcela(s) quitada(s) com sucesso!`);
      
      // Recarregar dados
      await buscarClienteEParcelas();
      
    } catch (error) {
      console.error('Erro ao dar baixa:', error);
      Alert.alert('Erro', 'Erro ao dar baixa nas parcelas.');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotalComJuros = (): number => {
    return parcelas
      .filter(p => p.selecionada)
      .reduce((total, parcela) => {
        if (parcela.id) {
          const valorPersonalizado = valoresPagamento[parcela.id];
          const valorPagar = valorPersonalizado && parseFloat(valorPersonalizado) > 0 
            ? parseFloat(valorPersonalizado)
            : parcela.valor_restante_com_juros;
          return total + valorPagar;
        }
        return total + parcela.valor_restante_com_juros;
      }, 0);
  };

  if (!isReady) {
    return (
      <LoadingSpinner message="Inicializando sistema..." />
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Search size={32} color="#ffffff" />
        </View>
        <Text style={styles.title}>Baixa de Contas</Text>
        <Text style={styles.subtitle}>Busque um cliente para ver as informações completas</Text>
      </View>
      
      <View style={styles.content}>
        <Card variant="elevated">
          <Input
            label="🔍 Buscar Cliente"
            value={busca}
            onChangeText={setBusca}
            placeholder="Digite o nome do cliente"
          />
        </Card>
        
        {loading && (
          <LoadingSpinner message="Buscando dados..." size="small" />
        )}
        
        {clienteInfo && (
          <Card variant="elevated" style={styles.clienteCard}>
            <View style={styles.clienteHeader}>
              <View style={styles.clienteIconContainer}>
                <User size={32} color="#2563eb" />
              </View>
              <View style={styles.clienteHeaderInfo}>
                <Text style={styles.clienteNome}>{clienteInfo.cliente.nome}</Text>
                <Text style={styles.clienteSubtitle}>Informações do Cliente</Text>
              </View>
            </View>
            
            <View style={styles.clienteDetails}>
              {clienteInfo.cliente.telefone && (
                <View style={styles.clienteDetailRow}>
                  <Text style={styles.clienteDetailLabel}>📞 Telefone:</Text>
                  <Text style={styles.clienteDetailValue}>{clienteInfo.cliente.telefone}</Text>
                </View>
              )}
              
              {clienteInfo.cliente.endereco && (
                <View style={styles.clienteDetailRow}>
                  <Text style={styles.clienteDetailLabel}>📍 Endereço:</Text>
                  <Text style={styles.clienteDetailValue}>{clienteInfo.cliente.endereco}</Text>
                </View>
              )}
              
              <View style={styles.clienteDetailRow}>
                <Text style={styles.clienteDetailLabel}>📅 Cliente desde:</Text>
                <Text style={styles.clienteDetailValue}>
                  {new Date(clienteInfo.cliente.created_at || '').toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>📊 Resumo Financeiro</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <FileText size={20} color="#2563eb" />
                  <Text style={styles.statValue}>{clienteInfo.crediarios.length}</Text>
                  <Text style={styles.statLabel}>Crediários</Text>
                </View>
                
                <View style={styles.statItem}>
                  <CreditCard size={20} color="#059669" />
                  <Text style={styles.statValue}>{clienteInfo.parcelasPagas}</Text>
                  <Text style={styles.statLabel}>Pagas</Text>
                </View>
                
                <View style={styles.statItem}>
                  <AlertTriangle size={20} color="#dc2626" />
                  <Text style={styles.statValue}>{clienteInfo.parcelasAtrasadas}</Text>
                  <Text style={styles.statLabel}>Atrasadas</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Clock size={20} color="#f59e0b" />
                  <Text style={styles.statValue}>{parcelas.length}</Text>
                  <Text style={styles.statLabel}>Em Aberto</Text>
                </View>
              </View>
              
              <View style={styles.valoresContainer}>
                <View style={styles.valorRow}>
                  <Text style={styles.valorLabel}>💰 Valor Total dos Crediários:</Text>
                  <Text style={styles.valorValue}>{formatCurrency(clienteInfo.valorTotal)}</Text>
                </View>
                
                <View style={styles.valorRow}>
                  <Text style={styles.valorLabel}>✅ Valor Pago:</Text>
                  <Text style={[styles.valorValue, styles.valorPago]}>{formatCurrency(clienteInfo.valorPago)}</Text>
                </View>
                
                <View style={styles.valorRow}>
                  <Text style={styles.valorLabel}>⏳ Valor em Aberto:</Text>
                  <Text style={[styles.valorValue, styles.valorAberto]}>{formatCurrency(clienteInfo.valorEmAberto)}</Text>
                </View>
              </View>
            </View>
          </Card>
        )}
        
        {parcelas.length > 0 && (
          <>
            <Card variant="elevated">
              <View style={styles.sectionHeader}>
                <CreditCard size={20} color="#059669" />
                <Text style={styles.sectionTitle}>Parcelas em Aberto ({parcelas.length})</Text>
              </View>
              
              {parcelas.map((parcela) => (
                <Card key={parcela.id} style={styles.parcelaCard}>
                  <TouchableOpacity
                    style={styles.parcelaHeader}
                    onPress={() => parcela.id && toggleSelecaoParcela(parcela.id)}
                  >
                    <View style={styles.parcelaInfo}>
                      <Text style={styles.parcelaNumero}>
                        📄 Parcela {parcela.numero_parcela}
                      </Text>
                      <Text style={styles.parcelaData}>
                        📅 Vencimento: {formatDateBR(parcela.data_vencimento)}
                      </Text>
                      {calcularDiasAtraso(parcela.data_vencimento) > 0 && (
                        <View style={styles.atrasoBadge}>
                          <AlertTriangle size={12} color="#dc2626" />
                          <Text style={styles.atrasoText}>
                            {calcularDiasAtraso(parcela.data_vencimento)} dias em atraso
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.checkbox}>
                      {parcela.selecionada ? (
                        <View style={styles.checkboxSelected}>
                          <Check size={16} color="#ffffff" />
                        </View>
                      ) : (
                        <View style={styles.checkboxEmpty} />
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.parcelaDetails}>
                    <View style={styles.valorRow}>
                      <Text style={styles.valorLabel}>Valor Original:</Text>
                      <Text style={styles.valorValue}>
                        {formatCurrency(parcela.valor_original)}
                      </Text>
                    </View>
                    
                    {(parcela.valor_pago_parcial || 0) > 0 && (
                      <>
                        <View style={styles.valorRow}>
                          <Text style={styles.valorLabel}>Valor Já Pago:</Text>
                          <Text style={[styles.valorValue, styles.valorPago]}>
                            {formatCurrency(parcela.valor_pago_parcial || 0)}
                          </Text>
                        </View>
                        
                        <View style={styles.valorRow}>
                          <Text style={styles.valorLabel}>Valor Restante:</Text>
                          <Text style={[styles.valorValue, styles.valorAberto]}>
                            {formatCurrency(parcela.valor_restante || parcela.valor_original)}
                          </Text>
                        </View>
                      </>
                    )}
                    
                    <View style={styles.diasAtrasoContainer}>
                      <Text style={styles.diasAtrasoLabel}>Dias de Atraso:</Text>
                      <Input
                        value={parcela.id ? diasAtraso[parcela.id]?.toString() || '0' : '0'}
                        onChangeText={(text) => 
                          parcela.id && atualizarDiasAtraso(parcela.id, parseInt(text) || 0)
                        }
                        keyboardType="numeric"
                        style={styles.diasAtrasoInput}
                      />
                    </View>
                    
                    <View style={styles.valorRow}>
                      <Text style={styles.valorLabel}>Valor Restante + Juros:</Text>
                      <Text style={[styles.valorValue, styles.valorComJuros]}>
                        {formatCurrency(parcela.valor_restante_com_juros)}
                      </Text>
                    </View>
                    
                    <View style={styles.pagamentoOptions}>
                      <TouchableOpacity
                        style={styles.pagamentoParcialButton}
                        onPress={() => parcela.id && togglePagamentoParcial(parcela.id)}
                      >
                        <Text style={styles.pagamentoParcialText}>
                          {parcela.id && showPartialPayment[parcela.id] ? '❌ Cancelar Pagamento Parcial' : '💰 Pagamento Parcial'}
                        </Text>
                      </TouchableOpacity>
                      
                      {parcela.id && showPartialPayment[parcela.id] && (
                        <View style={styles.valorPersonalizadoContainer}>
                          <Input
                            label="Valor a Pagar"
                            value={valoresPagamento[parcela.id] || ''}
                            onChangeText={(text) => atualizarValorPagamento(parcela.id!, text)}
                            placeholder="0,00"
                            keyboardType="numeric"
                            style={styles.valorPersonalizadoInput}
                          />
                          <Text style={styles.valorPersonalizadoHint}>
                            💡 Deixe vazio para quitar completamente a parcela
                          </Text>
                          <Text style={styles.valorPersonalizadoHint}>
                            💰 Valor restante: {formatCurrency(parcela.valor_restante || parcela.valor_original)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </Card>
            
            <Card variant="elevated" style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Selecionado:</Text>
                <Text style={[styles.summaryValue, styles.totalSelecionado]}>
                  {formatCurrency(calcularTotalComJuros())}
                </Text>
              </View>
            </Card>
            
            <Button
              title={loading ? "Processando..." : "💰 Dar Baixa"}
              onPress={darBaixa}
              disabled={loading || parcelas.filter(p => p.selecionada).length === 0}
              variant="success"
              style={styles.baixaButton}
            />
          </>
        )}
        
        {busca.trim().length > 2 && !clienteInfo && !loading && (
          <EmptyState
            icon={<Search size={48} color="#6b7280" />}
            title="Cliente não encontrado"
            description={`Não foi encontrado nenhum cliente com o nome "${busca}"`}
          />
        )}
        
        {busca.trim().length <= 2 && (
          <EmptyState
            icon={<Search size={48} color="#6b7280" />}
            title="Digite o nome do cliente"
            description="Digite pelo menos 3 caracteres para buscar as informações do cliente"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#059669',
    padding: 24,
    paddingTop: 64,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#d1fae5',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    padding: 24,
  },
  clienteCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  clienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clienteIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#eff6ff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clienteHeaderInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clienteSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  clienteDetails: {
    marginBottom: 16,
  },
  clienteDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  clienteDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  clienteDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    textAlign: 'right',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  valoresContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  valorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valorLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  valorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  valorPago: {
    color: '#059669',
  },
  valorAberto: {
    color: '#f59e0b',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  parcelaCard: {
    marginBottom: 8,
  },
  parcelaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  parcelaInfo: {
    flex: 1,
  },
  parcelaNumero: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  parcelaData: {
    fontSize: 14,
    color: '#6b7280',
  },
  atrasoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  atrasoText: {
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 4,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    width: 20,
    height: 20,
    backgroundColor: '#059669',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
  },
  parcelaDetails: {
    padding: 16,
  },
  diasAtrasoContainer: {
    marginBottom: 8,
  },
  diasAtrasoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  diasAtrasoInput: {
    textAlign: 'center',
    marginBottom: 0,
  },
  valorComJuros: {
    color: '#dc2626',
  },
  pagamentoOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  pagamentoParcialButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pagamentoParcialText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  valorPersonalizadoContainer: {
    marginTop: 8,
  },
  valorPersonalizadoInput: {
    marginBottom: 4,
  },
  valorPersonalizadoHint: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalSelecionado: {
    color: '#059669',
    fontSize: 18,
  },
  baixaButton: {
    marginTop: 16,
    paddingVertical: 16,
  },
});