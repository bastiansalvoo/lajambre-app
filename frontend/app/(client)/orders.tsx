import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/api/api';
// 👇 Importamos el cerebro del carrito
import { useCartStore } from '../../src/store/cartStore';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 👇 Extraemos las funciones para limpiar y llenar el carrito
  const { clearCart, addItem } = useCartStore();

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      setIsLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userRole');
        delete api.defaults.headers.common['Authorization'];
        router.replace('/(auth)/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 Añadidos los estados de cocina para que se vean geniales en la app
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDIENTE': 
        return { bg: 'bg-yellow-500', text: 'text-black', icon: 'clock-o' };
      case 'PAGADO': 
        return { bg: 'bg-green-500', text: 'text-black', icon: 'check' };
      case 'PREPARANDO': 
        return { bg: 'bg-orange-500', text: 'text-black', icon: 'fire' };
      case 'EN_CAMINO': 
        return { bg: 'bg-blue-500', text: 'text-white', icon: 'motorcycle' };
      case 'ENTREGADO': 
        return { bg: 'bg-green-700', text: 'text-white', icon: 'home' };
      case 'CANCELADO': 
        return { bg: 'bg-red-500', text: 'text-white', icon: 'times' };
      default: 
        return { bg: 'bg-neutral-600', text: 'text-white', icon: 'circle-o' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // 👇 Función Mágica: Desarma la orden vieja y la mete al carrito nuevo
  const handleReorder = (order: any) => {
    clearCart(); // Vaciamos por si tenía algo a medio armar
    
    order.items.forEach((item: any) => {
      const product = {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price, 
        image: item.product.image
      };
      
      // Mapeamos los extras si es que la orden los tenía
      const extras = item.extras?.map((e: any) => e.extra) || [];

      // Como nuestro cerebro agrega de a 1, hacemos un loop por la cantidad
      for (let i = 0; i < item.quantity; i++) {
        addItem(product, extras);
      }
    });

    // Lo mandamos directo a la pantalla de pago
    router.push('/(client)/cart');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      
      <View className="px-5 py-6 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-2xl font-black uppercase tracking-widest">Mis Pedidos</Text>
          <Text className="text-neutral-500 text-xs font-bold mt-1">Tu historial de compras recientes</Text>
        </View>
        <View className="bg-yellow-500/20 p-3 rounded-2xl">
          <FontAwesome name="history" size={24} color="#EAB308" />
        </View>
      </View>

      {orders.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <FontAwesome name="shopping-basket" size={70} color="#262626" />
          <Text className="text-neutral-500 text-base font-bold mt-6 tracking-widest uppercase text-center">Aún no tienes pedidos</Text>
          <TouchableOpacity onPress={() => router.push('/(client)')} className="mt-8 bg-yellow-500 px-8 py-4 rounded-2xl">
            <Text className="text-black font-black uppercase text-lg">Descubrir Menú</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {orders.map((order) => {
            const statusConfig = getStatusStyle(order.status);
            
            // 👇 Variable inteligente para decidir el estilo y texto del botón
            const isFailedOrPending = order.status === 'CANCELADO' || order.status === 'PENDIENTE';
            
            return (
              <View key={order.id} className="bg-neutral-900 rounded-3xl mb-6 p-5 border border-neutral-800">
                
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-black rounded-full items-center justify-center mr-3 border border-neutral-800">
                      <FontAwesome name="shopping-bag" size={16} color="#EAB308" />
                    </View>
                    <View>
                      <Text className="text-white font-black text-lg uppercase tracking-wider">Orden #{order.id}</Text>
                      <Text className="text-neutral-400 text-xs font-bold">{formatDate(order.createdAt)}</Text>
                    </View>
                  </View>
                  
                  <View className={`${statusConfig.bg} px-3 py-1.5 rounded-full flex-row items-center shadow-sm`}>
                    <FontAwesome name={statusConfig.icon as any} size={10} color={statusConfig.text.includes('black') ? 'black' : 'white'} />
                    <Text className={`${statusConfig.text} text-[10px] font-black uppercase ml-1.5 tracking-widest`}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <View className="h-[1px] w-full bg-neutral-800 my-1" />

                <View className="py-3">
                  {order.items?.map((item: any, index: number) => (
                    <View key={index} className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center flex-1 pr-4">
                        <View className="bg-neutral-800 px-2 py-1 rounded flex-row items-center mr-3">
                          <Text className="text-yellow-500 font-black text-xs">{item.quantity}</Text>
                          <Text className="text-neutral-500 font-bold text-[10px] ml-0.5">x</Text>
                        </View>
                        <View>
                          <Text className="text-neutral-200 font-bold text-sm tracking-wide" numberOfLines={1}>
                            {item.product?.name || 'Producto eliminado'}
                          </Text>
                          {/* 👇 Mostramos visualmente los extras si los tenía */}
                          {item.extras && item.extras.length > 0 && (
                            <Text className="text-neutral-500 text-[10px] uppercase font-bold mt-0.5">
                              + {item.extras.map((e: any) => e.extra.name).join(', ')}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Text className="text-neutral-400 font-bold text-sm">
                        ${(item.priceAtPurchase * item.quantity).toLocaleString('es-CL')}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="h-[1px] w-full bg-neutral-800 mt-1 mb-4" />

                <View className="flex-row justify-between items-end">
                  <View>
                    <View className="bg-black border border-neutral-800 px-3 py-2 rounded-xl flex-row items-center">
                      <FontAwesome name={order.deliveryFee > 0 ? "motorcycle" : "building"} size={12} color="#9CA3AF" />
                      <Text className="text-neutral-300 text-xs font-bold uppercase tracking-wider ml-2">
                        {order.deliveryFee > 0 ? 'Delivery' : 'Retiro Local'}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total</Text>
                    <Text className="text-yellow-500 font-black text-2xl">${order.total.toLocaleString('es-CL')}</Text>
                  </View>
                </View>

                {/* 👇 EL BOTÓN SALVAVIDAS SIEMPRE PRESENTE Y ADAPTABLE */}
                <TouchableOpacity 
                  onPress={() => handleReorder(order)}
                  className={`mt-6 py-3.5 rounded-xl flex-row justify-center items-center border ${isFailedOrPending ? 'bg-red-500/10 border-red-500/30 active:bg-red-500/20' : 'bg-neutral-800 border-neutral-700 active:bg-neutral-700'}`}
                >
                  <FontAwesome name="refresh" size={14} color={isFailedOrPending ? "#EF4444" : "#EAB308"} />
                  <Text className={`font-black uppercase text-xs ml-2 tracking-widest ${isFailedOrPending ? 'text-red-500' : 'text-yellow-500'}`}>
                    {isFailedOrPending ? 'Reintentar Pago' : 'Volver a Pedir'}
                  </Text>
                </TouchableOpacity>

              </View>
            );
          })}
          <View className="h-6" />
        </ScrollView>
      )}
    </View>
  );
}