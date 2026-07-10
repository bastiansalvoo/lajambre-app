import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, ActivityIndicator, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SecureStore from '@/src/utils/storage';

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
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(23,23,23,0.8)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)' }}>
            <Image
              source={require('../../assets/images/menu/logo.png')}
              style={{ width: 16, height: 16, marginRight: 8 }}
              resizeMode="contain"
            />
            <Text className="text-white font-black tracking-widest uppercase text-[10px]">Administración</Text>
          </View>
        ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push('/(client)')}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#171717', borderRadius: 9999, borderWidth: 1, borderColor: '#262626', marginLeft: 16 }}
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
