import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Image, StatusBar, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/api/api';
import { showAlert } from '../../src/utils/alert';
import Toast from 'react-native-toast-message';

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ ordersToday: 0, pending: 0, products: 0, revenue: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);

  // --- Animación del brillo (Diamante) y Latido (Pulse) ---
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(2000)
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.02,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 450]
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/orders/admin/all?limit=200');
      const orders = res.data?.data || res.data || [];
      const today = new Date().toDateString();
      const todayOrders = Array.isArray(orders) ? orders.filter((o: any) => new Date(o.createdAt).toDateString() === today) : [];
      const pending = Array.isArray(orders) ? orders.filter((o: any) => o.status === 'PAGADO' || o.status === 'PREPARANDO') : [];
      const revenue = todayOrders
        .filter((o: any) => o.status === 'PAGADO')
        .reduce((s: number, o: any) => s + o.total, 0);
      const prodRes = await api.get('/products');
      const products = Array.isArray(prodRes.data) ? prodRes.data : [];
      setStats({ ordersToday: todayOrders.length, pending: pending.length, products: products.length, revenue });
    } catch { }

    try {
      const storeRes = await api.get('/store/status');
      setStoreOpen(storeRes.data?.isOpen ?? true);
    } catch { }
  }, []);

  const toggleStore = () => {
    const closing = storeOpen;
    showAlert(
      closing ? '¿Cerrar el local?' : '¿Abrir el local?',
      closing
        ? 'Los clientes no van a poder hacer pedidos hasta que lo vuelvas a abrir.'
        : 'Los clientes van a poder volver a hacer pedidos (dentro del horario habitual).',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: closing ? 'Sí, cerrar' : 'Sí, abrir',
          style: closing ? 'destructive' : 'default',
          onPress: async () => {
            setTogglingStore(true);
            try {
              const res = await api.patch('/store/status', { isOpen: !closing });
              setStoreOpen(res.data?.isOpen ?? !closing);
              Toast.show({
                type: 'success',
                text1: closing ? 'Local cerrado' : 'Local abierto',
              });
            } catch {
              Toast.show({ type: 'error', text1: 'No se pudo actualizar el estado del local.' });
            } finally {
              setTogglingStore(false);
            }
          },
        },
      ],
    );
  };

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));
  const onRefresh = async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); };
  const fm = (n: number) => '$' + n.toLocaleString('es-CL');

  const greeting = "Hola buenas";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#060606' }} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#060606" />
      
      {/* Efectos de Resplandor Ambiental (Ambient Glows) */}
      <View className="absolute top-[-50] right-[-50] w-64 h-64 rounded-full" style={{ backgroundColor: '#EAB308', opacity: 0.04, transform: [{ scale: 1.5 }] }} />
      <View className="absolute top-[30%] left-[-80] w-72 h-72 rounded-full" style={{ backgroundColor: '#22C55E', opacity: 0.03, transform: [{ scale: 1.5 }] }} />
      
      <Image source={require('../../assets/images/menu/banner2.jpg')} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.2 }} />
      
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EAB308" colors={['#EAB308']} progressBackgroundColor="#111" />}>

        {/* Header Limpio */}
        <View className="px-6 pt-8 pb-6">
          <View className="flex-row items-center mb-1">
            <Text className="text-neutral-400 text-sm font-medium">{greeting}</Text>
            <Text className="text-lg ml-1">👋</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-white text-[28px] font-black tracking-tight mr-4">Panel de Control</Text>
            <View className="flex-1 h-[2px] bg-yellow-500/40 rounded-full" />
          </View>
        </View>

        {/* KPI Destacado: Tarjeta Diamante Brillante */}
        <View className="px-6 mb-8">
          <View 
            className="rounded-[32px] p-6 overflow-hidden relative border border-white/60" 
            style={{ 
              backgroundColor: '#EAB308',
              shadowColor: '#EAB308',
              shadowOpacity: 0.9,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 0 },
              elevation: 25
            }}>
            
            {/* Facetas de Diamante Estáticas (Cortes geométricos translúcidos) */}
            <View className="absolute top-[-20] right-[-30] w-48 h-48 bg-white/20" style={{ transform: [{ rotate: '35deg' }] }} />
            <View className="absolute bottom-[-40] left-[-20] w-40 h-40 bg-white/30" style={{ transform: [{ rotate: '-25deg' }] }} />
            <View className="absolute top-[20%] right-[30%] w-24 h-64 bg-white/10" style={{ transform: [{ rotate: '45deg' }] }} />
            
            {/* Brillo Superior (Gloss effect) */}
            <View className="absolute top-0 left-0 right-0 h-[25%] bg-white" style={{ opacity: 0.3 }} />
            
            {/* Animación dinámica cruzando la tarjeta (El destello del diamante) */}
            <Animated.View 
              style={{
                position: 'absolute',
                top: -100,
                bottom: -100,
                width: 40,
                backgroundColor: 'rgba(255,255,255,0.5)',
                transform: [
                  { rotate: '25deg' },
                  { translateX: translateX }
                ],
                shadowColor: 'white',
                shadowOpacity: 1,
                shadowRadius: 10,
                elevation: 10,
                zIndex: 0
              }} 
            />

            {/* Contenido (con zIndex elevado para estar encima de los destellos) */}
            <View style={{ zIndex: 10 }}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-white mr-2 shadow-sm" />
                  <Text className="text-black/90 text-xs font-black uppercase tracking-widest">Ingresos</Text>
                </View>
                <View className="bg-black/20 px-3 py-1 rounded-full border border-black/10">
                  <Text className="text-black text-[9px] font-black uppercase tracking-wider">Hoy</Text>
                </View>
              </View>
              
              <Text className="text-black text-[46px] font-black tracking-tighter mb-5" style={{ textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 }}>
                {fm(stats.revenue)}
              </Text>
              
              <View className="flex-row items-center bg-black/15 rounded-2xl p-3 border border-black/5" style={{ overflow: 'hidden' }}>
                <View className="flex-1 flex-row items-center justify-center border-r border-black/10">
                  <FontAwesome name="shopping-bag" size={12} color="rgba(0,0,0,0.7)" className="mr-2" />
                  <Text className="text-black/70 text-[11px] font-black uppercase mr-2">Pedidos</Text>
                  <Text className="text-black text-lg font-black">{stats.ordersToday}</Text>
                </View>
                <View className="flex-1 flex-row items-center justify-center">
                  <FontAwesome name="fire" size={14} color="rgba(0,0,0,0.7)" className="mr-2" />
                  <Text className="text-black/70 text-[11px] font-black uppercase mr-2">Cocina</Text>
                  <Text className="text-black text-lg font-black">{stats.pending}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Mini Cards Rediseñadas (Bloques de Color) */}
        <View className="px-6 flex-row gap-x-4 mb-8">
          {/* Card: Pedidos */}
          <View className="flex-1 rounded-[24px] p-4 items-center justify-center border border-yellow-500/20" style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)' }}>
            <FontAwesome name="calendar-check-o" size={18} color="#EAB308" className="mb-2" />
            <Text className="text-yellow-500 text-3xl font-black">{stats.ordersToday}</Text>
            <Text className="text-yellow-500/70 text-[9px] font-black uppercase tracking-widest mt-1">Hoy</Text>
          </View>
          
          {/* Card: Activos */}
          <View className="flex-1 rounded-[24px] p-4 items-center justify-center border border-orange-500/20" style={{ backgroundColor: 'rgba(249, 115, 22, 0.08)' }}>
            <FontAwesome name="fire" size={18} color="#F97316" className="mb-2" />
            <Text className="text-orange-500 text-3xl font-black">{stats.pending}</Text>
            <Text className="text-orange-500/70 text-[9px] font-black uppercase tracking-widest mt-1">Cocina</Text>
          </View>
          
          {/* Card: Productos */}
          <View className="flex-1 rounded-[24px] p-4 items-center justify-center border border-green-500/20" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
            <FontAwesome name="cutlery" size={18} color="#22C55E" className="mb-2" />
            <Text className="text-green-500 text-3xl font-black">{stats.products}</Text>
            <Text className="text-green-500/70 text-[9px] font-black uppercase tracking-widest mt-1">Menú</Text>
          </View>
        </View>

        {/* Sección: Navegación Principal */}
        <View className="px-6 mb-4">
          <Text className="text-neutral-500 font-black uppercase text-[10px] tracking-[0.2em]">Gestión Operativa</Text>
        </View>

        {/* Action Banner: Monitor en Vivo */}
        <Animated.View style={{ paddingHorizontal: 24, marginBottom: 20, transform: [{ scale: pulseValue }] }}>
          <TouchableOpacity onPress={() => router.push('/(admin)/live-orders')} activeOpacity={0.85}
            className="rounded-[24px] p-5 flex-row items-center border border-yellow-500/30 overflow-hidden relative" 
            style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)' }}>
            
            <View className="relative w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: '#EAB308' }}>
              <FontAwesome name="bell" size={24} color="#000" />
              {stats.pending > 0 && (
                <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-[2px] border-yellow-500" />
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-white font-black text-[17px] tracking-tight mb-0.5">Monitor en Vivo</Text>
              <Text className="text-yellow-500/70 font-semibold text-[11px] uppercase tracking-wider">Control de Despachos</Text>
            </View>
            
            <View className="w-10 h-10 rounded-full items-center justify-center border border-yellow-500/20" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)' }}>
              <FontAwesome name="arrow-right" size={14} color="#EAB308" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Grid Menú Inferior */}
        <View className="px-6 flex-row gap-x-4 mb-4">
          <TouchableOpacity onPress={() => router.push('/(admin)/menu-manager')} activeOpacity={0.8}
            className="flex-1 rounded-[24px] p-5 items-center justify-center border-t border-neutral-700/40 border-x border-neutral-800/80 border-b border-neutral-900" style={{ backgroundColor: '#111' }}>
            <View className="w-12 h-12 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)' }}>
              <FontAwesome name="book" size={22} color="#EAB308" />
            </View>
            <Text className="text-white font-black text-xs uppercase tracking-wider">Menú</Text>
            <Text className="text-neutral-500 text-[9px] font-bold mt-1 uppercase">Catálogo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/(admin)/extras-manager')} activeOpacity={0.8}
            className="flex-1 rounded-[24px] p-5 items-center justify-center border-t border-neutral-700/40 border-x border-neutral-800/80 border-b border-neutral-900" style={{ backgroundColor: '#111' }}>
            <View className="w-12 h-12 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)' }}>
              <FontAwesome name="plus" size={22} color="#EAB308" />
            </View>
            <Text className="text-white font-black text-xs uppercase tracking-wider">Extras</Text>
            <Text className="text-neutral-500 text-[9px] font-bold mt-1 uppercase">Adicionales</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/(admin)/analytics')} activeOpacity={0.8}
            className="flex-1 rounded-[24px] p-5 items-center justify-center border-t border-neutral-700/40 border-x border-neutral-800/80 border-b border-neutral-900" style={{ backgroundColor: '#111' }}>
            <View className="w-12 h-12 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
              <FontAwesome name="pie-chart" size={22} color="#22C55E" />
            </View>
            <Text className="text-white font-black text-xs uppercase tracking-wider">Datos</Text>
            <Text className="text-neutral-500 text-[9px] font-bold mt-1 uppercase">Métricas</Text>
          </TouchableOpacity>
        </View>

        {/* Premios de Lajambre Club */}
        <View className="px-6 mb-4">
          <TouchableOpacity onPress={() => router.push('/(admin)/rewards-manager')} activeOpacity={0.85}
            className="rounded-[24px] p-5 flex-row items-center border" style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
            <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
              <FontAwesome name="trophy" size={20} color="#A855F7" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-[15px] tracking-tight mb-0.5">Premios</Text>
              <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Lajambre Club</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#737373" />
          </TouchableOpacity>
        </View>

        {/* Cierre manual del local */}
        <View className="px-6 mt-2">
          <TouchableOpacity
            onPress={toggleStore}
            disabled={togglingStore}
            activeOpacity={0.85}
            className="rounded-[24px] p-5 flex-row items-center justify-center border"
            style={{
              backgroundColor: storeOpen ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              borderColor: storeOpen ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)',
              opacity: togglingStore ? 0.6 : 1,
            }}
          >
            <FontAwesome name={storeOpen ? 'lock' : 'unlock'} size={16} color={storeOpen ? '#EF4444' : '#22C55E'} />
            <Text
              className="font-black uppercase text-[13px] tracking-widest ml-3"
              style={{ color: storeOpen ? '#EF4444' : '#22C55E' }}
            >
              {storeOpen ? 'Cerrar Local' : 'Abrir Local'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
