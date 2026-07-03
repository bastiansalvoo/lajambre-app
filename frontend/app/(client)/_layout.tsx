import { Tabs, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useCartStore } from '../../src/store/cartStore';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

function LogoHeader() {
  const router = useRouter();

  // 👇 El Guardia del Botón Secreto
  const handleAdminAccess = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        // Si tiene llave, lo dejamos pasar al panel
        router.push('/(admin)/dashboard');
      } else {
        // Si no tiene llave, lo mandamos al login
        router.push('/(auth)/login');
      }
    } catch (error) {
      console.error("Error revisando credenciales:", error);
    }
  };

  return (
    <View className="flex-row items-center gap-x-3">
      {/* Botón secreto protegido */}
      <TouchableOpacity 
        onPress={handleAdminAccess} 
        activeOpacity={0.7}
      >
        <Image
          source={require('../../assets/images/menu/logo.png')}
          className="w-11 h-11"
          resizeMode="contain"
        />
      </TouchableOpacity>
      
       <View className="flex-col justify-center">
        <Text className="text-yellow-500 text-xl font-black uppercase tracking-tight">
          Lajambre
        </Text>
        <Text className="text-white text-[10px] font-bold uppercase tracking-widest mt-[-4px]">
          Ganas de un gustito?
        </Text>
      </View>
    </View>
  );
}

function TabLayoutContent() {
  const insets = useSafeAreaInsets();
  const totalItems = useCartStore((state) => 
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  // Iniciar notificaciones push (solicita permisos y envía al servidor)
  usePushNotifications();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EAB308', 
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#000000', 
          borderTopColor: '#262626', 
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 10, 
        },
        headerStyle: {
          backgroundColor: '#000000', 
          elevation: 0, 
          shadowOpacity: 0, 
        },
        headerTitleAlign: 'center',
        // 👇 Aplicamos el LogoHeader a TODAS las pestañas
        headerTitle: () => <LogoHeader />,
      }}>
      
      <Tabs.Screen 
        name="index" 
        options={{ 
          tabBarLabel: 'Menú', 
          tabBarIcon: ({ color }) => <FontAwesome name="cutlery" size={24} color={color} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="cart" 
        options={{ 
          tabBarLabel: 'Carrito', 
          tabBarIcon: ({ color }) => <FontAwesome name="shopping-cart" size={24} color={color} />,
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EAB308', color: '#000000', fontWeight: 'bold' } 
        }} 
      />
      
      <Tabs.Screen 
        name="orders" 
        options={{ 
          tabBarLabel: 'Mis Pedidos', 
          tabBarIcon: ({ color }) => <FontAwesome name="list-alt" size={24} color={color} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="profile" 
        options={{ 
          tabBarLabel: 'Perfil', 
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabLayoutContent />;
}