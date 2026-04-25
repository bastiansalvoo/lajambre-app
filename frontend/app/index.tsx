import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../src/api/api';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Revisamos la bóveda apenas la app despierta
        const token = await SecureStore.getItemAsync('userToken');

        if (token) {
          // 2. Si hay llave, se la inyectamos a Axios para TODO el viaje
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log("✅ Sesión restaurada desde la bóveda.");
        }

        // 3. Redirigimos al menú principal. 
        // Si el usuario es Admin, podrá usar su botón secreto (el logo) para ir al panel.
        // Si no tiene token, navegará como cliente anónimo.
        router.replace('/(client)');
        
      } catch (error) {
        console.error('Error al iniciar la app:', error);
        router.replace('/(client)'); // Ante cualquier error, al menos mostramos el menú
      }
    };

    initApp();
  }, []);

  // Mientras revisa la bóveda (toma milisegundos), mostramos un loader amarillo
  return (
    <View className="flex-1 bg-neutral-950 items-center justify-center">
      <ActivityIndicator size="large" color="#EAB308" />
    </View>
  );
}