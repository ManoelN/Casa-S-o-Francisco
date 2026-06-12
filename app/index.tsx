import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Search, Users, ChartBar as BarChart3, Store, Settings } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Emissão de Crediário',
      description: 'Criar novos crediários e gerar carnês',
      icon: <FileText size={24} color="#ffffff" />,
      route: '/(tabs)',
      color: '#2563eb',
    },
    {
      title: 'Baixa de Contas',
      description: 'Quitar parcelas e controlar pagamentos',
      icon: <Search size={24} color="#ffffff" />,
      route: '/(tabs)/baixa',
      color: '#059669',
    },
    {
      title: 'Relatórios',
      description: 'Acompanhar estatísticas e exportar dados',
      icon: <BarChart3 size={24} color="#ffffff" />,
      route: '/(tabs)/relatorios',
      color: '#f59e0b',
    },
    {
      title: 'Configurações',
      description: 'Editar informações da empresa',
      icon: <Settings size={24} color="#ffffff" />,
      route: '/(tabs)/configuracoes',
      color: '#6366f1',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Store size={32} color="#ffffff" />
        </View>
        <Text style={styles.storeName}>CASA SÃO FRANCISCO</Text>
        <Text style={styles.storeSubtitle}>Sistema de Crediário</Text>
        <Text style={styles.storeAddress}>Parintins - AM</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Bem-vindo ao Sistema de Crediário</Text>
        <Text style={styles.descriptionText}>
          Gerencie vendas a prazo, controle pagamentos e acompanhe o desempenho do seu negócio
        </Text>
        
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: item.color }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={styles.menuIcon}>
                {item.icon}
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sistema desenvolvido para controle de vendas a prazo
          </Text>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
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
    backgroundColor: '#1f2937',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
    minHeight: 160,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
    paddingHorizontal: 20,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  storeSubtitle: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 2,
    paddingHorizontal: 20,
    lineHeight: 14,
  },
  storeAddress: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 12,
  },
  content: {
    padding: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  descriptionText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  menuGrid: {
    gap: 8,
  },
  menuItem: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 90,
    justifyContent: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 15,
    paddingHorizontal: 12,
  },
  menuDescription: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 11,
    paddingHorizontal: 12,
  },
  footer: {
    marginTop: 24,
    padding: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 12,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
});