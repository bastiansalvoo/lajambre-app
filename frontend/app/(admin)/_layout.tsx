import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function AdminLayout() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Leemos el carnet que guardamos en el login
        const role = await SecureStore.getItemAsync('userRole');
        
        if (role !== 'ADMIN') {
          // Si es un USER normal (o no hay rol), lo expulsamos a la tienda
          Toast.show({
            type: 'error',
            text1: 'Acceso Restringido',
            text2: 'Esta área es exclusiva para el personal de La Jambre.'
          });
          router.replace('/(client)');
        } else {
          // Si es ADMIN, le damos pase libre
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Error verificando permisos:", error);
        router.replace('/(client)');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, []);

  // Pantalla de carga negra mientras verifica (evita parpadeos)
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  // Si no está autorizado, no dibujamos nada de la UI de Admin
  if (!isAuthorized) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' }, // Cabecera negra
        headerTintColor: '#EAB308', // Texto y botones amarillos
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
        options={{ title: 'PANEL ADMIN' }} 
      />
      
      <Stack.Screen 
        name="menu-manager" 
        options={{ title: 'GESTOR DE MENÚ' }} 
      />
    </Stack>
  );
}