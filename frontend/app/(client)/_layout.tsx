import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { View, Text, Image } from 'react-native';
// 🛡️ SafeAreaProvider moderno
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// 🏷️ Componente personalizado para la marca
function LogoHeader() {
  return (
    <View className="flex-row items-center gap-x-3">
      {/* Tu logo .png local */}
      <Image
        source={require('../../assets/images/menu/logo.png')}
        className="w-11 h-11"
        resizeMode="contain"
      />
      {/* El nombre en amarillo bold para combinar */}
       <View className="flex-col justify-center">
        {/* Nombre Principal */}
        <Text className="text-yellow-500 text-xl font-black uppercase tracking-tight">
          Lajambre
        </Text>
        {/* El nuevo eslogan (mt-[-4px] es el truco para que quede súper pegado hacia arriba) */}
        <Text className="text-white text-[10px] font-bold uppercase tracking-widest mt-[-4px]">
          Ganas de un gustito?
        </Text>
      </View>
    </View>
  );
}

function TabLayoutContent() {
  // 🛡️ Hook para calcular los espacios seguros del celular
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EAB308', // Amarillo Tailwind (yellow-500)
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#000000', // Fondo negro absoluto para la barra inferior
          borderTopColor: '#262626', // Borde sutil gris oscuro
          // 🛡️ ARREGLO FINAL: Usamos insets.bottom para darle espacio seguro abajo
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 10, // Espacio extra sobre los botones
        },
        headerStyle: {
          backgroundColor: '#000000', // Fondo negro absoluto para la cabecera superior
          elevation: 0, // Quita sombra en Android
          shadowOpacity: 0, // Quita sombra en iOS
        },
        headerTitleAlign: 'center',
      }}>
      
      {/* 🍔 Pestaña MENÚ */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          headerTitle: () => <LogoHeader />,
          tabBarLabel: 'Menú', 
          tabBarIcon: ({ color }) => <FontAwesome name="cutlery" size={24} color={color} /> 
        }} 
      />
      
      {/* 🛒 Otras pestañas */}
      <Tabs.Screen name="cart" options={{ title: 'Carrito', tabBarIcon: ({ color }) => <FontAwesome name="shopping-cart" size={24} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Mis Pedidos', tabBarIcon: ({ color }) => <FontAwesome name="list-alt" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    // 🛡️ Envolvemos todo en SafeAreaProvider
    <SafeAreaProvider>
      <TabLayoutContent />
    </SafeAreaProvider>
  );
}