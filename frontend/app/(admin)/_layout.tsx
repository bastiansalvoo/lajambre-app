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
            text2: 'Esta área es exclusiva para el personal de La Jambre.',
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
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#EAB308',
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerTitle: () => (
          <View className="flex-row items-center gap-x-2">
            <Image
              source={require('../../assets/images/menu/logo.png')}
              className="w-5 h-5"
              resizeMode="contain"
            />
            <Text className="text-white font-black uppercase text-sm">Admin</Text>
          </View>
        ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push('/(client)')}
            className="flex-row items-center ml-2"
          >
            <FontAwesome name="arrow-left" size={16} color="#EAB308" />
            <Text className="text-yellow-500 font-bold ml-1.5 text-xs">Salir</Text>
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