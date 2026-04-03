import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function AdminLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' }, // Cabecera negra
        headerTintColor: '#EAB308', // Texto y botones amarillos
        // 👇 ARREGLO: Quitamos textTransform de aquí
        headerTitleStyle: { fontWeight: '900' },
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.push('/(client)')} 
            className="flex-row items-center ml-2 active:opacity-50"
          >
            <FontAwesome name="arrow-left" size={18} color="#EAB308" />
            <Text className="text-yellow-500 font-bold ml-2">Salir</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        // 👇 ARREGLO: Ponemos el título en mayúsculas directamente
        options={{ title: 'PANEL ADMIN' }} 
      />
      
      <Stack.Screen 
        name="menu-manager" 
        // 👇 ARREGLO: Ponemos el título en mayúsculas directamente
        options={{ title: 'GESTOR DE MENÚ' }} 
      />
    </Stack>
  );
}