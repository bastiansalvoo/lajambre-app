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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#090909' }} edges={['top', 'left', 'right']}>
      {/* Fondo sutil */}
      <Image source={require('../../assets/images/menu/banner.jpg')} className="absolute inset-0 w-full h-full" resizeMode="cover" style={{ opacity: 0.06 }} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EAB308" colors={['#EAB308']} progressBackgroundColor="#171717" />
        }
      >
        {/* Título */}
        <View className="px-5 pt-3 pb-2">
          <Text className="text-white text-xl font-black uppercase">Analíticas</Text>
          <Text className="text-neutral-500 text-[10px] font-bold uppercase mt-0.5">Datos en tiempo real</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#EAB308" className="mt-10" />
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <View className="px-5 flex-row flex-wrap gap-x-3 gap-y-3 mt-4">
              {[
                { label: 'Ventas Totales', value: formatPeso(summary?.totalRevenue || 0), icon: 'dollar', color: '#EAB308' },
                { label: 'Ticket Promedio', value: formatPeso(summary?.avgTicket || 0), icon: 'bar-chart', color: '#22C55E' },
                { label: 'Pedidos Hoy', value: summary?.ordersToday || 0, icon: 'calendar-check-o', color: '#3B82F6' },
                { label: 'Total Pedidos', value: summary?.totalOrders || 0, icon: 'list-alt', color: '#F97316' },
              ].map((kpi, i) => (
                <View key={i} className="w-[47%] bg-neutral-950 border border-neutral-800/50 rounded-2xl p-4">
                  <View className="flex-row items-center gap-x-2 mb-2">
                    <FontAwesome name={kpi.icon} size={14} color={kpi.color} />
                    <Text className="text-neutral-500 text-[9px] font-bold uppercase">{kpi.label}</Text>
                  </View>
                  <Text className="text-white text-xl font-black">{kpi.value}</Text>
                </View>
              ))}
            </View>

            {/* ── Top Productos ── */}
            <View className="px-5 mt-6">
              <Text className="text-neutral-500 font-black uppercase text-[11px] tracking-[3px] mb-3">
                Productos Más Vendidos
              </Text>
              {topProducts.map((product, i) => (
                <View key={i} className="mb-3">
                  <View className="flex-row justify-between items-center mb-1">
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-6 h-6 bg-yellow-500/10 rounded-lg items-center justify-center mr-2">
                        <Text className="text-yellow-500 text-[10px] font-black">{i + 1}</Text>
                      </View>
                      <Text className="text-white font-bold text-xs uppercase flex-1" numberOfLines={1}>
                        {product.name}
                      </Text>
                    </View>
                    <Text className="text-yellow-500 font-black text-xs">{product.quantitySold} uds.</Text>
                  </View>
                  <View className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${Math.max((product.revenue / maxRevenue) * 100, 2)}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* ── Ventas Diarias ── */}
            <View className="px-5 mt-6">
              <Text className="text-neutral-500 font-black uppercase text-[11px] tracking-[3px] mb-3">
                Ventas Últimos 7 Días
              </Text>
              <View className="flex-row items-end justify-between h-32 px-1">
                {salesChart.map((day, i) => (
                  <View key={i} className="items-center flex-1">
                    <Text className="text-neutral-500 text-[9px] font-bold mb-1">
                      {formatPeso(day.revenue).replace('$', '')}
                    </Text>
                    <View
                      className="w-5 bg-yellow-500 rounded-t-md"
                      style={{
                        height: Math.max((day.revenue / maxChartRevenue) * 100, 4),
                        opacity: 0.4 + (day.revenue / maxChartRevenue) * 0.6,
                      }}
                    />
                    <Text className="text-neutral-600 text-[8px] font-bold mt-1">
                      {dayNames[new Date(day.date + 'T00:00:00').getDay()]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="h-10" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
