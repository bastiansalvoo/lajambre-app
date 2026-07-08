import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import "../global.css";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

// 👇 Diseño personalizado Toast (Modo Oscuro Lajambre)
const toastConfig = {
  success: (props: any) => (
    <View className="w-[85%] bg-neutral-900 border-2 border-yellow-500 rounded-3xl p-6 items-center shadow-2xl shadow-yellow-500/40">
      <View className="w-16 h-16 bg-yellow-500 rounded-full items-center justify-center mb-4">
        <FontAwesome name="check" size={32} color="black" />
      </View>
      <Text className="text-yellow-500 font-black uppercase text-lg tracking-widest text-center">{props.text1}</Text>
      {props.text2 && <Text className="text-white font-bold text-sm text-center mt-2 leading-5">{props.text2}</Text>}
    </View>
  ),
  error: (props: any) => (
    <View className="w-[85%] bg-neutral-900 border-2 border-red-500 rounded-3xl p-6 items-center shadow-2xl shadow-red-500/40">
      <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center mb-4">
        <FontAwesome name="warning" size={32} color="white" />
      </View>
      <Text className="text-red-500 font-black uppercase text-lg tracking-widest text-center">{props.text1}</Text>
      {props.text2 && <Text className="text-white font-bold text-sm text-center mt-2 leading-5">{props.text2}</Text>}
    </View>
  ),
};

// Ancho máximo para la versión web (emula pantalla de celular centrada)
const MAX_APP_WIDTH = 480;

export default function RootLayout() {
  const { height, width } = useWindowDimensions();
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

  // En Web: envolvemos toda la app en un contenedor de ancho limitado centrado.
  // En Nativo (iOS/Android): la app ocupa toda la pantalla normalmente.
  const isWeb = Platform.OS === 'web';

  return (
    // Fondo oscuro exterior (solo se ve en el PC, a los lados de la "pantalla del celular")
    <View style={{ flex: 1, backgroundColor: isWeb ? '#111' : '#000', alignItems: 'center' }}>
      {/* Contenedor que emula la pantalla del celular en el web */}
      <View style={{
        flex: 1,
        width: isWeb ? Math.min(width, MAX_APP_WIDTH) : '100%',
        backgroundColor: '#000',
        // Sombra sutil para que la "pantalla del celular" resalte en el fondo oscuro
        ...(isWeb && width > MAX_APP_WIDTH ? {
          shadowColor: '#EAB308',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 30,
        } : {}),
      }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(client)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            </Stack>
          </QueryClientProvider>
          
          <Toast 
            config={toastConfig} 
            position="bottom" 
            bottomOffset={height / 2 - 100}
            visibilityTime={3500}
          />
        </SafeAreaProvider>
      </View>
    </View>
  );
}

