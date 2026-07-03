import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, ActivityIndicator, Image } from 'react-native';
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
        const role = await SecureStore.getItemAsync('userRole');

        if (role !== 'ADMIN') {
          Toast.show({
            type: 'error',
            text1: 'Acceso Restringido',
            text2: 'Esta área es exclusiva para el personal de Lajambre.',
          });
          router.replace('/(client)');
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Error verificando permisos:', error);
        router.replace('/(client)');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  if (!isAuthorized) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#060606' },
        headerTintColor: '#EAB308',
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerTitle: () => (
          <View className="flex-row items-center bg-neutral-900/80 px-4 py-2 rounded-full border border-yellow-500/20">
            <Image
              source={require('../../assets/images/menu/logo.png')}
              className="w-4 h-4 mr-2"
              resizeMode="contain"
            />
            <Text className="text-white font-black tracking-widest uppercase text-[10px]">Administración</Text>
          </View>
        ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push('/(client)')}
            className="w-9 h-9 items-center justify-center bg-neutral-900 rounded-full border border-neutral-800 ml-4"
          >
            <FontAwesome name="sign-out" size={14} color="#EAB308" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="menu-manager" />
      <Stack.Screen name="extras-manager" />
      <Stack.Screen name="live-orders" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}