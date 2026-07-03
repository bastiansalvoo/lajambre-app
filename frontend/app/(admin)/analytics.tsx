import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/api/api';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, topRes, chartRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/top-products?limit=5'),
        api.get('/analytics/sales-chart?days=7'),
      ]);
      setSummary(summaryRes.data);
      setTopProducts(topRes.data);
      setSalesChart(chartRes.data);
    } catch (error) {
      console.error('Error cargando analíticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const maxRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);
  const maxChartRevenue = Math.max(...salesChart.map((d) => d.revenue), 1);

  const formatPeso = (n: number) => `$${n.toLocaleString('es-CL')}`;
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#060606' }} edges={['top', 'left', 'right']}>
      {/* Efectos Ambientales (Sin Blur) */}
      <View className="absolute top-[-80] right-[-80] w-72 h-72 rounded-full" style={{ backgroundColor: '#EAB308', opacity: 0.05, transform: [{ scale: 1.5 }] }} />
      <View className="absolute top-[30%] left-[-100] w-80 h-80 rounded-full" style={{ backgroundColor: '#22C55E', opacity: 0.03, transform: [{ scale: 1.5 }] }} />

      {/* Fondo sutil fotográfico */}
      <Image source={require('../../assets/images/menu/banner.jpg')} className="absolute inset-0 w-full h-full" resizeMode="cover" style={{ opacity: 0.12 }} />
      
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EAB308" colors={['#EAB308']} progressBackgroundColor="#171717" />
        }
      >
        {/* Título Imponente */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-white text-[28px] font-black tracking-tight mb-0.5">Analíticas</Text>
          <View className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full self-start mt-1 flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
            <Text className="text-yellow-500 text-[9px] font-black uppercase tracking-widest">Datos en tiempo real</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#EAB308" className="mt-16" size="large" />
        ) : (
          <>
            {/* ── KPI Hero Card (Ventas Totales) ── */}
            <View className="px-6 mt-6">
              <View 
                className="rounded-[28px] p-6 border"
                style={{ 
                  backgroundColor: '#111', 
                  borderColor: 'rgba(234, 179, 8, 0.3)',
                  shadowColor: '#EAB308', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8
                }}
              >
                <View className="flex-row items-center gap-x-3 mb-2">
                  <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)' }}>
                    <FontAwesome name="dollar" size={16} color="#EAB308" />
                  </View>
                  <Text className="text-neutral-400 text-[11px] font-black uppercase tracking-widest">Ventas Totales</Text>
                </View>
                <Text className="text-white text-[42px] font-black tracking-tighter mt-1">{formatPeso(summary?.totalRevenue || 0)}</Text>
              </View>
            </View>

            {/* ── KPIs Secundarios (Fila de 3) ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 px-6" contentContainerStyle={{ paddingRight: 48, gap: 12 }}>
              {/* Ticket Promedio */}
              <View className="bg-[#111] rounded-[20px] p-5 border border-white/10 w-36">
                <View className="flex-row items-center gap-x-2 mb-3">
                  <FontAwesome name="bar-chart" size={12} color="#22C55E" />
                  <Text className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Ticket Prom.</Text>
                </View>
                <Text className="text-white text-xl font-black">{formatPeso(summary?.avgTicket || 0)}</Text>
              </View>

              {/* Pedidos Hoy */}
              <View className="bg-[#111] rounded-[20px] p-5 border border-white/10 w-36">
                <View className="flex-row items-center gap-x-2 mb-3">
                  <FontAwesome name="calendar-check-o" size={12} color="#3B82F6" />
                  <Text className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Pedidos Hoy</Text>
                </View>
                <Text className="text-white text-xl font-black">{summary?.ordersToday || 0}</Text>
              </View>

              {/* Total Pedidos */}
              <View className="bg-[#111] rounded-[20px] p-5 border border-white/10 w-36">
                <View className="flex-row items-center gap-x-2 mb-3">
                  <FontAwesome name="list-alt" size={12} color="#F97316" />
                  <Text className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Total Pedidos</Text>
                </View>
                <Text className="text-white text-xl font-black">{summary?.totalOrders || 0}</Text>
              </View>
            </ScrollView>

            {/* ── Ventas Diarias (Glowing Pillars) ── */}
            <View className="px-6 mt-10">
              <Text className="text-white font-black uppercase text-[15px] tracking-tight mb-6">
                Últimos 7 Días
              </Text>
              <View className="bg-[#111] border border-white/10 rounded-[24px] p-5 h-56 justify-end pt-8 relative">
                
                {/* Lineas de guía de fondo */}
                <View className="absolute left-0 right-0 top-1/4 h-[1px] bg-white/5" />
                <View className="absolute left-0 right-0 top-2/4 h-[1px] bg-white/5" />
                <View className="absolute left-0 right-0 top-3/4 h-[1px] bg-white/5" />

                <View className="flex-row items-end justify-between px-1 h-full z-10">
                  {salesChart.map((day, i) => {
                    const heightPct = Math.max((day.revenue / maxChartRevenue) * 100, 4);
                    const opacityPct = 0.2 + (day.revenue / maxChartRevenue) * 0.8;
                    
                    return (
                      <View key={i} className="items-center flex-1 h-full justify-end">
                        <Text className="text-neutral-400 text-[9px] font-bold mb-2 absolute" style={{ bottom: `${heightPct}%`, marginBottom: 4 }}>
                          {formatPeso(day.revenue).replace('$', '').replace('.000', 'k')}
                        </Text>
                        <View
                          className="w-8 rounded-t-lg border-t border-yellow-400/50"
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: `rgba(234, 179, 8, ${opacityPct * 0.4})`,
                            borderLeftWidth: 1,
                            borderRightWidth: 1,
                            borderColor: `rgba(234, 179, 8, ${opacityPct * 0.2})`,
                          }}
                        />
                        <Text className="text-neutral-500 text-[10px] font-black uppercase mt-3 tracking-widest">
                          {dayNames[new Date(day.date + 'T00:00:00').getDay()]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* ── Top Productos (Neon Bars) ── */}
            <View className="px-6 mt-10">
              <Text className="text-white font-black uppercase text-[15px] tracking-tight mb-6">
                Productos Estrella
              </Text>
              <View className="bg-[#111] border border-white/10 rounded-[24px] p-5">
                {topProducts.map((product, i) => {
                  const widthPct = Math.max((product.revenue / maxRevenue) * 100, 2);
                  return (
                    <View key={i} className="mb-5 last:mb-0">
                      <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center flex-1 mr-3">
                          <View className="w-6 h-6 rounded-lg items-center justify-center mr-3 border" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
                            <Text className="text-yellow-500 text-[11px] font-black">{i + 1}</Text>
                          </View>
                          <Text className="text-white font-black text-[13px] uppercase tracking-wide flex-1" numberOfLines={1}>
                            {product.name}
                          </Text>
                        </View>
                        <Text className="text-yellow-500 font-black text-[13px]">{product.quantitySold} uds</Text>
                      </View>
                      
                      {/* Barra Neon */}
                      <View className="h-2.5 rounded-full overflow-hidden relative" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <View
                          className="h-full absolute left-0 top-0 bottom-0 rounded-full"
                          style={{ 
                            width: `${widthPct}%`, 
                            backgroundColor: 'rgba(234, 179, 8, 0.4)',
                            borderRightWidth: 2,
                            borderColor: '#EAB308'
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="h-16" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
