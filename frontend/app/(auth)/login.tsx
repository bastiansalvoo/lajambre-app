import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Pedimos permiso al backend
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.access_token; 
      const userRole = response.data.user.role; // Extraemos el rol de la respuesta

      // 2. Guardamos la "llave" y el "rol" en la bóveda del celular
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userRole', userRole); // <-- GUARDAMOS EL ROL AQUÍ

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 4. Leemos el rol y decidimos a dónde mandarlo
      if (userRole === 'ADMIN') {
        router.replace('/(admin)/dashboard'); // Angelo va a la cocina
      } else {
        router.replace('/(client)'); // El cliente normal vuelve a la tienda
      }

    } catch (error: any) {
      console.error("Error de Login:", error);
      
      // Capturamos el mensaje exacto de NestJS (Ej: "Credenciales incorrectas")
      const msg = error.response?.data?.message || "Ocurrió un error al intentar acceder.";
      const finalMsg = Array.isArray(msg) ? msg[0] : msg;

      // Mostramos una alerta inteligente ofreciendo ir al registro
      Alert.alert(
        'Acceso Denegado', 
        `${finalMsg}\n\n¿No tienes una cuenta en La Jambre?`,
        [
          { text: 'Intentar de nuevo', style: 'cancel' },
          { text: 'Registrarme', onPress: () => router.replace('/(auth)/register') }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-950 justify-center px-6" edges={['left', 'right', 'bottom', 'top']}>
      
      {/* Botón para volver atrás */}
      <TouchableOpacity 
        onPress={() => router.replace('/(client)')}
        className="absolute top-12 left-6 z-50 p-2"
      >
        <FontAwesome name="arrow-left" size={20} color="#EAB308" />
      </TouchableOpacity>

      <View className="items-center mb-10">
        <View className="bg-yellow-500 w-20 h-20 rounded-full items-center justify-center mb-4">
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
          className="mt-6 items-center"
        >
          <Text className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">
            ¿No tienes cuenta? <Text className="text-yellow-500">Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}