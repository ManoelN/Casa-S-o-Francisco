import { Stack } from 'expo-router';
import { DrawerMenu } from '@/components/DrawerMenu';

export default function TabLayout() {
  return (
    <DrawerMenu>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="baixa" />
        <Stack.Screen name="relatorios" />
        <Stack.Screen name="configuracoes" />
      </Stack>
    </DrawerMenu>
  );
}