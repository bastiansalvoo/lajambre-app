import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/api/api';

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ ordersToday: 0, pending: 0, products: 0, revenue: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/orders/admin/all?limit=200');
      const orders = res.data?.data || res.data || [];
      const today = new Date().toDateString();
      const todayOrders = Array.isArray(orders) ? orders.filter((o: any) => new Date(o.createdAt).toDateString() === today) : [];
      const pending = Array.isArray(orders) ? orders.filter((o: any) => o.status === 'PAGADO' || o.status === 'PREPARANDO') : [];
      const revenue = Array.isArray(orders) ? orders.reduce((s: number, o: any) => s + o.total, 0) : 0;
      const prodRes = await api.get('/products');
      const products = Array.isArray(prodRes.data) ? prodRes.data : [];
      setStats({ ordersToday: todayOrders.length, pending: pending.length, products: products.length, revenue });
    } catch { }
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));
  const onRefresh = async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); };
  const fm = (n: number) => '$' + n.toLocaleString('es-CL');

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#090909' }} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#090909" />
      <Image source={require('../../assets/images/menu/banner.jpg')} className="absolute inset-0 w-full h-full" resizeMode="cover" style={{ opacity: 0.04 }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EAB308" colors={['#EAB308']} progressBackgroundColor="#171717" />}>

        {/* Header Mejorado */}
        <View className="px-6 pt-6 pb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-neutral-400 text-xs font-semibold tracking-wider uppercase mb-1">Panel de Administración</Text>
            <View className="flex-row items-center">
              <Text className="text-white text-3xl font-black tracking-tight">Hola, </Text>
              <Text className="text-3xl font-black tracking-tight" style={{ color: '#EAB308' }}>Angelo</Text>
            </View>
          </View>
          <TouchableOpacity className="w-12 h-12 rounded-full items-center justify-center border border-neutral-800" style={{ backgroundColor: '#111' }}>
            <FontAwesome name="user" size={20} color="#EAB308" />
          </TouchableOpacity>
        </View>

        {/* KPI destacado: Ingresos Premium Card */}
        <View className="px-6 mb-6">
          <View className="rounded-[32px] p-6 overflow-hidden relative shadow-lg" style={{ backgroundColor: '#EAB308', shadowColor: '#EAB308', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
            {/* Watermark Icon */}
            <FontAwesome name="line-chart" size={140} color="rgba(0,0,0,0.06)" style={{ position: 'absolute', right: -20, bottom: -30 }} />
            
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-black/70 text-xs font-bold uppercase tracking-widest">Ingresos Totales</Text>
              <View className="bg-black/10 px-3 py-1.5 rounded-full">
                <Text className="text-black/80 text-[10px] font-bold">HOY</Text>
              </View>
            </View>
            <Text className="text-black text-[42px] font-black tracking-tighter mb-4">{fm(stats.revenue)}</Text>
            
            <View className="flex-row items-center gap-x-6">
              <View>
                <View className="flex-row items-center mb-1">
                  <View className="w-2 h-2 bg-black/40 rounded-full mr-2" />
                  <Text className="text-black/60 text-[11px] font-bold uppercase">Pedidos</Text>
                </View>
                <Text className="text-black text-lg font-black ml-4">{stats.ordersToday}</Text>
              </View>
              <View className="h-8 w-[1px] bg-black/10" />
              <View>
                <View className="flex-row items-center mb-1">
                  <View className="w-2 h-2 bg-white/60 rounded-full mr-2" />
                  <Text className="text-black/60 text-[11px] font-bold uppercase">En Cocina</Text>
                </View>
                <Text className="text-black text-lg font-black ml-4">{stats.pending}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mini cards */}
        <View className="px-6 flex-row gap-x-4 mb-8">
          <View className="flex-1 rounded-3xl p-5 overflow-hidden relative border border-neutral-800" style={{ backgroundColor: '#111' }}>
            <FontAwesome name="shopping-bag" size={60} color="rgba(255,255,255,0.02)" style={{ position: 'absolute', right: -10, bottom: -10 }} />
            <View className="w-8 h-8 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
              <FontAwesome name="calendar-check-o" size={14} color="#EAB308" />
            </View>
            <Text className="text-white text-3xl font-black">{stats.ordersToday}</Text>
            <Text className="text-neutral-500 text-[11px] font-semibold mt-1">Pedidos Hoy</Text>
          </View>
          
          <View className="flex-1 rounded-3xl p-5 overflow-hidden relative border border-neutral-800" style={{ backgroundColor: '#111' }}>
            <FontAwesome name="fire" size={60} color="rgba(255,255,255,0.02)" style={{ position: 'absolute', right: -10, bottom: -10 }} />
            <View className="w-8 h-8 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
              <FontAwesome name="hourglass-half" size={14} color="#F97316" />
            </View>
            <Text className="text-white text-3xl font-black">{stats.pending}</Text>
            <Text className="text-neutral-500 text-[11px] font-semibold mt-1">En Cocina</Text>
          </View>
          
          <View className="flex-1 rounded-3xl p-5 overflow-hidden relative border border-neutral-800" style={{ backgroundColor: '#111' }}>
            <FontAwesome name="cutlery" size={60} color="rgba(255,255,255,0.02)" style={{ position: 'absolute', right: -10, bottom: -10 }} />
            <View className="w-8 h-8 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <FontAwesome name="list-ul" size={14} color="#22C55E" />
            </View>
            <Text className="text-white text-3xl font-black">{stats.products}</Text>
            <Text className="text-neutral-500 text-[11px] font-semibold mt-1">Productos</Text>
          </View>
        </View>

        {/* Accesos */}
        <View className="px-6 mb-4">
          <Text className="text-white font-black uppercase text-xs tracking-widest">Navegación Rápida</Text>
        </View>

        {/* Action Banner: Pedidos en vivo */}
        <View className="px-6 mb-4">
          <TouchableOpacity onPress={() => router.push('/(admin)/live-orders')} activeOpacity={0.8}
            className="rounded-[28px] p-1 border border-yellow-500/30" style={{ backgroundColor: '#111' }}>
            <View className="rounded-3xl p-5 flex-row items-center overflow-hidden relative" style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
              {/* Badge si hay pedidos */}
              {stats.pending > 0 && (
                <View className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-[#111]" />
              )}
              
              <View className="w-14 h-14 rounded-2xl items-center justify-center mr-5" style={{ backgroundColor: '#EAB308' }}>
                <FontAwesome name="bell" size={24} color="#000" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-black text-lg mb-1">Monitor en Vivo</Text>
                <Text className="text-neutral-400 font-medium text-xs">Gestión de cocina y despachos</Text>
              </View>
              <View className="w-8 h-8 rounded-full items-center justify-center bg-neutral-800">
                <FontAwesome name="chevron-right" size={12} color="#EAB308" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Grid Menú Inferior */}
        <View className="px-6 flex-row gap-x-4 mb-4">
          <TouchableOpacity onPress={() => router.push('/(admin)/menu-manager')} activeOpacity={0.8}
            className="flex-1 rounded-[24px] p-5 items-center justify-center border border-neutral-800" style={{ backgroundColor: '#111' }}>
            <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
              <FontAwesome name="book" size={20} color="#EAB308" />
            </View>
            <Text className="text-white font-bold text-sm">Menú</Text>
            <Text className="text-neutral-500 text-[10px] mt-1 text-center">Catálogo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/(admin)/extras-manager')} activeOpacity={0.8}
            className="flex-1 rounded-[24px] p-5 items-center justify-center border border-neutral-800" style={{ backgroundColor: '#111' }}>
            <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
              <FontAwesome name="plus" size={20} color="#EAB308" />
            </View>
            <Text className="text-white font-bold text-sm">Extras</Text>
            <Text className="text-neutral-500 text-[10px] mt-1 text-center">Adicionales</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/(admin)/analytics')} activeOpacity={0.8}
            className="flex-1 rounded-[24px] p-5 items-center justify-center border border-neutral-800" style={{ backgroundColor: '#111' }}>
            <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <FontAwesome name="pie-chart" size={20} color="#22C55E" />
            </View>
            <Text className="text-white font-bold text-sm">Métricas</Text>
            <Text className="text-neutral-500 text-[10px] mt-1 text-center">Reportes</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}