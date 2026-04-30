import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/api/api';
import { useCartStore } from '../../src/store/cartStore';

export default function DashboardScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas salir del panel de administración?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, salir", 
          style: "destructive",
          onPress: async () => {
            try {
              // Vaciamos el carrito del admin (si hizo pruebas)
              useCartStore.getState().clearCart();
              
              await SecureStore.deleteItemAsync('userToken');
              delete api.defaults.headers.common['Authorization'];
              router.replace('/(auth)/login');
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-950 px-6 pt-6" edges={['left', 'right', 'bottom']}>
      
      <View className="flex-row justify-between items-start mb-8">
        <View>
          <Text className="text-white text-3xl font-black uppercase tracking-widest mb-2">
            Resumen
          </Text>
          <Text className="text-neutral-400 text-base">
            ¿Qué te gustaría gestionar hoy en Lajambre?
          </Text>
        </View>

        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-neutral-900 border border-neutral-800 w-12 h-12 rounded-xl items-center justify-center active:bg-neutral-800"
        >
          <FontAwesome name="sign-out" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(admin)/live-orders')}
        className="bg-neutral-900 border border-yellow-500/30 p-6 rounded-2xl flex-row items-center mb-4 active:bg-neutral-800 shadow-lg shadow-yellow-500/10"
      >
         <View className="bg-yellow-500 p-4 rounded-xl mr-4">
          <FontAwesome name="fire" size={24} color="black" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg uppercase tracking-wider">
            Pedidos en Vivo
          </Text>
          <Text className="text-neutral-400 text-sm mt-1">
            Monitor de cocina y despachos
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color="#EAB308" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(admin)/menu-manager')}
        className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex-row items-center mb-4 active:bg-neutral-800"
      >
        <View className="bg-yellow-500/10 p-4 rounded-xl mr-4">
          <FontAwesome name="cutlery" size={24} color="#EAB308" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg uppercase tracking-wider">
            Gestor de Menú
          </Text>
          <Text className="text-neutral-500 text-sm mt-1">
            Editar productos y precios
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color="#525252" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}