import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/api/api';

const TABLEROS = ['PAGADO', 'PREPARANDO', 'EN_CAMINO', 'ENTREGADO'];

export default function LiveOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroActual, setFiltroActual] = useState('PAGADO');

  const fetchAdminOrders = async () => {
    try {
      const response = await api.get('/orders/admin/all');
      setOrders(response.data);
    } catch (error) {
      console.error("Error cargando pedidos del admin:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchAdminOrders();
      
      const interval = setInterval(() => {
        fetchAdminOrders();
      }, 30000);
      
      return () => clearInterval(interval);
    }, [])
  );

  const cambiarEstado = async (orderId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nuevoEstado });
      fetchAdminOrders(); 
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar el estado del pedido'
      });
    }
  };

  const pedidosFiltrados = orders.filter(o => o.status === filtroActual);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'left', 'right']}>
      
      {/* 👑 CABECERA */}
      <View className="px-5 py-4 flex-row items-center border-b border-neutral-900 bg-neutral-950">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(admin)/dashboard')} className="mr-4 p-2 -ml-2">
          <FontAwesome name="arrow-left" size={20} color="#EAB308" />
        </TouchableOpacity>
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 bg-yellow-500 rounded-lg items-center justify-center mr-3">
            <FontAwesome name="fire" size={16} color="black" />
          </View>
          <View>
            <Text className="text-white text-lg font-black uppercase tracking-widest">Monitor de Cocina</Text>
            <View className="flex-row items-center mt-0.5">
              <View className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">En Vivo</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 🗂️ FILTROS TIPO KANBAN */}
      <View className="py-4 bg-neutral-950 border-b border-neutral-900">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {TABLEROS.map((tab) => {
            const count = orders.filter(o => o.status === tab).length;
            const isActive = filtroActual === tab;
            
            return (
              <TouchableOpacity 
                key={tab}
                onPress={() => setFiltroActual(tab)}
                className={`flex-row items-center px-4 py-2.5 rounded-full mr-3 border ${isActive ? 'bg-yellow-500 border-yellow-500' : 'bg-neutral-900 border-neutral-800'}`}
              >
                <Text className={`font-black uppercase text-xs mr-2 tracking-wider ${isActive ? 'text-black' : 'text-neutral-400'}`}>
                  {tab.replace('_', ' ')}
                </Text>
                <View className={`px-2 py-0.5 rounded-full ${isActive ? 'bg-black/20' : 'bg-neutral-800'}`}>
                  <Text className={`font-bold text-[10px] ${isActive ? 'text-black' : 'text-neutral-500'}`}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View className="w-8" />
        </ScrollView>
      </View>

      {/* 📋 LISTA DE TICKETS */}
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EAB308" />
        </View>
      ) : pedidosFiltrados.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <FontAwesome name="check-square-o" size={60} color="#262626" />
          <Text className="text-neutral-500 text-sm font-bold mt-4 tracking-widest uppercase text-center">
            No hay pedidos en "{filtroActual.replace('_', ' ')}"
          </Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-4 pt-4" 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchAdminOrders();}} tintColor="#EAB308" />}
        >
          {pedidosFiltrados.map((order) => (
            <View key={order.id} className="bg-neutral-900 rounded-2xl mb-4 p-5 border-l-4 border-l-yellow-500 border-y border-r border-y-neutral-800 border-r-neutral-800">
              
              <View className="flex-row justify-between items-start mb-4 border-b border-neutral-800 pb-4">
                <View>
                  <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ticket N°</Text>
                  <Text className="text-white font-black text-2xl uppercase">#{order.id}</Text>
                </View>
                <View className="items-end">
                  <View className="bg-black px-3 py-1.5 rounded-lg flex-row items-center border border-neutral-800 mb-2">
                    <FontAwesome name={order.deliveryFee > 0 ? "motorcycle" : "shopping-bag"} size={12} color="#9CA3AF" />
                    <Text className="text-neutral-300 text-[10px] font-bold uppercase ml-2 tracking-widest">
                      {order.deliveryFee > 0 ? 'Delivery' : 'Retiro'}
                    </Text>
                  </View>
                  <Text className="text-neutral-400 text-xs font-bold">
                    {new Date(order.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              {/* 👇 NUEVA SECCIÓN: DATOS DEL CLIENTE Y CONTACTO */}
              <View className="bg-black/50 rounded-xl p-3 mb-4 border border-neutral-800">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-1">
                      <FontAwesome name="map-marker" size={12} color="#EAB308" className="w-4 text-center" />
                      <Text className="text-neutral-300 text-xs font-bold ml-2" numberOfLines={1}>
                        {order.deliveryAddress || 'Retiro en Local'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <FontAwesome name="phone" size={12} color="#9CA3AF" className="w-4 text-center" />
                      <Text className="text-neutral-400 text-xs font-bold ml-2">
                        {order.contactPhone || 'Sin teléfono'}
                      </Text>
                    </View>
                  </View>
                  
                  {order.contactPhone && order.contactPhone !== 'Sin teléfono' && (
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(`tel:${order.contactPhone}`)}
                      className="bg-neutral-800 w-10 h-10 rounded-full items-center justify-center border border-neutral-700"
                    >
                      <FontAwesome name="phone" size={16} color="#EAB308" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View className="mb-6">
                {order.items?.map((item: any, index: number) => (
                  <View key={index} className="flex-row items-center py-2">
                    <View className="bg-neutral-800 px-2 py-1 rounded flex-row items-center mr-3">
                      <Text className="text-yellow-500 font-black text-sm">{item.quantity}</Text>
                      <Text className="text-neutral-500 font-bold text-[10px] ml-0.5">x</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-neutral-200 font-bold text-base flex-1" numberOfLines={2}>
                        {item.product?.name}
                      </Text>
                      {/* 👇 Mostramos los extras si los hay */}
                      {item.extras && item.extras.length > 0 && (
                        <Text className="text-neutral-500 text-[10px] uppercase font-bold mt-0.5">
                          + {item.extras.map((e: any) => e.extra.name).join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Botones de Acción según el estado actual */}
              {filtroActual === 'PAGADO' && (
                <TouchableOpacity onPress={() => cambiarEstado(order.id, 'PREPARANDO')} className="bg-yellow-500 py-4 rounded-xl flex-row justify-center items-center active:bg-yellow-600">
                  <FontAwesome name="fire" size={16} color="black" />
                  <Text className="text-black font-black uppercase tracking-widest ml-2">Cocinar Pedido</Text>
                </TouchableOpacity>
              )}
              
              {filtroActual === 'PREPARANDO' && (
                <TouchableOpacity onPress={() => cambiarEstado(order.id, 'EN_CAMINO')} className="bg-blue-500 py-4 rounded-xl flex-row justify-center items-center active:bg-blue-600">
                  <FontAwesome name="motorcycle" size={16} color="white" />
                  <Text className="text-white font-black uppercase tracking-widest ml-2">Marcar en Camino</Text>
                </TouchableOpacity>
              )}

              {filtroActual === 'EN_CAMINO' && (
                <TouchableOpacity onPress={() => cambiarEstado(order.id, 'ENTREGADO')} className="bg-green-500 py-4 rounded-xl flex-row justify-center items-center active:bg-green-600">
                  <FontAwesome name="check" size={16} color="white" />
                  <Text className="text-white font-black uppercase tracking-widest ml-2">Marcar Entregado</Text>
                </TouchableOpacity>
              )}
              
              {filtroActual === 'ENTREGADO' && (
                <View className="bg-neutral-950 py-3 rounded-xl flex-row justify-center items-center border border-neutral-800">
                  <Text className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Pedido Finalizado</Text>
                </View>
              )}

            </View>
          ))}
          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}