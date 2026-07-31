import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import "../global.css";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppAlertModal from '../src/components/AppAlertModal';


export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // El menu, categorias y extras casi no cambian: sin esto, cada vez que
      // se vuelve a una pantalla (useFocusEffect/remount) se vuelve a pedir
      // todo al servidor en vez de mostrar al instante lo que ya esta en cache.
      staleTime: 60 * 1000,
    },
  },
});

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

  return (
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
      <AppAlertModal />
    </SafeAreaProvider>
  );
}
