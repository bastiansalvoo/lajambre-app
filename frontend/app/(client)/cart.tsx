import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/api/api';
import { useCartStore } from '../../src/store/cartStore';
import * as WebBrowser from 'expo-web-browser';

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  
  // Estados de UI
  const [isDelivery, setIsDelivery] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para los datos de la orden (se pre-cargan del perfil)
  const [orderAddress, setOrderAddress] = useState('');
  const [orderPhone, setOrderPhone] = useState('');

  // 1. Cargar datos del perfil al abrir el carrito
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          // Asumiendo que tienes un endpoint /users/profile o similar
          const response = await api.get('/users/profile');
          setOrderAddress(response.data.address || '');
          setOrderPhone(response.data.phone || '');
        }
      } catch (error) {
        console.log("No se pudo cargar el perfil para pre-llenado");
      }
    };
    fetchUserProfile();
  }, []);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCost = isDelivery ? 1250 : 0;
  const finalTotal = totalAmount + deliveryCost;

  // 2. Validar sesión y abrir Modal
  const handleOpenCheckout = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      Alert.alert('Identifícate', 'Inicia sesión para continuar con tu pedido.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir al Login', onPress: () => router.push('/(auth)/login') }
      ]);
      return;
    }
    setShowModal(true);
  };

  // 3. Confirmar, crear orden y ABRIR WEBPAY
  const confirmOrder = async () => {
    if (isDelivery && !orderAddress) {
      Alert.alert('Error', 'Por favor ingresa una dirección de entrega.');
      return;
    }
    if (!orderPhone) {
      Alert.alert('Error', 'Necesitamos un teléfono de contacto.');
      return;
    }

    setIsProcessing(true);
    try {
      // A. Creamos la orden (Estado PENDIENTE)
      const orderPayload = {
        items: items.map(item => ({ productId: item.id, quantity: item.quantity })),
        deliveryAddress: isDelivery ? orderAddress : 'Retiro en Local',
        contactPhone: orderPhone,
      };
      const orderResponse = await api.post('/orders', orderPayload);
      const newOrderId = orderResponse.data.id;

      setShowModal(false);
      clearCart(); // El carrito ya cumplió su función, lo vaciamos

      // B. Solicitamos a NestJS que hable con Transbank
      // Tu backend ya sabe devolver la URL y el Token de Webpay
      const payResponse = await api.post(`/orders/${newOrderId}/pay`);
      
      // Si el pago es 100% con puntos (total 0), el backend devuelve token 'GRATIS'
      if (payResponse.data.token === 'GRATIS') {
        Alert.alert('¡Pedido Gratis!', 'Tu pedido fue pagado completamente con tus puntos.', [
          { text: 'Ver mis pedidos', onPress: () => router.replace('/(client)/orders') }
        ]);
        return;
      }

      // C. Armamos la URL exacta y abrimos el navegador interno
      const webpayUrl = `${payResponse.data.url}?token_ws=${payResponse.data.token}`;
      
      // Abre la pasarela de pago
      await WebBrowser.openBrowserAsync(webpayUrl);

      // Una vez que el usuario cierre el navegador, lo mandamos a ver sus pedidos
      router.replace('/(client)/orders');

    } catch (error: any) {
      console.error("Error en el flujo de pago:", error);
      const msg = error.response?.data?.message || "Error al procesar pedido o conectar con Webpay";
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : msg);
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

        {/* Selector de Entrega */}
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

        {/* Lista de Productos */}
        {items.map((item) => (
          <View key={item.id} className="flex-row bg-neutral-900 p-3 rounded-2xl mb-4 border border-neutral-800">
            <Image source={item.image ? { uri: item.image } : require('../../assets/images/menu/bbq.jpg')} className="w-16 h-16 rounded-xl bg-black" />
            <View className="flex-1 ml-4 justify-between">
              <Text className="text-white font-black uppercase text-xs">{item.name}</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-yellow-500 font-bold">${item.price.toLocaleString('es-CL')}</Text>
                <View className="flex-row items-center bg-black rounded-lg p-1">
                  <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}><FontAwesome name="minus" size={10} color="white" className="px-2" /></TouchableOpacity>
                  <Text className="text-white font-bold mx-2">{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}><FontAwesome name="plus" size={10} color="#EAB308" className="px-2" /></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Resumen */}
        <View className="mt-4 bg-neutral-900 p-4 rounded-2xl border border-neutral-800 mb-20">
          <View className="flex-row justify-between mb-2"><Text className="text-neutral-400">Subtotal</Text><Text className="text-white">${totalAmount.toLocaleString('es-CL')}</Text></View>
          <View className="flex-row justify-between mb-2"><Text className="text-neutral-400">Envío</Text><Text className="text-white">${deliveryCost.toLocaleString('es-CL')}</Text></View>
          <View className="h-[1px] bg-neutral-800 my-2" />
          <View className="flex-row justify-between"><Text className="text-white font-bold">Total</Text><Text className="text-yellow-500 font-bold">${finalTotal.toLocaleString('es-CL')}</Text></View>
        </View>
      </ScrollView>

      {/* Botón Principal */}
      <View className="absolute bottom-0 w-full bg-neutral-900 p-6 border-t border-neutral-800">
        <TouchableOpacity onPress={handleOpenCheckout} className="bg-yellow-500 rounded-xl py-4 flex-row justify-center items-center">
          <Text className="text-black text-lg font-black uppercase mr-2">Ir a Pagar</Text>
          <FontAwesome name="arrow-right" size={18} color="black" />
        </TouchableOpacity>
      </View>

      {/* --- MODAL DE CONFIRMACIÓN (OPCIÓN B) --- */}
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
              className="bg-yellow-500 py-5 rounded-2xl items-center shadow-lg shadow-yellow-500/20"
            >
              {isProcessing ? <ActivityIndicator color="black" /> : (
                <Text className="text-black font-black uppercase text-lg">Confirmar Pedido • ${finalTotal.toLocaleString('es-CL')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}