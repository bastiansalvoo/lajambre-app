import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Linking, Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/api/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TABLEROS = ['PAGADO', 'PREPARANDO', 'EN_CAMINO', 'ENTREGADO'];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: string; border: string; label: string }> = {
  PAGADO: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: 'credit-card', border: 'border-yellow-500/30', label: 'Pagado' },
  PREPARANDO: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'fire', border: 'border-orange-500/30', label: 'Preparando' },
  EN_CAMINO: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'motorcycle', border: 'border-blue-500/30', label: 'En Camino' },
  ENTREGADO: { bg: 'bg-green-500/10', text: 'text-green-400', icon: 'check-circle', border: 'border-green-500/30', label: 'Entregado' },
};

export default function LiveOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroActual, setFiltroActual] = useState('PAGADO');

  const fetchAdminOrders = async () => {
    try {
      const response = await api.get('/orders/admin/all?limit=200');
      const ordersData = response.data?.data || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchAdminOrders();
      const interval = setInterval(fetchAdminOrders, 30000);
      return () => clearInterval(interval);
    }, []),
  );

  const cambiarEstado = async (orderId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nuevoEstado });
      fetchAdminOrders();
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo actualizar el pedido' });
    }
  };

  const pedidosFiltrados = orders.filter((o) => o.status === filtroActual);
  const config = STATUS_STYLES[filtroActual] || STATUS_STYLES.PAGADO;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#090909' }} edges={['top', 'left', 'right']}>
      {/* Fondo sutil */}
      <Image source={require('../../assets/images/menu/banner.jpg')} className="absolute inset-0 w-full h-full" resizeMode="cover" style={{ opacity: 0.06 }} />
      {/* Título */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-xl font-black uppercase">Monitor de Cocina</Text>
          <View className="flex-row items-center mt-0.5">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
            <Text className="text-neutral-500 text-[10px] font-bold uppercase">En vivo · Auto-refresh</Text>
          </View>
        </View>
        <View className="bg-neutral-950 border border-neutral-800 rounded-2xl px-3 py-1.5">
          <Text className="text-yellow-500 font-black text-xs">
            {orders.filter((o) => o.status === 'PAGADO' || o.status === 'PREPARANDO').length} activos
          </Text>
        </View>
      </View>

      {/* ── PÍLDORAS DE ESTADO ── */}
      <View className="px-5 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TABLEROS.map((tab) => {
            const count = orders.filter((o) => o.status === tab).length;
            const active = filtroActual === tab;
            const style = STATUS_STYLES[tab];
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setFiltroActual(tab)}
                className={`flex-row items-center px-5 py-3 rounded-2xl border ${
                  active ? `${style.bg} ${style.border}` : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <FontAwesome name={style.icon} size={14} color={active ? style.text.replace('text-', '#').split('-')[0] : '#737373'} />
                <Text className={`font-black uppercase text-xs ml-2 ${active ? style.text : 'text-neutral-400'}`}>
                  {style.label}
                </Text>
                <View className={`ml-2 px-2 py-0.5 rounded-full ${active ? 'bg-black/20' : 'bg-neutral-800'}`}>
                  <Text className={`font-black text-[10px] ${active ? style.text : 'text-neutral-500'}`}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── LISTA DE PEDIDOS ── */}
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EAB308" />
        </View>
      ) : pedidosFiltrados.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="w-20 h-20 bg-neutral-950 border border-neutral-800 rounded-3xl items-center justify-center mb-4">
            <FontAwesome name="inbox" size={32} color="#262626" />
          </View>
          <Text className="text-neutral-500 font-black uppercase text-sm text-center">
            Sin pedidos en "{config.label}"
          </Text>
          <Text className="text-neutral-700 text-xs mt-1 text-center">Los nuevos pedidos aparecerán aquí</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAdminOrders(); }} tintColor="#EAB308" colors={['#EAB308']} progressBackgroundColor="#171717" />
          }
        >
          {pedidosFiltrados.map((order) => (
            <View
              key={order.id}
              className="bg-neutral-950 border border-neutral-800/50 rounded-3xl mb-4 overflow-hidden"
            >
              {/* Cabecera del ticket */}
              <View className="flex-row justify-between items-center px-5 py-4 border-b border-neutral-800/30">
                <View className="flex-row items-center">
                  <View className="bg-yellow-500 w-10 h-10 rounded-2xl items-center justify-center mr-3">
                    <Text className="text-black font-black text-sm">#{order.id}</Text>
                  </View>
                  <View>
                    <Text className="text-white font-black uppercase text-sm">
                      {order.user?.name || 'Cliente'}
                    </Text>
                    <Text className="text-neutral-500 text-[10px] font-bold">
                      {new Date(order.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                <View className={`px-3 py-1.5 rounded-full ${config.bg} border ${config.border}`}>
                  <Text className={`text-[10px] font-black uppercase ${config.text}`}>{config.label}</Text>
                </View>
              </View>

              {/* Datos de contacto */}
              <View className="px-5 py-3 border-b border-neutral-800/20">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-3">
                    <FontAwesome name="map-marker" size={12} color="#EAB308" />
                    <Text className="text-neutral-300 text-xs font-bold ml-2 flex-1" numberOfLines={1}>
                      {order.deliveryAddress || 'Retiro en Local'}
                    </Text>
                  </View>
                  {order.contactPhone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${order.contactPhone}`)}
                      className="bg-green-500/10 border border-green-500/20 w-9 h-9 rounded-xl items-center justify-center"
                    >
                      <FontAwesome name="phone" size={14} color="#22C55E" />
                    </TouchableOpacity>
                  )}
                </View>
                <View className="flex-row items-center mt-2">
                  <FontAwesome name={order.deliveryFee > 0 ? 'motorcycle' : 'shopping-bag'} size={11} color="#737373" />
                  <Text className="text-neutral-500 text-[10px] font-bold ml-2 uppercase">
                    {order.deliveryFee > 0 ? 'Delivery' : 'Retiro en local'}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <View className="px-5 py-3 border-b border-neutral-800/20">
                {order.items?.map((item: any, i: number) => (
                  <View key={i} className="flex-row items-center py-1.5">
                    <View className="bg-neutral-900 w-7 h-7 rounded-lg items-center justify-center mr-3">
                      <Text className="text-yellow-500 font-black text-xs">{item.quantity}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-sm" numberOfLines={1}>{item.product?.name}</Text>
                      {item.extras?.length > 0 && (
                        <Text className="text-neutral-500 text-[9px] font-bold uppercase mt-0.5">
                          + {item.extras.map((e: any) => e.extra.name).join(', ')}
                        </Text>
                      )}
                    </View>
                    <Text className="text-neutral-400 font-bold text-sm ml-2">
                      ${((item.priceAtPurchase || 0) * item.quantity).toLocaleString('es-CL')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Footer + Acción */}
              <View className="px-5 py-3 flex-row justify-between items-center">
                <View>
                  <Text className="text-neutral-600 text-[9px] font-bold uppercase">Total</Text>
                  <Text className="text-white font-black text-lg">${order.total.toLocaleString('es-CL')}</Text>
                </View>

                {filtroActual === 'PAGADO' && (
                  <TouchableOpacity onPress={() => cambiarEstado(order.id, 'PREPARANDO')} className="bg-yellow-500 px-6 py-3 rounded-2xl flex-row items-center">
                    <FontAwesome name="fire" size={14} color="black" />
                    <Text className="text-black font-black uppercase text-xs ml-2">Cocinar</Text>
                  </TouchableOpacity>
                )}
                {filtroActual === 'PREPARANDO' && (
                  <TouchableOpacity onPress={() => cambiarEstado(order.id, 'EN_CAMINO')} className="bg-blue-500 px-6 py-3 rounded-2xl flex-row items-center">
                    <FontAwesome name="motorcycle" size={14} color="white" />
                    <Text className="text-white font-black uppercase text-xs ml-2">Despachar</Text>
                  </TouchableOpacity>
                )}
                {filtroActual === 'EN_CAMINO' && (
                  <TouchableOpacity onPress={() => cambiarEstado(order.id, 'ENTREGADO')} className="bg-green-500 px-6 py-3 rounded-2xl flex-row items-center">
                    <FontAwesome name="check" size={14} color="white" />
                    <Text className="text-white font-black uppercase text-xs ml-2">Entregado</Text>
                  </TouchableOpacity>
                )}
                {filtroActual === 'ENTREGADO' && (
                  <View className="bg-green-500/10 border border-green-500/20 px-5 py-3 rounded-2xl">
                    <Text className="text-green-500 font-black uppercase text-xs">✓ Completado</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          <View className="h-6" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}