import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DatePicker } from '@/components/DatePicker';
import { useSupabase } from '@/context/SupabaseContext';
import { Cliente, Crediario, Parcela } from '@/services/supabaseService';
import { formatDate, adicionarMeses } from '@/utils/dateUtils';
import { validateCrediario, formatCurrency } from '@/utils/validation';
import { parseCurrencyInput } from '@/utils/validation';
import { Calculator, FileText, User } from 'lucide-react-native';

export default function EmissaoScreen() {
  const { supabaseService, isReady, isUsingSupabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nomeCliente: '',
    enderecoCliente: '',
    valorTotal: 'R$ 0,00',
    jurosDiario: 'R$ 0,00',
    numeroParcelas: '',
  });
  
  const [dataVencimento, setDataVencimento] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const validation = validateCrediario(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Buscar ou criar cliente
      let clienteId: number;
      const clientesExistentes = await supabaseService.buscarClientesPorNome(formData.nomeCliente);
      
      if (clientesExistentes.length > 0) {
        clienteId = clientesExistentes[0].id!;
        
        // Atualizar endereço do cliente se fornecido
        if (formData.enderecoCliente.trim()) {
          await supabaseService.atualizarCliente(clienteId, {
            endereco: formData.enderecoCliente.trim()
          });
        }
      } else {
        // Criar cliente automaticamente se não existir
        clienteId = await supabaseService.criarCliente({
          nome: formData.nomeCliente,
          telefone: '',
          endereco: formData.enderecoCliente.trim()
        });
      }
      
      // Criar crediário
      const valorTotal = parseCurrencyInput(formData.valorTotal);
      const numeroParcelas = parseInt(formData.numeroParcelas);
      const valorParcela = valorTotal / numeroParcelas;
      
      const crediario: Crediario = {
        cliente_id: clienteId,
        cliente_nome: formData.nomeCliente,
        data_emissao: formatDate(new Date()),
        data_vencimento_primeira: formatDate(dataVencimento),
        valor_total: valorTotal,
        juros_diario: parseCurrencyInput(formData.jurosDiario),
        numero_parcelas: numeroParcelas,
        valor_parcela: valorParcela,
      };
      
      const crediarioId = await supabaseService.criarCrediario(crediario);
      
      // Criar parcelas
      const parcelas: Parcela[] = [];
      for (let i = 0; i < numeroParcelas; i++) {
        const dataVencimentoParcela = adicionarMeses(dataVencimento, i);
        
        parcelas.push({
          crediario_id: crediarioId,
          numero_parcela: i + 1,
          valor_original: valorParcela,
          data_vencimento: formatDate(dataVencimentoParcela),
          status: 'pendente',
          dias_atraso: 0,
        });
      }
      
      await supabaseService.criarParcelas(parcelas);
      
      // Gerar PDF
      Alert.alert(
        'Sucesso',
        'Crediário criado com sucesso!',
        [
          {
            text: 'OK',
            style: 'default'
          },
          {
            text: '📄 Gerar PDF',
            onPress: async () => {
              try {
                console.log('🎯 [MAIN] Iniciando processo de geração de PDF...');
                console.log('🎯 [MAIN] Dados do crediário:', crediario);
                console.log('🎯 [MAIN] Parcelas:', parcelas);
                
               console.log('🎯 [MAIN] Tentando importar módulo PDF...');
                const pdfModule = await import('@/services/pdfService');
                console.log('🎯 [MAIN] Módulo PDF importado:', pdfModule);
                console.log('🎯 [MAIN] PDFService disponível:', !!pdfModule.PDFService);
               console.log('🎯 [MAIN] Métodos disponíveis:', Object.keys(pdfModule));
                
               console.log('🎯 [MAIN] Buscando configurações...');
                const config = await supabaseService.buscarConfiguracoes();
                console.log('🎯 [MAIN] Configurações carregadas:', config);
                
                console.log('🎯 [MAIN] Chamando PDFService.gerarPDFCrediario...');
               console.log('🎯 [MAIN] Parâmetros:', {
                 crediario: !!crediario,
                 parcelas: parcelas.length,
                 clienteNome: formData.nomeCliente,
                 config: !!config
               });
               
                console.log('🎯 [MAIN] Iniciando geração de PDF...');
                await pdfModule.PDFService.gerarPDFCrediario(
                  crediario, 
                  parcelas, 
                  formData.nomeCliente, 
                  config || undefined
                );
                
                console.log('🎯 [MAIN] PDF gerado com sucesso!');
                // Não mostrar alerta aqui, o PDFService já mostra feedback
              } catch (pdfError) {
                console.error('🎯 [MAIN] Erro ao gerar PDF:', pdfError);
                console.error('🎯 [MAIN] Stack do erro:', pdfError.stack);
               console.error('🎯 [MAIN] Tipo do erro:', typeof pdfError);
               console.error('🎯 [MAIN] Nome do erro:', pdfError.name);
               console.error('🎯 [MAIN] Mensagem do erro:', pdfError.message);
                Alert.alert(
                  'Erro no PDF', 
                  `Não foi possível gerar o PDF.\n\nDetalhes: ${pdfError.message}\n\n✅ O crediário foi salvo com sucesso!`
                );
              }
            }
          }
        ]
      );
      
      // Limpar formulário
      setFormData({
        nomeCliente: '',
        enderecoCliente: '',
        valorTotal: 'R$ 0,00',
        jurosDiario: 'R$ 0,00',
        numeroParcelas: '',
      });
      setDataVencimento(new Date());
      
    } catch (error) {
      console.error('Erro ao criar crediário:', error);
      Alert.alert('Erro', 'Erro ao criar crediário. Tente novamente.');
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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <FileText size={32} color="#ffffff" />
          </View>
          <Text style={styles.title}>Emissão de Crediário</Text>
          <Text style={styles.subtitle}>
            {isUsingSupabase ? '🌐 Conectado ao Supabase' : '💾 Modo Local'} - Preencha os dados para criar um novo crediário
          </Text>
        </View>
        
        <View style={styles.content}>
          <Card variant="elevated">
            <View style={styles.cardHeader}>
              <User size={20} color="#2563eb" />
              <Text style={styles.cardTitle}>Dados do Cliente</Text>
            </View>
            
            <Input
              label="Nome do Cliente"
              value={formData.nomeCliente}
              onChangeText={(text) => setFormData({ ...formData, nomeCliente: text })}
              placeholder="Digite o nome do cliente"
              error={errors.nomeCliente}
              required
            />
            
            <Input
              label="Endereço do Cliente"
              value={formData.enderecoCliente}
              onChangeText={(text) => setFormData({ ...formData, enderecoCliente: text })}
              placeholder="Digite o endereço do cliente (opcional)"
            />
          </Card>
          
          <Card variant="elevated">
            <View style={styles.cardHeader}>
              <Calculator size={20} color="#2563eb" />
              <Text style={styles.cardTitle}>Dados Financeiros</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data de Emissão:</Text>
              <Text style={styles.infoValue}>{new Date().toLocaleDateString('pt-BR')}</Text>
            </View>
            
            <DatePicker
              label="Data de Vencimento da Primeira Parcela"
              value={dataVencimento}
              onChange={setDataVencimento}
              required
            />
            
            <Input
              label="Valor Total da Compra"
              value={formData.valorTotal}
              onChangeText={(text) => setFormData({ ...formData, valorTotal: text })}
              placeholder="0,00"
              keyboardType="decimal-pad"
              error={errors.valorTotal}
              currency={true}
              required
            />
            
            <Input
              label="Juros Diário (em caso de atraso)"
              value={formData.jurosDiario}
              onChangeText={(text) => setFormData({ ...formData, jurosDiario: text })}
              placeholder="0,07"
              keyboardType="decimal-pad"
              error={errors.jurosDiario}
              currency={true}
              required
            />
            
            <Input
              label="Número de Parcelas"
              value={formData.numeroParcelas}
              onChangeText={(text) => setFormData({ ...formData, numeroParcelas: text })}
              placeholder="1"
              keyboardType="numeric"
              error={errors.numeroParcelas}
              required
            />
          </Card>
          
          {formData.valorTotal && formData.numeroParcelas && parseCurrencyInput(formData.valorTotal) > 0 && !isNaN(parseInt(formData.numeroParcelas)) && (
            <Card variant="outlined" style={styles.previewCard}>
              <Text style={styles.previewTitle}>📋 Resumo do Crediário</Text>
              
              <View style={styles.previewGrid}>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Valor Total</Text>
                  <Text style={styles.previewValue}>
                    {formatCurrency(parseCurrencyInput(formData.valorTotal))}
                  </Text>
                </View>
                
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Parcelas</Text>
                  <Text style={styles.previewValue}>
                    {formData.numeroParcelas}x
                  </Text>
                </View>
                
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Valor por Parcela</Text>
                  <Text style={[styles.previewValue, styles.previewHighlight]}>
                    {formatCurrency(parseCurrencyInput(formData.valorTotal) / parseInt(formData.numeroParcelas))}
                  </Text>
                </View>
                
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Juros Diário</Text>
                  <Text style={styles.previewValue}>
                    {formData.jurosDiario || 'R$ 0,00'}
                  </Text>
                </View>
              </View>
            </Card>
          )}
          
          <Button
            title={loading ? "Processando..." : "🎯 Criar Crediário e Gerar PDF"}
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2563eb',
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
    color: '#e0e7ff',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  infoValue: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#2563eb',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  previewItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  previewHighlight: {
    color: '#2563eb',
    fontSize: 16,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 16,
  },
});