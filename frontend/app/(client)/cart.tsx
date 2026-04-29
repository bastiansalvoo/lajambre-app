import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // 👈 Importamos la bóveda

import { useCartStore } from '../../src/store/cartStore';

export default function CartScreen() {
  const router = useRouter();
  const [isDelivery, setIsDelivery] = useState(true);

  const { items, removeItem, updateQuantity } = useCartStore();

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCost = isDelivery ? 1250 : 0;
  const finalTotal = totalAmount + deliveryCost;

  // 👇 LA NUEVA FUNCIÓN BARRERA
  const handleProceedToPay = async () => {
    try {
      // Buscamos si el usuario ya inició sesión
      const token = await SecureStore.getItemAsync('userToken');

      if (!token) {
        // No está logueado: Lo mandamos al Login/Registro
        Alert.alert(
          'Identifícate',
          'Para continuar con tu pedido, necesitamos saber quién eres para llevarte la comida.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Iniciar Sesión', 
              onPress: () => router.push('/(auth)/login') 
            }
          ]
        );
        return;
      }

      // Sí está logueado: Avanza al flujo de pago (Próxima etapa)
      Alert.alert('Éxito', '¡Estás logueado! Aquí conectaremos la pasarela de pago o enviaremos la orden a la cocina.');
      
      // TODO: En el futuro aquí llamaremos a: api.post('/orders', { items, isDelivery ... })

    } catch (error) {
      console.error("Error al verificar token:", error);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950 justify-center items-center px-6">
        <FontAwesome name="shopping-basket" size={80} color="#262626" />
        <Text className="text-white text-2xl font-black mt-6 uppercase tracking-widest text-center">
          Tu pedido está vacío
        </Text>
        <Text className="text-neutral-500 mt-2 text-center text-base">
          Agrega unas deliciosas burgers desde el menú para calmar ese antojo.
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/(client)')}
          className="bg-yellow-500 px-8 py-4 rounded-xl mt-8 active:bg-yellow-600"
        >
          <Text className="text-black font-black uppercase tracking-widest text-lg">
            Ir al Menú
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={['left', 'right']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-2xl font-black uppercase tracking-widest mb-4">
          Tu Pedido
        </Text>

        <View className="flex-row bg-neutral-900 rounded-xl p-1 mb-6 border border-neutral-800">
          <TouchableOpacity 
            onPress={() => setIsDelivery(true)}
            className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${isDelivery ? 'bg-yellow-500' : 'bg-transparent'}`}
          >
            <FontAwesome name="motorcycle" size={16} color={isDelivery ? 'black' : '#9CA3AF'} />
            <Text className={`ml-2 font-bold ${isDelivery ? 'text-black' : 'text-neutral-400'}`}>Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsDelivery(false)}
            className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${!isDelivery ? 'bg-yellow-500' : 'bg-transparent'}`}
          >
            <FontAwesome name="shopping-bag" size={16} color={!isDelivery ? 'black' : '#9CA3AF'} />
            <Text className={`ml-2 font-bold ${!isDelivery ? 'text-black' : 'text-neutral-400'}`}>Retiro en local</Text>
          </TouchableOpacity>
        </View>

        {items.map((item) => (
          <View key={item.id} className="flex-row bg-neutral-900 p-3 rounded-2xl mb-4 items-center border border-neutral-800">
            <Image 
              source={item.image ? { uri: item.image } : require('../../assets/images/menu/bbq.jpg')} 
              className="w-20 h-20 rounded-xl bg-black" 
              resizeMode="cover" 
            />
            <View className="flex-1 ml-4">
              <View className="flex-row justify-between items-start">
                <Text className="text-white font-black text-[15px] uppercase flex-1 mr-2" numberOfLines={2}>
                  {item.name}
                </Text>
                <TouchableOpacity 
                  className="p-1 active:opacity-50"
                  onPress={() => removeItem(item.id)}
                >
                  <FontAwesome name="trash-o" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View className="flex-row justify-between items-end mt-2">
                <Text className="text-yellow-500 font-black text-lg">
                  ${item.price.toLocaleString('es-CL')}
                </Text>
                <View className="flex-row items-center bg-black rounded-lg p-1 border border-neutral-800">
                  <TouchableOpacity 
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 bg-neutral-800 rounded flex items-center justify-center active:bg-neutral-700"
                  >
                    <FontAwesome name="minus" size={12} color="white" />
                  </TouchableOpacity>
                  <Text className="text-white font-bold mx-3 text-sm">{item.quantity}</Text>
                  <TouchableOpacity 
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 bg-yellow-500 rounded flex items-center justify-center active:bg-yellow-600"
                  >
                    <FontAwesome name="plus" size={12} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View className="mt-4 mb-8 bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
          <View className="flex-row justify-between mb-2">
            <Text className="text-neutral-400">Subtotal</Text>
            <Text className="text-white">${totalAmount.toLocaleString('es-CL')}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-neutral-400">{isDelivery ? 'Costo de Envío' : 'Costo de Retiro'}</Text>
            <Text className="text-white">{deliveryCost === 0 ? 'Gratis' : `$${deliveryCost.toLocaleString('es-CL')}`}</Text>
          </View>
          <View className="h-[1px] bg-neutral-800 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-white font-bold">Total estimado</Text>
            <Text className="text-yellow-500 font-bold">${finalTotal.toLocaleString('es-CL')}</Text>
          </View>
        </View>
        <View className="h-32" />
      </ScrollView>

      <View className="absolute bottom-0 w-full bg-neutral-900 rounded-t-3xl border-t border-neutral-800 p-6 shadow-2xl">
        {/* 👇 Modificamos el onPress para usar nuestra función barrera */}
        <TouchableOpacity 
          onPress={handleProceedToPay}
          className="bg-yellow-500 rounded-xl py-4 flex-row justify-center items-center active:bg-yellow-600"
        >
          <Text className="text-black text-lg font-black uppercase tracking-widest mr-2">
            Ir a Pagar • ${finalTotal.toLocaleString('es-CL')}
          </Text>
          <FontAwesome name="arrow-right" size={18} color="black" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}