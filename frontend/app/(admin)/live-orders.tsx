import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Linking, Animated, Easing
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/api/api';

const TABLEROS = ['PAGADO', 'PREPARANDO', 'EN_CAMINO', 'ENTREGADO'];

// Modificado a colores RGBA transparentes para matching con Dashboard
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: string; border: string; label: string }> = {
  PAGADO: { bg: 'rgba(234, 179, 8, 0.1)', text: '#EAB308', icon: 'credit-card', border: 'rgba(234, 179, 8, 0.3)', label: 'Pagado' },
  PREPARANDO: { bg: 'rgba(249, 115, 22, 0.1)', text: '#F97316', icon: 'fire', border: 'rgba(249, 115, 22, 0.3)', label: 'Preparando' },
  EN_CAMINO: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', icon: 'motorcycle', border: 'rgba(59, 130, 246, 0.3)', label: 'En Camino' },
  ENTREGADO: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E', icon: 'check-circle', border: 'rgba(34, 197, 94, 0.3)', label: 'Entregado' },
};

export default function LiveOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroActual, setFiltroActual] = useState('PAGADO');

  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#060606' }} edges={['left', 'right', 'bottom']}>
      {/* Efectos Ambientales (Sin Blur) */}
      <View className="absolute top-[-50] right-[-50] w-64 h-64 rounded-full" style={{ backgroundColor: '#EAB308', opacity: 0.04, transform: [{ scale: 1.5 }] }} />
      <View className="absolute top-[40%] left-[-80] w-72 h-72 rounded-full" style={{ backgroundColor: '#F97316', opacity: 0.03, transform: [{ scale: 1.5 }] }} />

      {/* Fondo sutil */}
      <Image source={require('../../assets/images/menu/banner.jpg')} className="absolute inset-0 w-full h-full" resizeMode="cover" style={{ opacity: 0.12 }} />

      {/* Título Imponente */}
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center mb-1">
            <Animated.View style={{ opacity: pulseValue, transform: [{ scale: pulseValue }] }} className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 shadow-sm shadow-green-500" />
            <Text className="text-green-500/80 text-[10px] font-black uppercase tracking-widest">En Vivo · Auto-refresh</Text>
          </View>
          <Text className="text-white text-[28px] font-black tracking-tight">Monitor Cocina</Text>
        </View>
        <View className="items-center justify-center bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-2">
          <Text className="text-yellow-500 font-black text-lg">{orders.filter((o) => o.status === 'PAGADO' || o.status === 'PREPARANDO').length}</Text>
          <Text className="text-yellow-500/60 font-black text-[9px] uppercase tracking-widest mt-0.5">Activos</Text>
        </View>
      </View>

      {/* ── PÍLDORAS DE ESTADO TIPO GLASS ── */}
      <View className="px-6 pb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {TABLEROS.map((tab) => {
            const count = orders.filter((o) => o.status === tab).length;
            const active = filtroActual === tab;
            const style = STATUS_STYLES[tab];
            
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setFiltroActual(tab)}
                className="flex-row items-center px-4 py-3 rounded-2xl border"
                style={{ 
                  backgroundColor: active ? style.bg : 'rgba(255,255,255,0.03)', 
                  borderColor: active ? style.border : 'rgba(255,255,255,0.05)'
                }}
              >
                <FontAwesome name={style.icon as any} size={14} color={active ? style.text : '#737373'} />
                <Text className="font-black uppercase text-xs ml-2 tracking-wider" style={{ color: active ? style.text : '#737373' }}>
                  {style.label}
                </Text>
                <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: active ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)' }}>
                  <Text className="font-black text-[10px]" style={{ color: active ? style.text : '#737373' }}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── LISTA DE PEDIDOS PREMIUM ── */}
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EAB308" />
        </View>
      ) : pedidosFiltrados.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-5 border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <FontAwesome name="check" size={32} color="rgba(255,255,255,0.2)" />
          </View>
          <Text className="text-neutral-400 font-black uppercase text-sm text-center tracking-widest mb-1">
            Sin pedidos en
          </Text>
          <Text className="font-black text-xl text-center mb-2" style={{ color: config.text }}>{config.label}</Text>
          <Text className="text-neutral-600 text-[11px] mt-1 text-center font-bold">Todo está bajo control por aquí.</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAdminOrders(); }} tintColor="#EAB308" colors={['#EAB308']} progressBackgroundColor="#111" />
          }
        >
          {pedidosFiltrados.map((order) => (
            <View
              key={order.id}
              className="rounded-[28px] mb-5 overflow-hidden border border-white/10"
              style={{ backgroundColor: '#111' }}
            >
              {/* Cabecera del ticket */}
              <View className="flex-row justify-between items-center px-5 py-4 border-b border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-[18px] items-center justify-center mr-3 shadow-sm" style={{ backgroundColor: config.text }}>
                    <Text className="text-black font-black text-lg">#{order.id}</Text>
                  </View>
                  <View>
                    <Text className="text-white font-black uppercase text-[15px] tracking-tight">
                      {order.user?.name || 'Cliente'}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <FontAwesome name="clock-o" size={10} color="#737373" />
                      <Text className="text-neutral-500 text-[10px] font-black uppercase tracking-widest ml-1">
                        {new Date(order.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Datos de contacto */}
              <View className="px-5 py-3 border-b border-white/5">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-6 h-6 rounded-full items-center justify-center bg-white/5 mr-2">
                      <FontAwesome name="map-marker" size={10} color="#EAB308" />
                    </View>
                    <Text className="text-neutral-300 text-[11px] font-bold flex-1" numberOfLines={1}>
                      {order.deliveryAddress || 'Retiro en Local'}
                    </Text>
                  </View>
                  {order.contactPhone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${order.contactPhone}`)}
                      className="w-8 h-8 rounded-full items-center justify-center bg-green-500/10 border border-green-500/20"
                    >
                      <FontAwesome name="phone" size={12} color="#22C55E" />
                    </TouchableOpacity>
                  )}
                </View>
                <View className="flex-row items-center">
                  <View className="w-6 h-6 rounded-full items-center justify-center bg-white/5 mr-2">
                    <FontAwesome name={order.deliveryFee > 0 ? 'motorcycle' : 'shopping-bag'} size={10} color="#737373" />
                  </View>
                  <Text className="text-neutral-500 text-[10px] font-black tracking-widest uppercase">
                    {order.deliveryFee > 0 ? 'Delivery' : 'Retiro en local'}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <View className="px-5 py-4 border-b border-white/5">
                {order.items?.map((item: any, i: number) => (
                  <View key={i} className="flex-row items-center py-2">
                    <View className="w-8 h-8 rounded-xl items-center justify-center mr-3 border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <Text className="font-black text-[13px]" style={{ color: config.text }}>{item.quantity}x</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-[14px]">{item.product?.name}</Text>
                      {item.extras?.length > 0 && (
                        <Text className="text-neutral-500 text-[10px] font-bold uppercase mt-1">
                          + {item.extras.map((e: any) => e.extra.name).join(', ')}
                        </Text>
                      )}
                    </View>
                    <Text className="text-neutral-400 font-bold text-[13px] ml-2">
                      ${((item.priceAtPurchase || 0) * item.quantity).toLocaleString('es-CL')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Footer + Acción */}
              <View className="px-5 py-4 flex-row justify-between items-center" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <View>
                  <Text className="text-neutral-600 text-[9px] font-black uppercase tracking-widest mb-0.5">Total</Text>
                  <Text className="text-white font-black text-xl">${order.total.toLocaleString('es-CL')}</Text>
                </View>

                {filtroActual === 'PAGADO' && (
                  <TouchableOpacity onPress={() => cambiarEstado(order.id, 'PREPARANDO')} className="px-6 py-3 rounded-2xl flex-row items-center" style={{ backgroundColor: '#EAB308' }}>
                    <FontAwesome name="fire" size={14} color="#000" />
                    <Text className="text-black font-black uppercase text-xs tracking-wider ml-2">Cocinar</Text>
                  </TouchableOpacity>
                )}
                {filtroActual === 'PREPARANDO' && (
                  <TouchableOpacity onPress={() => cambiarEstado(order.id, 'EN_CAMINO')} className="px-6 py-3 rounded-2xl flex-row items-center" style={{ backgroundColor: '#F97316' }}>
                    <FontAwesome name="motorcycle" size={14} color="#fff" />
                    <Text className="text-white font-black uppercase text-xs tracking-wider ml-2">Despachar</Text>
                  </TouchableOpacity>
                )}
                {filtroActual === 'EN_CAMINO' && (
                  <TouchableOpacity onPress={() => cambiarEstado(order.id, 'ENTREGADO')} className="px-6 py-3 rounded-2xl flex-row items-center" style={{ backgroundColor: '#3B82F6' }}>
                    <FontAwesome name="check" size={14} color="#fff" />
                    <Text className="text-white font-black uppercase text-xs tracking-wider ml-2">Entregado</Text>
                  </TouchableOpacity>
                )}
                {filtroActual === 'ENTREGADO' && (
                  <View className="px-5 py-2.5 rounded-full border border-green-500/20" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <Text className="text-green-500 font-black uppercase text-[10px] tracking-widest">✓ Completado</Text>
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