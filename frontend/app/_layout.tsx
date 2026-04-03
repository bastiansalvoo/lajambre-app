import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import "../global.css";

// 👇 1. Importamos las herramientas de React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(client)',
};

// 👇 2. Creamos la instancia del cliente (el gestor de la caché)
const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    // 👇 3. Envolvemos toda la app con el Provider de Query
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="webpay-result" options={{ title: 'Resultado del Pago' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
    </QueryClientProvider>
  );
}