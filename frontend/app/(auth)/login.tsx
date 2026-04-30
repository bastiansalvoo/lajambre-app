import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/api/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🛠️ ESTADO PARA NUESTRO CUSTOM MODAL
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showCustomAlert = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showCustomAlert('Atención 🍔', 'Antes de pedir, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.access_token; 
      const userRole = response.data.user.role; 

      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userRole', userRole); 

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (userRole === 'ADMIN') {
        router.replace('/(admin)/dashboard'); 
      } else {
        router.replace('/(client)'); 
      }

    } catch (error: any) {
      // 🕵️‍♂️ INTERCEPTAMOS EL 401 PARA UN MENSAJE BONITO
      let finalTitle = 'Acceso Denegado 🔒';
      let finalMsg = 'Ocurrió un error al intentar acceder.';

      if (error.response?.status === 401) {
        finalTitle = 'Problemas en Cocina 💥';
        finalMsg = 'Correo o contraseña incorrectos.\n¡Verifica y vuelve a intentarlo!';
      } else if (error.response?.data?.message) {
        const msg = error.response.data.message;
        finalMsg = Array.isArray(msg) ? msg[0] : msg;
      }

      showCustomAlert(finalTitle, finalMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black justify-center px-6" edges={['left', 'right', 'bottom', 'top']}>
      
      {/* Botón para volver atrás */}
      <TouchableOpacity 
        onPress={() => router.replace('/(client)')}
        className="absolute top-12 left-6 z-50 p-2"
      >
        <FontAwesome name="arrow-left" size={20} color="#EAB308" />
      </TouchableOpacity>

      <View className="items-center mb-10">
        <View className="bg-yellow-500 w-20 h-20 rounded-full items-center justify-center mb-4 shadow-lg shadow-yellow-500/20">
          <FontAwesome name="lock" size={40} color="black" />
        </View>
        <Text className="text-white text-3xl font-black uppercase tracking-widest">Lajambre</Text>
        <Text className="text-yellow-500 font-bold tracking-widest mt-1">ACCESO RESTRINGIDO</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Correo Electrónico</Text>
          <TextInput 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-xl font-bold"
            placeholder="tu@correo.com"
            placeholderTextColor="#525252"
          />
        </View>

        <View className="mt-4">
          <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Contraseña</Text>
          <TextInput 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-xl font-bold"
            placeholder="••••••••"
            placeholderTextColor="#525252"
          />
        </View>

        <TouchableOpacity 
          onPress={handleLogin}
          disabled={isLoading}
          className={`bg-yellow-500 p-5 rounded-2xl items-center mt-8 ${isLoading && 'opacity-50'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-black uppercase text-lg">Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.replace('/(auth)/register')}
          className="mt-6 items-center p-2"
        >
          <Text className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">
            ¿No tienes cuenta? <Text className="text-yellow-500">Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🍔 CUSTOM MODAL - ALERTA ELEGANTE DE LA JAMBRE */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Fondo semi-transparente */}
        <View className="flex-1 bg-black/80 justify-center items-center px-8">
          
          {/* Contenedor de la Alerta (Dark con borde amarillo) */}
          <View className="bg-neutral-900 border-2 border-yellow-500 rounded-3xl p-6 w-full shadow-2xl shadow-yellow-500/20">
            
            {/* Cabecera con Icono de Candado Amarillo */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-yellow-500 items-center justify-center mb-3">
                <FontAwesome name="lock" size={32} color="black" />
              </View>
              {/* Título: Amarillo, Bold, Uppercase */}
              <Text className="text-yellow-500 text-center font-black text-xl uppercase tracking-wider">
                {modalTitle}
              </Text>
            </View>

            {/* Mensaje: Blanco */}
            <Text className="text-neutral-200 text-center text-sm font-bold mt-2 mb-6 leading-5">
              {modalMessage}
            </Text>

            {/* Botones de Acción */}
            <View className="space-y-3">
              {/* Botón Principal: Amarillo */}
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="bg-yellow-500 p-4 rounded-xl items-center active:bg-yellow-600"
              >
                <Text className="text-black font-black uppercase text-sm tracking-widest">
                  Intentar de nuevo
                </Text>
              </TouchableOpacity>

              {/* Botón Secundario: Borde Gris */}
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false);
                  router.replace('/(auth)/register');
                }}
                className="bg-neutral-800 border border-neutral-700 p-4 rounded-xl items-center active:bg-neutral-700"
              >
                <Text className="text-neutral-400 font-bold uppercase text-xs tracking-widest">
                  Crear una cuenta
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}