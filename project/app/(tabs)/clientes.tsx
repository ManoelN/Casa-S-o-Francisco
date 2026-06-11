import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { useSupabase } from '@/context/SupabaseContext';
import { Cliente } from '@/services/supabaseService';
import { validateCliente, formatPhone } from '@/utils/validation';
import { User, Phone, MapPin, Plus } from 'lucide-react-native';

export default function ClientesScreen() {
  const { supabaseService, isReady } = useSupabase();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    endereco: '',
  });

  useEffect(() => {
    if (isReady) {
      carregarClientes();
    }
  }, [isReady]);

  useEffect(() => {
    if (busca.trim()) {
      buscarClientes();
    } else {
      carregarClientes();
    }
  }, [busca]);

  const carregarClientes = async () => {
    setLoading(true);
    try {
      const result = await supabaseService.buscarClientes();
      setClientes(result);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      Alert.alert('Erro', 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  const buscarClientes = async () => {
    setLoading(true);
    try {
      const result = await supabaseService.buscarClientesPorNome(busca);
      setClientes(result);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      Alert.alert('Erro', 'Erro ao buscar clientes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const validation = validateCliente(formData);
    setErrors(validation.errors);
    
    if (!validation.isValid) {
      return;
    }
    
    setLoading(true);
    try {
      await supabaseService.criarCliente(formData);
      
      setFormData({ nome: '', telefone: '', endereco: '' });
      setShowForm(false);
      setErrors({});
      
      Alert.alert('Sucesso', 'Cliente criado com sucesso!');
      await carregarClientes();
      
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      Alert.alert('Erro', 'Erro ao criar cliente.');
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
          <User size={32} color="#ffffff" />
        </View>
        <Text style={styles.title}>Gestão de Clientes</Text>
        <Text style={styles.subtitle}>Gerencie seus clientes</Text>
      </View>
      
      <View style={styles.content}>
        <Card variant="elevated">
          <View style={styles.actions}>
            <View style={styles.searchContainer}>
              <Input
                value={busca}
                onChangeText={setBusca}
                placeholder="🔍 Buscar cliente..."
                style={styles.searchInput}
              />
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(!showForm)}
            >
              <Plus size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </Card>
        
        {showForm && (
          <Card variant="elevated" style={styles.formCard}>
            <View style={styles.formHeader}>
              <User size={20} color="#2563eb" />
              <Text style={styles.formTitle}>Novo Cliente</Text>
            </View>
            
            <Input
              label="Nome"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
              placeholder="Nome do cliente"
              error={errors.nome}
              required
            />
            
            <Input
              label="Telefone"
              value={formData.telefone}
              onChangeText={(text) => setFormData({ ...formData, telefone: formatPhone(text) })}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              error={errors.telefone}
            />
            
            <Input
              label="Endereço" 
              value={formData.endereco}
              onChangeText={(text) => setFormData({ ...formData, endereco: text })}
              placeholder="Endereço do cliente"
            />
            
            <View style={styles.formActions}>
              <Button
                title="❌ Cancelar"
                onPress={() => {
                  setShowForm(false);
                  setErrors({});
                  setFormData({ nome: '', telefone: '', endereco: '' });
                }}
                variant="secondary"
                style={styles.cancelButton}
              />
              <Button
                title={loading ? "Salvando..." : "💾 Salvar"}
                onPress={handleSubmit}
                disabled={loading}
                style={styles.saveButton}
              />
            </View>
          </Card>
        )}
        
        {loading && (
          <LoadingSpinner message="Carregando clientes..." size="small" />
        )}
        
        <Card variant="elevated">
          {clientes.length > 0 ? (
            <>
              <View style={styles.clientesHeader}>
                <User size={20} color="#2563eb" />
                <Text style={styles.clientesTitle}>Clientes Cadastrados ({clientes.length})</Text>
              </View>
              
              {clientes.map((cliente) => (
                <Card key={cliente.id} style={styles.clienteCard}>
                  <View style={styles.clienteHeader}>
                    <View style={styles.clienteIcon}>
                      <User size={24} color="#2563eb" />
                    </View>
                    <View style={styles.clienteInfo}>
                      <Text style={styles.clienteNome}>{cliente.nome}</Text>
                      <Text style={styles.clienteData}>
                        📅 Cadastrado em: {new Date(cliente.created_at || '').toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                  
                  {(cliente.telefone || cliente.endereco) && (
                    <View style={styles.clienteDetails}>
                      {cliente.telefone && (
                        <View style={styles.clienteDetailRow}>
                          <Phone size={16} color="#6b7280" />
                          <Text style={styles.clienteDetailText}>{cliente.telefone}</Text>
                        </View>
                      )}
                      
                      {cliente.endereco && (
                        <View style={styles.clienteDetailRow}>
                          <MapPin size={16} color="#6b7280" />
                          <Text style={styles.clienteDetailText}>{cliente.endereco}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </Card>
              ))}
            </>
          ) : (
            <EmptyState
              icon={<User size={48} color="#6b7280" />}
              title={busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              description={busca ? `Não foram encontrados clientes para "${busca}"` : "Adicione seu primeiro cliente clicando no botão +"}
            />
          )}
        </Card>
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
    backgroundColor: '#7c3aed',
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
    color: '#e9d5ff',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    padding: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 0,
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#f8fafc',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  clientesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  clienteCard: {
    marginBottom: 8,
  },
  clienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clienteIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  clienteData: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  clienteDetails: {
    paddingLeft: 52,
    gap: 8,
  },
  clienteDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clienteDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  clienteActions: {
    marginTop: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  viewButtonText: {
    fontSize: 12,
    color: '#2563eb',
    marginLeft: 4,
    fontWeight: '500',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalCard: {
    marginBottom: 16,
  },
  clienteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clienteModalIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#eff6ff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clienteModalInfo: {
    flex: 1,
  },
  clienteModalNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  clienteModalDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
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
  crediarioCard: {
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  crediarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  crediarioId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  crediarioData: {
    fontSize: 12,
    color: '#6b7280',
  },
  crediarioDetails: {
    gap: 4,
  },
  crediarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crediarioLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  crediarioValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});