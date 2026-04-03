import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { View, Text, Image } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function LogoHeader() {
  return (
    <View className="flex-row items-center gap-x-3">
      <Image
        source={require('../../assets/images/menu/logo.png')}
        className="w-11 h-11"
        resizeMode="contain"
      />
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
      }}>
      
      <Tabs.Screen 
        name="index" 
        options={{ 
          headerTitle: () => <LogoHeader />,
          tabBarLabel: 'Menú', 
          tabBarIcon: ({ color }) => <FontAwesome name="cutlery" size={24} color={color} /> 
        }} 
      />
      
      {/* 🛒 AQUÍ EL CAMBIO: Agregamos tabBarBadge y su estilo */}
      <Tabs.Screen 
        name="cart" 
        options={{ 
          headerTitle: () => <LogoHeader />, // Reutilizamos el logo arriba
          tabBarLabel: 'Carrito', 
          tabBarIcon: ({ color }) => <FontAwesome name="shopping-cart" size={24} color={color} />,
          tabBarBadge: 3, // <--- MOCK: Número falso temporal
          tabBarBadgeStyle: { backgroundColor: '#EAB308', color: '#000000', fontWeight: 'bold' } 
        }} 
      />
      
      <Tabs.Screen name="orders" options={{ title: 'Mis Pedidos', tabBarIcon: ({ color }) => <FontAwesome name="list-alt" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <TabLayoutContent />
    </SafeAreaProvider>
  );
}