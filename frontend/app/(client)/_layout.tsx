import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F5F5F5',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333333',
        },
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#F5F5F5',
        headerTitleAlign: 'center',
      }}>
      
      <Tabs.Screen name="index" options={{ title: 'Menú', tabBarIcon: ({ color }) => <FontAwesome name="cutlery" size={24} color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Carrito', tabBarIcon: ({ color }) => <FontAwesome name="shopping-cart" size={24} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Mis Pedidos', tabBarIcon: ({ color }) => <FontAwesome name="list-alt" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} /> }} />
    </Tabs>
  );
}