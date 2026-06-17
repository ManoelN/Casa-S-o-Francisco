import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSupabase } from '@/context/SupabaseContext';
import { Settings, Store, FileText, Database, RefreshCw, Trash2 } from 'lucide-react-native';
import { saveCustomCredentials, clearCustomCredentials, getActiveCredentials } from '@/lib/supabase';

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

  const activeCreds = getActiveCredentials();
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');

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

  const conectarSupabase = () => {
    if (!sbUrl.trim() || !sbKey.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha a URL e a Anon Key do Supabase.');
      return;
    }
    if (!sbUrl.startsWith('https://')) {
      Alert.alert('URL inválida', 'A URL deve começar com https://');
      return;
    }
    Alert.alert(
      'Confirmar conexão',
      `Conectar ao banco:\n${sbUrl}\n\nA página será recarregada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Conectar',
          onPress: () => {
            saveCustomCredentials(sbUrl, sbKey);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.reload();
            }
          },
        },
      ]
    );
  };

  const redefinirConexao = () => {
    Alert.alert(
      'Redefinir conexão',
      'Voltar para o banco de dados padrão do Bolt? A página será recarregada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Redefinir',
          style: 'destructive',
          onPress: () => {
            clearCustomCredentials();
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.reload();
            }
          },
        },
      ]
    );
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
            <Database size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Conexão com Supabase</Text>
          </View>

          <View style={[styles.statusBadge, activeCreds.isCustom ? styles.statusCustom : styles.statusDefault]}>
            <Text style={[styles.statusText, activeCreds.isCustom ? styles.statusTextCustom : styles.statusTextDefault]}>
              {activeCreds.isCustom ? '🔵 Banco customizado ativo' : '🟢 Banco padrão do Bolt ativo'}
            </Text>
          </View>

          <View style={styles.currentUrl}>
            <Text style={styles.currentUrlLabel}>URL atual:</Text>
            <Text style={styles.currentUrlValue} numberOfLines={1} ellipsizeMode="middle">
              {activeCreds.url}
            </Text>
          </View>

          <Input
            label="Nova URL do Supabase"
            value={sbUrl}
            onChangeText={setSbUrl}
            placeholder="https://xxxxxxxxxxxx.supabase.co"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Input
            label="Nova Anon Key"
            value={sbKey}
            onChangeText={setSbKey}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.dbActions}>
            <Button
              title="Conectar"
              onPress={conectarSupabase}
              style={styles.connectBtn}
            />
            {activeCreds.isCustom && (
              <Button
                title="Redefinir"
                onPress={redefinirConexao}
                variant="secondary"
                style={styles.resetDbBtn}
              />
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Como usar:</Text>
            <Text style={styles.infoText}>
              {'1. Crie um projeto em supabase.com\n2. Copie a URL e Anon Key em Settings > API\n3. Cole acima e clique Conectar\n4. A pagina recarregara usando seu banco'}
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
    marginBottom: 12,
    alignItems: 'center',
  },
  statusDefault: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  statusCustom: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextDefault: {
    color: '#166534',
  },
  statusTextCustom: {
    color: '#1d4ed8',
  },
  currentUrl: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currentUrlLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  currentUrlValue: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'monospace',
  },
  dbActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  connectBtn: {
    flex: 1,
  },
  resetDbBtn: {
    flex: 1,
  },
});