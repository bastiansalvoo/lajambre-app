import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal,
  Image, ImageBackground, KeyboardAvoidingView, Platform, Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/api/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animaciones con stagger
  const bgFade = useRef(new RNAnimated.Value(0)).current;
  const cardSlide = useRef(new RNAnimated.Value(60)).current;
  const cardFade = useRef(new RNAnimated.Value(0)).current;
  const brandScale = useRef(new RNAnimated.Value(0.85)).current;
  const brandFade = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.sequence([
      RNAnimated.timing(bgFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      RNAnimated.parallel([
        RNAnimated.spring(brandScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        RNAnimated.timing(brandFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      RNAnimated.parallel([
        RNAnimated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        RNAnimated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'info'>('error');

  const showCustomAlert = (title: string, message: string, type: 'error' | 'info' = 'error') => {
    setModalTitle(title); setModalMessage(message); setModalType(type); setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showCustomAlert('¡Atención! 🍔', 'Ingresá tu correo y contraseña para entrar.', 'info');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      const { access_token: token, refresh_token: refreshToken, user } = response.data;
      // Guardamos ambos tokens en la bóveda
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('userRole', user.role);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      router.replace(user.role === 'ADMIN' ? '/(admin)/dashboard' : '/(client)');
    } catch (error: any) {
      let title = 'Acceso Denegado 🔒', msg = 'Ocurrió un error. Intentá de nuevo.';
      if (error.response?.status === 401) {
        title = 'Problemas en Cocina 💥';
        msg = 'Correo o contraseña incorrectos.\n¡Verificá y volvé a intentarlo!';
      } else if (error.response?.data?.message) {
        msg = Array.isArray(error.response.data.message) ? error.response.data.message[0] : error.response.data.message;
      }
      showCustomAlert(title, msg);
    } finally {
      setIsLoading(false);
    }
  };

  const borderColor = modalType === 'info' ? 'border-yellow-500' : 'border-red-500';
  const iconBg = modalType === 'info' ? 'bg-yellow-500' : 'bg-red-500';
  const iconName = modalType === 'info' ? 'info-circle' : 'exclamation-triangle';

  return (
    <View className="flex-1 bg-black">
      {/* ── FONDO: Imagen de burger con overlay oscuro ── */}
      <RNAnimated.View style={{ opacity: bgFade, ...StyleSheet.absoluteFillObject }}>
        <ImageBackground
          source={require('../../assets/images/menu/banner.jpg')}
          className="flex-1"
          resizeMode="cover"
        >
          <View className="flex-1 bg-black/75" />
        </ImageBackground>
      </RNAnimated.View>

      <SafeAreaView className="flex-1" edges={['left', 'right', 'bottom', 'top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 justify-between px-6 pt-4 pb-8">
            {/* ── VOLVER ── */}
            <TouchableOpacity
              onPress={() => router.replace('/(client)')}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
            >
              <FontAwesome name="arrow-left" size={16} color="white" />
            </TouchableOpacity>

            {/* ── BRANDING HERO ── */}
            <RNAnimated.View
              style={{ opacity: brandFade, transform: [{ scale: brandScale }] }}
              className="items-center mt-6"
            >
              <Image
                source={require('../../assets/images/menu/logo.png')}
                className="w-24 h-24"
                resizeMode="contain"
              />
              <Text className="text-white text-5xl font-black uppercase mt-3">
                Lajambre
              </Text>
              <View className="flex-row items-center gap-x-3 mt-3">
                <View className="h-px flex-1 bg-yellow-500/30 max-w-[60px]" />
                <Text className="text-yellow-500 font-black text-xs uppercase">
                  Ganas de un gustito?
                </Text>
                <View className="h-px flex-1 bg-yellow-500/30 max-w-[60px]" />
              </View>
            </RNAnimated.View>

            {/* ── TARJETA GLASS ── */}
            <RNAnimated.View
              style={{ opacity: cardFade, transform: [{ translateY: cardSlide }] }}
              className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mt-8"
            >
              <Text className="text-white font-black uppercase text-[11px] mb-6 text-center">
                Iniciar Sesión
              </Text>

              {/* Email */}
              <View className="mb-4">
                <View className="flex-row items-center gap-x-2 mb-2 ml-1">
                  <FontAwesome name="envelope-o" size={12} color="#EAB308" />
                  <Text className="text-white font-bold uppercase text-[10px]">Correo</Text>
                </View>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="bg-white/5 border border-white/10 text-white p-4 rounded-2xl font-bold text-base"
                  placeholder="tu@correo.com"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
              </View>

              {/* Password */}
              <View className="mb-2">
                <View className="flex-row items-center gap-x-2 mb-2 ml-1">
                  <FontAwesome name="lock" size={12} color="#EAB308" />
                  <Text className="text-white font-bold uppercase text-[10px]">Contraseña</Text>
                </View>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="bg-white/5 border border-white/10 text-white p-4 pr-14 rounded-2xl font-bold text-base"
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-0 bottom-0 justify-center"
                  >
                    <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botón */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
                className={`bg-yellow-500 p-5 rounded-2xl items-center mt-6 ${
                  isLoading ? 'opacity-50' : ''
                }`}
                style={{ shadowColor: '#EAB308', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="black" size="small" />
                ) : (
                  <View className="flex-row items-center gap-x-2">
                    <FontAwesome name="sign-in" size={18} color="black" />
                    <Text className="text-black font-black uppercase text-base">Ingresar</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Registro */}
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/register')}
                className="mt-6 items-center py-2"
              >
                <Text className="text-white font-bold uppercase text-[11px]">
                  ¿No tenés cuenta?{' '}
                  <Text className="text-yellow-500">Registrate</Text>
                </Text>
              </TouchableOpacity>
            </RNAnimated.View>

            {/* ── FOOTER ── */}
            <Text className="text-white/15 text-[10px] text-center mt-4">
              HAMBURGUESAS · DELIVERY · PUNTOS
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── MODAL ── */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center px-8">
          <View className={`bg-neutral-900 border-2 ${borderColor} rounded-3xl p-6 w-full shadow-2xl`} style={{ maxWidth: 380 }}>
            <View className="items-center mb-4">
              <View className={`w-16 h-16 rounded-full ${iconBg} items-center justify-center mb-3`}>
                <FontAwesome name={iconName} size={28} color={modalType === 'info' ? 'black' : 'white'} />
              </View>
              <Text className="text-yellow-500 text-center font-black text-xl uppercase tracking-wider">{modalTitle}</Text>
            </View>
            <Text className="text-neutral-200 text-center text-sm font-bold mt-2 mb-6 leading-5">{modalMessage}</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="bg-yellow-500 p-4 rounded-xl items-center"
            >
              <Text className="text-black font-black uppercase text-sm">Intentar de nuevo</Text>
            </TouchableOpacity>
            {modalType === 'error' && (
              <TouchableOpacity
                onPress={() => { setModalVisible(false); router.replace('/(auth)/register'); }}
                className="bg-white/5 border border-white/10 p-4 rounded-xl items-center mt-3"
              >
                <Text className="text-white font-bold uppercase text-xs">Crear una cuenta</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const StyleSheet = { absoluteFillObject: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 } };