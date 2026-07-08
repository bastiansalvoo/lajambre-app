import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import "../global.css";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, useWindowDimensions, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

// Diseño personalizado Toast (Modo Oscuro Lajambre)
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

export default function RootLayout() {
  const { height } = useWindowDimensions();
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

  const isWeb = Platform.OS === 'web';

  return (
    // Fondo gris oscuro para el área exterior a la "pantalla del celular" en PC
    <View style={[styles.outerContainer, { backgroundColor: isWeb ? '#111' : '#000' }]}>
      {/* 
        Contenedor interno: en web usa maxWidth + alignSelf para centrarse.
        Esto es el equivalente CSS de: max-width: 480px; margin: 0 auto;
        Funciona incluso si width=0 durante SSR porque maxWidth solo limita, no colapsa.
      */}
      <View style={[
        styles.innerContainer,
        isWeb ? styles.webInner : styles.nativeInner,
      ]}>
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

const styles = StyleSheet.create({
  // Ocupa todo el alto y ancho de la pantalla/ventana
  outerContainer: {
    flex: 1,
  },
  // Base compartida para ambos modos
  innerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  // En web: limita el ancho y se centra con margin auto (alignSelf: 'center' + width: '100%' + maxWidth)
  webInner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  // En nativo: ocupa todo el ancho disponible
  nativeInner: {
    width: '100%',
  },
});

