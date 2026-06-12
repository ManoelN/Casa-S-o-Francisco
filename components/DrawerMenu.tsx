import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { FileText, Search, Users, ChartBar as BarChart3, Menu, X, Store, Settings } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DrawerMenuProps {
  children: React.ReactNode;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width * 0.8));
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Emissão de Crediário',
      route: '/(tabs)',
      icon: <FileText size={24} color="#374151" />,
    },
    {
      title: 'Baixa de Contas',
      route: '/(tabs)/baixa',
      icon: <Search size={24} color="#374151" />,
    },
    {
      title: 'Relatórios',
      route: '/(tabs)/relatorios',
      icon: <BarChart3 size={24} color="#374151" />,
    },
    {
      title: 'Configurações',
      route: '/(tabs)/configuracoes',
      icon: <Settings size={24} color="#374151" />,
    },
  ];

  const openDrawer = () => {
    setIsOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  const navigateTo = (route: string) => {
    closeDrawer();
    router.push(route as any);
  };

  const isActiveRoute = (route: string) => {
    if (route === '/(tabs)' && pathname === '/') return true;
    return pathname.includes(route.replace('/(tabs)', ''));
  };

  return (
    <View style={styles.container}>
      {/* Menu Button */}
      <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
        <Menu size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Main Content */}
      {children}

      {/* Drawer Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTouch} onPress={closeDrawer} />
          
          <Animated.View 
            style={[
              styles.drawer,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.logoContainer}>
                <Store size={24} color="#ffffff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.storeName}>CASA SÃO FRANCISCO</Text>
                <Text style={styles.storeSubtitle}>Sistema de Crediário</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeDrawer}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    isActiveRoute(item.route) && styles.activeMenuItem
                  ]}
                  onPress={() => navigateTo(item.route)}
                >
                  <View style={styles.menuIcon}>
                    {item.icon}
                  </View>
                  <Text style={[
                    styles.menuText,
                    isActiveRoute(item.route) && styles.activeMenuText
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.drawerFooter}>
              <Text style={styles.footerText}>Versão 1.0.0</Text>
              <Text style={styles.footerSubtext}>Parintins - AM</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    width: width * 0.8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    backgroundColor: '#1f2937',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  storeSubtitle: {
    fontSize: 12,
    color: '#d1d5db',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activeMenuItem: {
    backgroundColor: '#eff6ff',
    borderRightWidth: 4,
    borderRightColor: '#2563eb',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
});