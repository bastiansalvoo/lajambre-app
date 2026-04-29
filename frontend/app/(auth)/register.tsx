import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { api } from '../../src/api/api';

export default function RegisterScreen() {
  const router = useRouter();
  
  // Estados del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validaciones básicas antes de disparar la petición
    if (!name || !email || !password || !phone) {
      Alert.alert('Atención', 'Todos los campos son obligatorios para tu registro.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Seguridad', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      // Enviamos los datos al endpoint de NestJS
      await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
      });

      // Si llegamos aquí, el backend ya guardó al usuario y envió el correo
      Alert.alert(
        '¡Casi listo!', 
        'Hemos enviado un correo de verificación a tu bandeja de entrada. Por favor, confirma tu cuenta para poder iniciar sesión.',
        [{ text: 'Entendido', onPress: () => router.replace('/(auth)/login') }]
      );

    } catch (error: any) {
      console.error("Error de Registro:", error);
      const msg = error.response?.data?.message || "No se pudo procesar el registro.";
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-950 px-6" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          
          <TouchableOpacity onPress={() => router.back()} className="mb-8 w-10">
            <FontAwesome name="arrow-left" size={20} color="#EAB308" />
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="text-white text-4xl font-black uppercase tracking-tighter">Únete a</Text>
            <Text className="text-yellow-500 text-4xl font-black uppercase tracking-tighter">La Jambre</Text>
            <Text className="text-neutral-500 mt-2 font-bold uppercase text-[10px] tracking-widest">
              Crea tu cuenta de cliente
            </Text>
          </View>

          <View className="space-y-4">
            {/* Nombre */}
            <View>
              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Nombre Completo</Text>
              <TextInput 
                value={name}
                onChangeText={setName}
                className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-xl font-bold"
                placeholder="Ej: Bastián Salvo"
                placeholderTextColor="#525252"
              />
            </View>

            {/* Teléfono */}
            <View className="mt-4">
              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Teléfono</Text>
              <TextInput 
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-xl font-bold"
                placeholder="+56 9 1234 5678"
                placeholderTextColor="#525252"
              />
            </View>

            {/* Correo */}
            <View className="mt-4">
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

            {/* Contraseña */}
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
              onPress={handleRegister}
              disabled={isLoading}
              className={`bg-yellow-500 p-5 rounded-2xl items-center mt-10 shadow-lg shadow-yellow-500/20 ${isLoading && 'opacity-50'}`}
            >
              {isLoading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-black uppercase text-lg">Registrarme</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.replace('/(auth)/login')}
              className="mt-6 mb-10 items-center"
            >
              <Text className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">
                ¿Ya tienes cuenta? <Text className="text-yellow-500">Inicia Sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}