import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/api/api';
import { useCartStore, CartItem } from '../../src/store/cartStore';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';


export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  
  const [isDelivery, setIsDelivery] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [orderAddress, setOrderAddress] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  
  // --- NUEVO: ESTADOS PARA EL SISTEMA DE PUNTOS ---
  const [userPoints, setUserPoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchUserProfile = async () => {
        try {
          const token = await SecureStore.getItemAsync('userToken');
          if (token) {
            // 1. Cargamos perfil para teléfono/dirección
            const profileRes = await api.get('/auth/perfil');
            setOrderAddress(profileRes.data.usuario.address || '');
            setOrderPhone(profileRes.data.usuario.phone || '');
            
            // 2. Cargamos saldo de puntos fresco
            const rewardsRes = await api.get('/auth/recompensas');
            setUserPoints(rewardsRes.data.puntosActuales || 0);
          }
        } catch (error) {
          console.log("Error cargando datos en el carrito:", error);
        }
      };
      
      fetchUserProfile();
    }, [])
  );

  const getItemTotalPrice = (item: CartItem) => {
    const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
    return item.price + extrasTotal;
  };

  // --- NUEVO: CÁLCULO DINÁMICO DE DESCUENTOS POR PREMIOS ---
  let totalAmount = items.reduce((sum, item) => sum + (getItemTotalPrice(item) * item.quantity), 0);
  let deliveryCost = isDelivery ? 1250 : 0;
  let rewardDiscount = 0;

  // Verificamos si la orden tiene hamburguesas (útil para el premio BURGER_GRATIS)
  const hasBurger = items.some(item => item.price >= 5000);

  if (selectedReward === 'DELIVERY_GRATIS') {
    deliveryCost = 0;
  } else if (selectedReward === 'BEBIDA_GRATIS') {
    rewardDiscount = 1000;
  } else if (selectedReward === 'BURGER_GRATIS' && hasBurger) {
    rewardDiscount = 8490; // Valor promedio definido en el backend
  } else if (selectedReward === 'BURGER_GRATIS' && !hasBurger) {
    // Si intenta canjear burger gratis pero no lleva hamburguesas
    setSelectedReward(null);
    Toast.show({
      type: 'error',
      text1: 'Aviso',
      text2: 'Debes tener al menos una hamburguesa en el carrito para usar este premio.'
    });
  }

  // Evitamos que el total sea negativo
  let finalTotal = totalAmount + deliveryCost - rewardDiscount;
  if (finalTotal < 0) finalTotal = 0;

  // --- OPCIONES DE CANJE SEGÚN DOCUMENTO OFICIAL ---
  const REWARD_OPTIONS = [
    { id: 'BEBIDA_GRATIS', name: 'Bebida Gratis', points: 150, icon: 'glass' },
    { id: 'DELIVERY_GRATIS', name: 'Delivery Gratis', points: 200, icon: 'motorcycle' },
    { id: 'BURGER_GRATIS', name: 'Burger Gratis', points: 800, icon: 'cutlery' }
  ];

  const handleRewardSelection = (rewardId: string, requiredPoints: number) => {
    if (userPoints < requiredPoints) {
      Toast.show({
        type: 'error',
        text1: 'Puntos Insuficientes',
        text2: `Necesitas ${requiredPoints} pts. Tienes ${userPoints} pts.`
      });
      return;
    }
    // Toggle (si toca el mismo, se deselecciona)
    if (selectedReward === rewardId) {
      setSelectedReward(null);
    } else {
      setSelectedReward(rewardId);
    }
  };

  const handleOpenCheckout = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      // TODO: Refactorizar Alert interactiva
      Alert.alert('Identifícate', 'Inicia sesión para continuar con tu pedido.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir al Login', onPress: () => router.push('/(auth)/login') }
      ]);
      return;
    }
    setShowModal(true);
  };

  const confirmOrder = async () => {
    if (isDelivery && !orderAddress) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor ingresa una dirección de entrega.'
      });
      return;
    }
    if (!orderPhone) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Necesitamos un teléfono de contacto.'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // 📦 PAQUETE CORREGIDO
      const orderPayload = {
        items: items.map(item => ({ 
          productId: item.id, 
          quantity: item.quantity,
          // Corrección: extraIds en lugar de extras
          extraIds: item.extras?.map(e => e.id) || []
        })),
        deliveryAddress: isDelivery ? orderAddress : 'Retiro en Local',
        contactPhone: orderPhone,
        // Corrección: Solo mandamos la variable si NO es nula
        ...(selectedReward && { rewardType: selectedReward }) 
      };
      
      const orderResponse = await api.post('/orders', orderPayload);
      const newOrderId = orderResponse.data.id;

      setShowModal(false);
      clearCart(); 

      const payResponse = await api.post(`/orders/${newOrderId}/pay`);
      
      if (payResponse.data.token === 'GRATIS') {
        // TODO: Refactorizar Alert interactiva
        Alert.alert('¡Pedido Gratis!', 'Tu pedido fue pagado completamente con tus puntos.', [
          { text: 'Ver mis pedidos', onPress: () => router.replace('/(client)/orders') }
        ]);
        return;
      }

      const webpayUrl = `${payResponse.data.url}?token_ws=${payResponse.data.token}`;
      await WebBrowser.openBrowserAsync(webpayUrl);
      router.replace('/(client)/orders');

    } catch (error: any) {
      console.error("Error en el flujo de pago:", error);
      const msg = error.response?.data?.message || "Error al procesar pedido o conectar con Webpay";
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: Array.isArray(msg) ? msg[0] : msg
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950 justify-center items-center px-6">
        <FontAwesome name="shopping-basket" size={80} color="#262626" />
        <Text className="text-white text-2xl font-black mt-6 uppercase tracking-widest text-center">Pedido Vacío</Text>
        <TouchableOpacity onPress={() => router.push('/(client)')} className="bg-yellow-500 px-8 py-4 rounded-xl mt-8">
          <Text className="text-black font-black uppercase">Ir al Menú</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={['left', 'right']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-2xl font-black uppercase mb-4">Tu Pedido</Text>

        <View className="flex-row bg-neutral-900 rounded-xl p-1 mb-6 border border-neutral-800">
          <TouchableOpacity onPress={() => setIsDelivery(true)} className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${isDelivery ? 'bg-yellow-500' : ''}`}>
            <FontAwesome name="motorcycle" size={16} color={isDelivery ? 'black' : '#9CA3AF'} />
            <Text className={`ml-2 font-bold ${isDelivery ? 'text-black' : 'text-neutral-400'}`}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsDelivery(false)} className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${!isDelivery ? 'bg-yellow-500' : ''}`}>
            <FontAwesome name="shopping-bag" size={16} color={!isDelivery ? 'black' : '#9CA3AF'} />
            <Text className={`ml-2 font-bold ${!isDelivery ? 'text-black' : 'text-neutral-400'}`}>Retiro</Text>
          </TouchableOpacity>
        </View>

        {items.map((item) => (
          <View key={item.cartItemId} className="flex-row bg-neutral-900 p-3 rounded-2xl mb-4 border border-neutral-800">
            <Image source={item.image ? { uri: item.image } : require('../../assets/images/menu/bbq.jpg')} className="w-16 h-16 rounded-xl bg-black" />
            <View className="flex-1 ml-4 justify-between">
              <View>
                <Text className="text-white font-black uppercase text-xs">{item.name}</Text>
                {item.extras && item.extras.length > 0 && (
                  <View className="mt-1">
                    {item.extras.map(e => (
                      <Text key={e.id} className="text-neutral-500 text-[10px] uppercase font-bold">+ {e.name}</Text>
                    ))}
                  </View>
                )}
              </View>
              <View className="flex-row justify-between items-end mt-2">
                <Text className="text-yellow-500 font-bold">${getItemTotalPrice(item).toLocaleString('es-CL')}</Text>
                <View className="flex-row items-center bg-black rounded-lg p-1">
                  <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)}>
                    <FontAwesome name="minus" size={10} color="white" className="px-2 py-1" />
                  </TouchableOpacity>
                  <Text className="text-white font-bold mx-2">{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)}>
                    <FontAwesome name="plus" size={10} color="#EAB308" className="px-2 py-1" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* --- NUEVA SECCIÓN: RECOMPENSAS LAJAMBRE --- */}
        <View className="mt-2 bg-neutral-900 p-5 rounded-3xl border border-yellow-500/30 mb-4 shadow-lg shadow-yellow-500/10 relative overflow-hidden">
          <View className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl" />
          
          <View className="flex-row justify-between items-end mb-4">
            <View>
              <Text className="text-yellow-500 font-black uppercase tracking-widest text-lg">Lajambre Club</Text>
              <Text className="text-neutral-400 text-[10px] font-bold uppercase mt-1">Saldo Disponible</Text>
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-white text-3xl font-black">{userPoints}</Text>
              <Text className="text-yellow-500 font-bold ml-1 text-xs">pts</Text>
            </View>
          </View>

          <View className="space-y-3">
            {REWARD_OPTIONS.map((reward) => {
              const canAfford = userPoints >= reward.points;
              const isSelected = selectedReward === reward.id;

              return (
                <TouchableOpacity 
                  key={reward.id}
                  onPress={() => handleRewardSelection(reward.id, reward.points)}
                  activeOpacity={0.8}
                  className={`flex-row items-center justify-between p-3 rounded-xl border ${isSelected ? 'bg-yellow-500/20 border-yellow-500' : 'bg-black border-neutral-800'} ${!canAfford && 'opacity-40'}`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isSelected ? 'bg-yellow-500' : 'bg-neutral-800'}`}>
                      <FontAwesome name={reward.icon as any} size={12} color={isSelected ? 'black' : '#9CA3AF'} />
                    </View>
                    <View>
                      <Text className={`font-black uppercase text-xs ${isSelected ? 'text-yellow-500' : 'text-neutral-200'}`}>{reward.name}</Text>
                      {isSelected && <Text className="text-yellow-500 text-[9px] font-bold uppercase mt-0.5">Premio Aplicado</Text>}
                    </View>
                  </View>
                  
                  <View className="bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                    <Text className={`font-black text-[10px] ${canAfford ? 'text-white' : 'text-neutral-600'}`}>{reward.points} pts</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Resumen Final */}
        <View className="bg-neutral-900 p-5 rounded-3xl border border-neutral-800 mb-28">
          <View className="flex-row justify-between mb-2"><Text className="text-neutral-400 font-bold">Subtotal</Text><Text className="text-white font-bold">${totalAmount.toLocaleString('es-CL')}</Text></View>
          <View className="flex-row justify-between mb-2"><Text className="text-neutral-400 font-bold">Delivery</Text><Text className="text-white font-bold">${deliveryCost.toLocaleString('es-CL')}</Text></View>
          
          {rewardDiscount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-yellow-500 font-bold">Descuento Premio</Text>
              <Text className="text-yellow-500 font-bold">-${rewardDiscount.toLocaleString('es-CL')}</Text>
            </View>
          )}

          <View className="h-[1px] bg-neutral-800 my-3" />
          <View className="flex-row justify-between items-end">
            <Text className="text-white font-black text-lg uppercase">Total a Pagar</Text>
            <Text className="text-yellow-500 font-black text-2xl">${finalTotal.toLocaleString('es-CL')}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 w-full bg-neutral-900 p-6 border-t border-neutral-800">
        <TouchableOpacity onPress={handleOpenCheckout} className="bg-yellow-500 rounded-2xl py-4 flex-row justify-center items-center shadow-lg shadow-yellow-500/20 active:bg-yellow-600">
          <Text className="text-black text-lg font-black uppercase mr-2 tracking-widest">Ir a Pagar</Text>
          <FontAwesome name="arrow-right" size={16} color="black" />
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-neutral-900 rounded-t-3xl p-6 border-t border-yellow-500/30">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-black uppercase">Confirmar Datos</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><FontAwesome name="close" size={24} color="#525252" /></TouchableOpacity>
            </View>

            {isDelivery && (
              <View className="mb-4">
                <Text className="text-neutral-500 font-bold mb-2 uppercase text-[10px] tracking-widest">Dirección de Entrega</Text>
                <TextInput 
                  value={orderAddress} onChangeText={setOrderAddress}
                  placeholder="Ej: Calle Los Alerces 123, Laja" placeholderTextColor="#404040"
                  className="bg-black border border-neutral-800 text-white p-4 rounded-xl font-bold"
                />
              </View>
            )}

            <View className="mb-8">
              <Text className="text-neutral-500 font-bold mb-2 uppercase text-[10px] tracking-widest">Teléfono de Contacto</Text>
              <TextInput 
                value={orderPhone} onChangeText={setOrderPhone} keyboardType="phone-pad"
                placeholder="+56 9 ..." placeholderTextColor="#404040"
                className="bg-black border border-neutral-800 text-white p-4 rounded-xl font-bold"
              />
            </View>

            <TouchableOpacity 
              onPress={confirmOrder} disabled={isProcessing}
              className="bg-yellow-500 py-5 rounded-2xl items-center shadow-lg shadow-yellow-500/20 active:bg-yellow-600"
            >
              {isProcessing ? <ActivityIndicator color="black" /> : (
                <Text className="text-black font-black uppercase text-lg tracking-widest">Pagar • ${finalTotal.toLocaleString('es-CL')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}