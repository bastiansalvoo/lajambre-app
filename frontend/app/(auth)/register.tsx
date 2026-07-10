import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  Image, ImageBackground, KeyboardAvoidingView, Platform,
  Animated as RNAnimated,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { api } from '../../src/api/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const bgFade = useRef(new RNAnimated.Value(0)).current;
  const cardSlide = useRef(new RNAnimated.Value(60)).current;
  const cardFade = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.sequence([
      RNAnimated.timing(bgFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      RNAnimated.parallel([
        RNAnimated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        RNAnimated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      Toast.show({ type: 'error', text1: 'Atención', text2: 'Todos los campos son obligatorios.' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Seguridad', text2: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/register', { name, email, phone, password });
      Toast.show({ type: 'success', text1: '¡Casi listo! 🎉', text2: 'Revisá tu correo y confirmá tu cuenta para empezar a pedir.' });
      router.replace('/(auth)/login');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'No se pudo procesar el registro.';
      Toast.show({ type: 'error', text1: 'Error', text2: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* ── FONDO ── */}
      <RNAnimated.View style={{ opacity: bgFade, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <ImageBackground
          source={require('../../assets/images/menu/banner2.jpg')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        >
          <View className="flex-1 bg-black/75" />
        </ImageBackground>
      </RNAnimated.View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Volver */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10 mb-6"
            >
              <FontAwesome name="arrow-left" size={16} color="white" />
            </TouchableOpacity>

            {/* Header */}
            <View className="mb-8">
              <Text className="text-white text-4xl font-black uppercase tracking-tight">
                Creá tu
              </Text>
              <View className="flex-row items-center gap-x-2">
                <Text className="text-yellow-500 text-4xl font-black uppercase tracking-tight">
                  Cuenta
                </Text>
                <Image
                  source={require('../../assets/images/menu/logo.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-white mt-2 font-bold uppercase text-[11px]">
                Y empieza a acumular puntos
              </Text>
            </View>

            {/* Tarjeta Glass */}
            <RNAnimated.View
              style={{ opacity: cardFade, transform: [{ translateY: cardSlide }] }}
              className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6"
            >
              {/* Nombre */}
              <View className="mb-4">
                <View className="flex-row items-center gap-x-2 mb-2 ml-1">
                  <FontAwesome name="user-o" size={12} color="#EAB308" />
                  <Text className="text-white font-bold uppercase text-[10px]">Nombre Completo</Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-white/5 border border-white/10 text-white p-4 rounded-2xl font-bold text-base"
                  placeholder="Ej: Bastián Salvo"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
              </View>

              {/* Teléfono */}
              <View className="mb-4">
                <View className="flex-row items-center gap-x-2 mb-2 ml-1">
                  <FontAwesome name="phone" size={12} color="#EAB308" />
                  <Text className="text-white font-bold uppercase text-[10px]">Teléfono</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="bg-white/5 border border-white/10 text-white p-4 rounded-2xl font-bold text-base"
                  placeholder="+56 9 1234 5678"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
              </View>

              {/* Correo */}
              <View className="mb-4">
                <View className="flex-row items-center gap-x-2 mb-2 ml-1">
                  <FontAwesome name="envelope-o" size={12} color="#EAB308" />
                  <Text className="text-white font-bold uppercase text-[10px]">Correo Electrónico</Text>
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

              {/* Contraseña */}
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
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-0 bottom-0 justify-center"
                  >
                    <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                </View>
                <Text className="text-white/40 text-[10px] mt-1 ml-1">Mínimo 6 caracteres</Text>
              </View>

              {/* Botón */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
                className={`bg-yellow-500 p-5 rounded-2xl items-center mt-6 ${isLoading ? 'opacity-50' : ''}`}
                style={{ shadowColor: '#EAB308', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="black" size="small" />
                ) : (
                  <View className="flex-row items-center gap-x-2">
                    <FontAwesome name="user-plus" size={18} color="black" />
                    <Text className="text-black font-black uppercase text-base">Registrarme</Text>
                  </View>
                )}
              </TouchableOpacity>
            </RNAnimated.View>

            {/* Footer */}
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} className="mt-8 items-center py-3">
              <Text className="text-white font-bold uppercase text-[11px]">
                ¿Ya tienes cuenta?{' '}
                <Text className="text-yellow-500">Iniciar Sesión</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
