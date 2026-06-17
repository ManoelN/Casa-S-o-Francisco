import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSupabase } from '@/context/SupabaseContext';
import { Parcela, Cliente, Crediario } from '@/services/supabaseService';
import { calcularDiasAtraso, formatDateBR } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/validation';
import { ChartBar as BarChart3, Download, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Eye, X } from 'lucide-react-native';

interface RelatorioData {
  totalClientes: number;
  totalCrediarios: number;
  parcelasPagas: number;
  parcelasEmAberto: number;
  valorTotalCrediarios: number;
  valorPago: number;
  valorEmAberto: number;
}

interface ClienteDetalhado {
  cliente: Cliente;
  crediarios: Crediario[];
  parcelas: any[];
  parcelasPagas: number;
  parcelasAbertas: number;
  parcelasAtrasadas: number;
  valorTotal: number;
  valorPago: number;
  valorAberto: number;
  valorAtrasado: number;
  situacao: string;
}

export default function RelatoriosScreen() {
  const { supabaseService, isReady } = useSupabase();
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
  const [parcelasAtrasadas, setParcelasAtrasadas] = useState<any[]>([]);
  const [clientesDetalhados, setClientesDetalhados] = useState<ClienteDetalhado[]>([]);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady) {
      carregarRelatorio();
    }
  }, [isReady]);

  const carregarRelatorio = async () => {
    setLoading(true);
    try {
      // Buscar estatísticas reais do armazenamento local
      const stats = await supabaseService.gerarEstatisticas();
      const parcelasEmAberto = await supabaseService.buscarParcelasEmAberto();
      const parcelasAtrasadas = parcelasEmAberto.filter(p => calcularDiasAtraso(p.data_vencimento) > 0);
      
      // Buscar dados completos para visualização detalhada
      const todosClientes = await supabaseService.buscarClientes();
      const todosCrediarios = await supabaseService.buscarCrediarios();
      const parcelasPagas = await supabaseService.buscarParcelasPagas();
      const todasParcelas = [...parcelasEmAberto, ...parcelasPagas];
      
      // Agrupar dados por cliente
      const clientesComDados = todosClientes.map(cliente => {
        const crediariosCliente = todosCrediarios.filter(c => c.cliente_id === cliente.id);
        const parcelasCliente = todasParcelas.filter(p => 
          crediariosCliente.some(c => c.id === p.crediario_id)
        );
        
        const parcelasPagasCliente = parcelasCliente.filter(p => p.status === 'paga');
        const parcelasAbertasCliente = parcelasCliente.filter(p => p.status === 'pendente');
        const parcelasAtrasadasCliente = parcelasAbertasCliente.filter(p => calcularDiasAtraso(p.data_vencimento) > 0);
        
        const valorTotalCliente = crediariosCliente.reduce((sum, c) => sum + (c.valor_total || 0), 0);
        const valorPagoCliente = parcelasPagasCliente.reduce((sum, p) => sum + (p.valor_pago || p.valor_original || 0), 0);
        const valorAbertoCliente = parcelasAbertasCliente.reduce((sum, p) => sum + (p.valor_original || 0), 0);
        const valorAtrasadoCliente = parcelasAtrasadasCliente.reduce((sum, p) => {
          const diasAtraso = calcularDiasAtraso(p.data_vencimento);
          const crediario = crediariosCliente.find(c => c.id === p.crediario_id);
          const juros = diasAtraso * (crediario?.juros_diario || 0);
          return sum + (p.valor_original || 0) + juros;
        }, 0);
        
        return {
          cliente,
          crediarios: crediariosCliente,
          parcelas: parcelasCliente,
          parcelasPagas: parcelasPagasCliente.length,
          parcelasAbertas: parcelasAbertasCliente.length,
          parcelasAtrasadas: parcelasAtrasadasCliente.length,
          valorTotal: valorTotalCliente,
          valorPago: valorPagoCliente,
          valorAberto: valorAbertoCliente,
          valorAtrasado: valorAtrasadoCliente,
          situacao: parcelasAtrasadasCliente.length > 0 ? 'Em Atraso' : 
                   parcelasAbertasCliente.length > 0 ? 'Em Dia' : 'Quitado'
        };
      });
      
      setRelatorio({
        totalClientes: stats.totalClientes,
        totalCrediarios: stats.totalCrediarios,
        parcelasPagas: stats.parcelasPagas,
        parcelasEmAberto: stats.parcelasEmAberto,
        valorTotalCrediarios: stats.valorTotalCrediarios,
        valorPago: stats.valorTotalPago,
        valorEmAberto: stats.valorTotalEmAberto,
      });
      
      // Definir parcelas atrasadas com detalhes
      const parcelasAtrasadasDetalhadas = parcelasAtrasadas.map(parcela => ({
        ...parcela,
        dias_atraso: calcularDiasAtraso(parcela.data_vencimento),
        valor_com_juros: parcela.valor_original + (calcularDiasAtraso(parcela.data_vencimento) * parcela.juros_diario),
      }));
      
      setParcelasAtrasadas(parcelasAtrasadasDetalhadas);
      setClientesDetalhados(clientesComDados);
      
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      Alert.alert('Erro', 'Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = async () => {
    setLoading(true);
    try {
      let config = null;
      try { config = await supabaseService.buscarConfiguracoes(); } catch { /* usa padrão */ }
      const stats = await supabaseService.gerarEstatisticas();

      const todosClientes = await supabaseService.buscarClientes();
      const todosCrediarios = await supabaseService.buscarCrediarios();
      const parcelasEmAberto = await supabaseService.buscarParcelasEmAberto();
      const parcelasPagas = await supabaseService.buscarParcelasPagas();
      const todasParcelas = [...parcelasEmAberto, ...parcelasPagas];
      const parcelasAtrasadas = parcelasEmAberto.filter(p => calcularDiasAtraso(p.data_vencimento) > 0);

      const pdfModule = await import('@/services/pdfService');

      await pdfModule.PDFService.gerarRelatorioGeral(
        stats,
        parcelasAtrasadas,
        todosCrediarios,
        todosClientes,
        todasParcelas,
        config || undefined
      );

      Alert.alert('Sucesso', `Relatório completo exportado em PDF com sucesso!\n\n• ${todosClientes.length} clientes\n• ${todosCrediarios.length} crediários\n• ${todasParcelas.length} parcelas`);

    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error);
      Alert.alert('Erro', `Erro ao exportar relatório.\n\nDetalhes: ${error?.message ?? ''}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <LoadingSpinner message="Inicializando sistema..." />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <BarChart3 size={32} color="#ffffff" />
        </View>
        <Text style={styles.title}>Relatórios Gerenciais</Text>
        <Text style={styles.subtitle}>Acompanhe o desempenho do seu crediário</Text>
      </View>
      
      <View style={styles.content}>
        {loading && (
          <LoadingSpinner message="Carregando relatórios..." size="small" />
        )}
        
        {relatorio && (
          <>
            <Card variant="elevated">
              <Text style={styles.sectionTitle}>📊 Estatísticas Gerais</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <BarChart3 size={24} color="#2563eb" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue}>{relatorio.totalClientes}</Text>
                    <Text style={styles.statLabel}>Total de Clientes</Text>
                  </View>
                </View>
                
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <CheckCircle size={24} color="#059669" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue}>{relatorio.totalCrediarios}</Text>
                    <Text style={styles.statLabel}>Total Crediários</Text>
                  </View>
                </View>
                
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <AlertCircle size={24} color="#dc2626" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statValue}>{relatorio.parcelasEmAberto}</Text>
                    <Text style={styles.statLabel}>Parcelas Abertas</Text>
                  </View>
                </View>
              </View>
            </Card>
            
            <Card variant="elevated">
              <Text style={styles.sectionTitle}>💰 Resumo Financeiro</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Valor Total:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(relatorio.valorTotalCrediarios)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Valor Pago:</Text>
                <Text style={[styles.summaryValue, styles.valorPago]}>
                  {formatCurrency(relatorio.valorPago)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Valor em Atraso:</Text>
                <Text style={[styles.summaryValue, styles.valorAtrasado]}>
                  {formatCurrency(relatorio.valorEmAberto)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Valor em Aberto:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(relatorio.valorEmAberto)}
                </Text>
              </View>
            </Card>
            
            <Card variant="elevated">
              <View style={styles.actionsContainer}>
                <Button
                  title="👁️ Ver Relatório Detalhado"
                  onPress={() => setShowDetailedView(true)}
                  disabled={loading}
                  variant="secondary"
                  style={styles.viewButton}
                />
                
                <Button
                  title="📄 Exportar Relatório Geral (PDF)"
                  onPress={exportarCSV}
                  disabled={loading}
                  variant="secondary"
                  style={styles.exportButton}
                />
                
                <Button
                  title="🔄 Atualizar Dados"
                  onPress={carregarRelatorio}
                  disabled={loading}
                  style={styles.refreshButton}
                />
              </View>
            </Card>
            
            {parcelasAtrasadas.length > 0 && (
              <Card variant="elevated" style={styles.atrasadasCard}>
                <Text style={styles.sectionTitle}>⚠️ Parcelas Atrasadas ({parcelasAtrasadas.length})</Text>
                
                {parcelasAtrasadas.slice(0, 10).map((parcela) => (
                  <Card key={parcela.id} style={styles.atrasadaCard}>
                    <View style={styles.atrasadaHeader}>
                      <Text style={styles.atrasadaCliente}>{parcela.cliente_nome}</Text>
                      <View style={styles.atrasadaBadge}>
                        <Text style={styles.atrasadaDias}>
                          {parcela.dias_atraso} dias
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.atrasadaDetails}>
                      <Text style={styles.atrasadaInfo}>
                        📄 Parcela {parcela.numero_parcela} - 📅 Vencimento: {formatDateBR(parcela.data_vencimento)}
                      </Text>
                      <Text style={styles.atrasadaValor}>
                        {formatCurrency(parcela.valor_com_juros)}
                      </Text>
                    </View>
                  </Card>
                ))}
                
                {parcelasAtrasadas.length > 10 && (
                  <Text style={styles.moreItems}>
                    E mais {parcelasAtrasadas.length - 10} parcelas atrasadas...
                  </Text>
                )}
              </Card>
            )}
          </>
        )}
        
        {/* Modal de Visualização Detalhada */}
        <Modal
          visible={showDetailedView}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Relatório Detalhado</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailedView(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Resumo Geral */}
              {relatorio && (
                <Card variant="elevated" style={styles.summarySection}>
                  <Text style={styles.modalSectionTitle}>💰 Resumo Financeiro da Loja</Text>
                  
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardValue}>{relatorio.totalClientes}</Text>
                      <Text style={styles.summaryCardLabel}>Clientes</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardValue}>{relatorio.totalCrediarios}</Text>
                      <Text style={styles.summaryCardLabel}>Crediários</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardValue}>{relatorio.parcelasEmAberto}</Text>
                      <Text style={styles.summaryCardLabel}>Em Aberto</Text>
                    </View>
                  </View>
                  
                  <View style={styles.financialSummary}>
                    <View style={styles.financialRow}>
                      <Text style={styles.financialLabel}>💰 Valor Total dos Crediários:</Text>
                      <Text style={[styles.financialValue, styles.valorTotal]}>
                        {formatCurrency(relatorio.valorTotalCrediarios)}
                      </Text>
                    </View>
                    <View style={styles.financialRow}>
                      <Text style={styles.financialLabel}>✅ Valor Total Pago:</Text>
                      <Text style={[styles.financialValue, styles.valorPago]}>
                        {formatCurrency(relatorio.valorPago)}
                      </Text>
                    </View>
                    <View style={styles.financialRow}>
                      <Text style={styles.financialLabel}>⏳ Valor Total em Aberto:</Text>
                      <Text style={[styles.financialValue, styles.valorAberto]}>
                        {formatCurrency(relatorio.valorEmAberto)}
                      </Text>
                    </View>
                    <View style={[styles.financialRow, styles.totalRow]}>
                      <Text style={styles.financialLabel}>📈 Taxa de Inadimplência:</Text>
                      <Text style={[styles.financialValue, styles.valorAtrasado]}>
                        {relatorio.valorTotalCrediarios > 0 
                          ? ((relatorio.valorEmAberto / relatorio.valorTotalCrediarios) * 100).toFixed(1) + '%'
                          : '0%'
                        }
                      </Text>
                    </View>
                  </View>
                </Card>
              )}
              
              {/* Detalhamento por Cliente */}
              <Card variant="elevated">
                <Text style={styles.modalSectionTitle}>👥 Detalhamento por Cliente ({clientesDetalhados.length})</Text>
                
                {clientesDetalhados.map((clienteData, index) => (
                  <Card key={index} style={styles.clienteDetailCard}>
                    <View style={styles.clienteDetailHeader}>
                      <View style={styles.clienteDetailInfo}>
                        <Text style={styles.clienteDetailNome}>{clienteData.cliente.nome}</Text>
                        {clienteData.cliente.telefone && (
                          <Text style={styles.clienteDetailSubtitle}>📞 {clienteData.cliente.telefone}</Text>
                        )}
                        {clienteData.cliente.endereco && (
                          <Text style={styles.clienteDetailSubtitle}>📍 {clienteData.cliente.endereco}</Text>
                        )}
                      </View>
                      <View style={[
                        styles.situacaoBadge,
                        clienteData.situacao === 'Quitado' ? styles.situacaoQuitado :
                        clienteData.situacao === 'Em Dia' ? styles.situacaoEmDia : styles.situacaoAtrasado
                      ]}>
                        <Text style={[
                          styles.situacaoText,
                          clienteData.situacao === 'Quitado' ? styles.situacaoQuitadoText :
                          clienteData.situacao === 'Em Dia' ? styles.situacaoEmDiaText : styles.situacaoAtrasadoText
                        ]}>
                          {clienteData.situacao}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.clienteStats}>
                      <View style={styles.clienteStatItem}>
                        <Text style={styles.clienteStatValue}>{clienteData.crediarios.length}</Text>
                        <Text style={styles.clienteStatLabel}>Crediários</Text>
                      </View>
                      <View style={styles.clienteStatItem}>
                        <Text style={[styles.clienteStatValue, styles.valorPago]}>
                          {formatCurrency(clienteData.valorPago)}
                        </Text>
                        <Text style={styles.clienteStatLabel}>Pago</Text>
                      </View>
                      <View style={styles.clienteStatItem}>
                        <Text style={[styles.clienteStatValue, styles.valorAberto]}>
                          {formatCurrency(clienteData.valorAberto)}
                        </Text>
                        <Text style={styles.clienteStatLabel}>Em Aberto</Text>
                      </View>
                      <View style={styles.clienteStatItem}>
                        <Text style={[styles.clienteStatValue, styles.valorAtrasado]}>
                          {clienteData.parcelasAtrasadas}
                        </Text>
                        <Text style={styles.clienteStatLabel}>Atrasadas</Text>
                      </View>
                    </View>
                    
                    {/* Crediários do Cliente */}
                    {clienteData.crediarios.length > 0 && (
                      <View style={styles.crediariosSection}>
                        <Text style={styles.crediariosTitle}>📋 Crediários:</Text>
                        {clienteData.crediarios.map((crediario, credIndex) => {
                          const parcelasCrediario = clienteData.parcelas.filter(p => p.crediario_id === crediario.id);
                          const parcelasPagasCrediario = parcelasCrediario.filter(p => p.status === 'paga').length;
                          const statusCrediario = parcelasPagasCrediario === crediario.numero_parcelas ? 'Quitado' : 
                                                parcelasCrediario.some(p => p.status === 'pendente' && calcularDiasAtraso(p.data_vencimento) > 0) ? 'Em Atraso' : 'Em Dia';
                          
                          return (
                            <View key={credIndex} style={styles.crediarioItem}>
                              <View style={styles.crediarioHeader}>
                                <Text style={styles.crediarioInfo}>
                                  📅 {formatDateBR(crediario.data_emissao)} | 
                                  💰 {formatCurrency(crediario.valor_total)} | 
                                  📊 {parcelasPagasCrediario}/{crediario.numero_parcelas} parcelas
                                </Text>
                                <View style={[
                                  styles.crediarioStatus,
                                  statusCrediario === 'Quitado' ? styles.statusQuitado :
                                  statusCrediario === 'Em Dia' ? styles.statusEmDia : styles.statusAtrasado
                                ]}>
                                  <Text style={styles.crediarioStatusText}>{statusCrediario}</Text>
                                </View>
                              </View>
                              
                              <Text style={styles.crediarioDetails}>
                                💳 Parcela: {formatCurrency(crediario.valor_parcela)} | 
                                📈 Juros/dia: {formatCurrency(crediario.juros_diario)}
                              </Text>
                              
                              {/* Parcelas do Crediário */}
                              <View style={styles.parcelasGrid}>
                                {parcelasCrediario.map((parcela, parIndex) => {
                                  const diasAtraso = calcularDiasAtraso(parcela.data_vencimento);
                                  const isAtrasada = parcela.status === 'pendente' && diasAtraso > 0;
                                  
                                  return (
                                    <View key={parIndex} style={[
                                      styles.parcelaItem,
                                      parcela.status === 'paga' ? styles.parcelaPaga :
                                      isAtrasada ? styles.parcelaAtrasada : styles.parcelaPendente
                                    ]}>
                                      <Text style={styles.parcelaNumero}>{parcela.numero_parcela}</Text>
                                      <Text style={styles.parcelaData}>
                                        {formatDateBR(parcela.data_vencimento)}
                                      </Text>
                                      {isAtrasada && (
                                        <Text style={styles.parcelaAtraso}>
                                          {diasAtraso}d
                                        </Text>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </Card>
                ))}
              </Card>
            </ScrollView>
          </View>
        </Modal>
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
    backgroundColor: '#f59e0b',
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
    color: '#fef3c7',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  valorPago: {
    color: '#059669',
  },
  valorAberto: {
    color: '#2563eb',
  },
  valorAtrasado: {
    color: '#dc2626',
  },
  actionsContainer: {
    gap: 12,
  },
  viewButton: {
    backgroundColor: '#6366f1',
  },
  exportButton: {
    backgroundColor: '#6b7280',
  },
  refreshButton: {
    backgroundColor: '#2563eb',
  },
  atrasadasCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  atrasadaCard: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  atrasadaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  atrasadaCliente: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  atrasadaBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  atrasadaDias: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  atrasadaDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  atrasadaInfo: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  atrasadaValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  moreItems: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  financialSummary: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  valorTotal: {
    color: '#374151',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  clienteDetailCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  clienteDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clienteDetailInfo: {
    flex: 1,
  },
  clienteDetailNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  clienteDetailSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  situacaoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  situacaoQuitado: {
    backgroundColor: '#f0fdf4',
  },
  situacaoEmDia: {
    backgroundColor: '#fffbeb',
  },
  situacaoAtrasado: {
    backgroundColor: '#fef2f2',
  },
  situacaoText: {
    fontSize: 10,
    fontWeight: '600',
  },
  situacaoQuitadoText: {
    color: '#059669',
  },
  situacaoEmDiaText: {
    color: '#f59e0b',
  },
  situacaoAtrasadoText: {
    color: '#dc2626',
  },
  clienteStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  clienteStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  clienteStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 2,
  },
  clienteStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  crediariosSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  crediariosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  crediarioItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  crediarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  crediarioInfo: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  crediarioStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusQuitado: {
    backgroundColor: '#f0fdf4',
  },
  statusEmDia: {
    backgroundColor: '#fffbeb',
  },
  statusAtrasado: {
    backgroundColor: '#fef2f2',
  },
  crediarioStatusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#374151',
  },
  crediarioDetails: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
  },
  parcelasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  parcelaItem: {
    width: 45,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  parcelaPaga: {
    backgroundColor: '#f0fdf4',
    borderColor: '#059669',
  },
  parcelaPendente: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  parcelaAtrasada: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  parcelaNumero: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  parcelaData: {
    fontSize: 7,
    color: '#6b7280',
  },
  parcelaAtraso: {
    fontSize: 7,
    color: '#dc2626',
    fontWeight: 'bold',
  },
});