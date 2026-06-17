import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSupabase } from '@/context/SupabaseContext';
import { Settings, Store, FileText, Cloud } from 'lucide-react-native';

interface ConfiguracaoEmpresa {
  nome: string;
  endereco: string;
  telefone: string;
  avisoPersonalizado: string;
}

export default function ConfiguracoesScreen() {
  const { supabaseService, isReady } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfiguracaoEmpresa>({
    nome: 'CASA SÃO FRANCISCO',
    endereco: 'Parintins - AM',
    telefone: '(92) 99999-9999',
    avisoPersonalizado: 'Sistema desenvolvido para controle de vendas a prazo'
  });

  useEffect(() => {
    if (isReady) {
      carregarConfiguracoes();
    }
  }, [isReady]);

  const carregarConfiguracoes = async () => {
    try {
      const configSalva = await supabaseService.buscarConfiguracoes();
      if (configSalva) {
        setConfig(configSalva);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const salvarConfiguracoes = async () => {
    if (!config.nome.trim()) {
      Alert.alert('Erro', 'Nome da empresa é obrigatório');
      return;
    }

    setLoading(true);
    try {
    await supabaseService.salvarConfiguracoes(config);
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const resetarConfiguracoes = () => {
    Alert.alert(
      'Confirmar Reset',
      'Deseja restaurar as configurações padrão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setConfig({
              nome: 'CASA SÃO FRANCISCO',
              endereco: 'Parintins - AM',
              telefone: '(92) 99999-9999',
              avisoPersonalizado: 'Sistema desenvolvido para controle de vendas a prazo'
            });
          }
        }
      ]
    );
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
          <Settings size={32} color="#ffffff" />
        </View>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Configure as informações da sua empresa</Text>
      </View>
      
      <View style={styles.content}>
        <Card variant="elevated">
          <View style={styles.sectionHeader}>
            <Store size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Dados da Empresa</Text>
          </View>
          
          <Input
            label="Nome da Empresa"
            value={config.nome}
            onChangeText={(text) => setConfig({ ...config, nome: text })}
            placeholder="Nome da sua empresa"
            required
          />
          
          <Input
            label="Endereço/Cidade"
            value={config.endereco}
            onChangeText={(text) => setConfig({ ...config, endereco: text })}
            placeholder="Endereço completo ou cidade"
          />
          
          <Input
            label="Telefone de Contato"
            value={config.telefone}
            onChangeText={(text) => setConfig({ ...config, telefone: text })}
            placeholder="(XX) XXXXX-XXXX"
            keyboardType="phone-pad"
          />
        </Card>
        
        <Card variant="elevated">
          <View style={styles.sectionHeader}>
            <Cloud size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Banco de Dados</Text>
          </View>

          <View style={[styles.statusBadge, styles.statusConnected]}>
            <Text style={[styles.statusText, styles.statusTextConnected]}>
              🟢 Conectado ao banco de dados
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Sobre o banco de dados:</Text>
            <Text style={styles.infoText}>
              No preview do Bolt, o app usa o banco interno gerenciado automaticamente. Ao exportar e publicar o app, configure seu proprio Supabase no arquivo .env com suas credenciais.
            </Text>
          </View>
        </Card>

        <Card variant="elevated">
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Personalização do Carnê</Text>
          </View>
          
          <Input
            label="Aviso Personalizado"
            value={config.avisoPersonalizado}
            onChangeText={(text) => setConfig({ ...config, avisoPersonalizado: text })}
            placeholder="Mensagem que aparecerá no carnê"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Dica:</Text>
            <Text style={styles.infoText}>
              Este aviso aparecerá no rodapé de cada parcela do carnê. 
              Use para incluir informações importantes como horário de funcionamento, 
              formas de pagamento aceitas, ou avisos especiais.
            </Text>
          </View>
        </Card>
        
        <Card variant="elevated" style={styles.previewCard}>
          <Text style={styles.previewTitle}>📋 Prévia do Carnê</Text>
          
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewStoreName}>{config.nome}</Text>
              <Text style={styles.previewStoreSubtitle}>Sistema de Crediário</Text>
            </View>
            
            <View style={styles.previewBody}>
              <Text style={styles.previewLabel}>Cliente: João da Silva</Text>
              <Text style={styles.previewLabel}>Parcela: 1/5</Text>
              <Text style={styles.previewLabel}>Vencimento: 15/02/2024</Text>
              <Text style={styles.previewValue}>R$ 100,00</Text>
            </View>
            
            <View style={styles.previewFooter}>
              <Text style={styles.previewFooterText}>
                {config.avisoPersonalizado}
              </Text>
              <Text style={styles.previewContact}>
                {config.endereco} | Tel: {config.telefone}
              </Text>
            </View>
          </View>
        </Card>
        
        <View style={styles.actions}>
          <Button
            title="🔄 Restaurar Padrão"
            onPress={resetarConfiguracoes}
            variant="secondary"
            style={styles.resetButton}
          />
          
          <Button
            title={loading ? "Salvando..." : "💾 Salvar Configurações"}
            onPress={salvarConfiguracoes}
            disabled={loading}
            style={styles.saveButton}
          />
        </View>
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
    backgroundColor: '#6366f1',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 16,
  },
  previewCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#000000',
  },
  previewHeader: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 8,
    marginBottom: 12,
  },
  previewStoreName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  previewStoreSubtitle: {
    fontSize: 10,
    color: '#000000',
  },
  previewBody: {
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  previewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 8,
  },
  previewFooterText: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewContact: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusConnected: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextConnected: {
    color: '#166534',
  },
});