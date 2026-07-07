import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from '@/src/utils/storage';
import Toast from 'react-native-toast-message';
import { api, clearSession } from '../../src/api/api';
import { useCartStore } from '../../src/store/cartStore';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Config de estados ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string; desc: string }> = {
  PENDIENTE:  { label: 'Pendiente',   emoji: '⏳', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  desc: 'Esperando confirmación de pago' },
  PAGADO:     { label: 'Pagado',      emoji: '✅', color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   desc: 'Pago confirmado, en cola' },
  PREPARANDO: { label: 'Preparando',  emoji: '👨‍🍳', color: '#F97316', bg: 'rgba(249,115,22,0.12)', desc: 'La cocina está en ello...' },
  EN_CAMINO:  { label: 'En Camino',   emoji: '🛵', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', desc: 'Tu pedido viene en camino' },
  ENTREGADO:  { label: 'Entregado',   emoji: '🎉', color: '#10B981', bg: 'rgba(16,185,129,0.12)', desc: '¡Buen provecho!' },
  CANCELADO:  { label: 'Cancelado',   emoji: '❌', color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  desc: 'El pedido fue cancelado' },
};

// ─── Componente de una Orden ─────────────────────────────────────────────────
function OrderCard({ order, onReorder, onCancel }: { order: any; onReorder: (o: any) => void; onCancel?: (o: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, emoji: '❓', color: '#A3A3A3', bg: 'rgba(163,163,163,0.1)', desc: '' };
  const isActionable = order.status === 'CANCELADO' || order.status === 'PENDIENTE';
  const isActive = ['PAGADO', 'PREPARANDO', 'EN_CAMINO'].includes(order.status);

  const toggle = () => {
    Animated.spring(rotateAnim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const totalItems = order.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) ?? 0;

  return (
    <View
      className="mb-5 rounded-[28px] overflow-hidden"
      style={{
        backgroundColor: '#0D0D0D',
        borderWidth: 1,
        borderColor: isActive ? `${cfg.color}30` : 'rgba(255,255,255,0.04)',
        shadowColor: isActive ? cfg.color : '#000',
        shadowOpacity: isActive ? 0.15 : 0.1,
        shadowRadius: 20,
        elevation: 6,
      }}
    >
      {/* ── Fondo con Imagen ── */}
      <Image
        source={require('../../assets/images/menu/banner.jpg')}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
        style={{ opacity: 0.45 }}
      />
      <View className="absolute inset-0" style={{ backgroundColor: 'rgba(5,5,5,0.75)' }} />

      {/* ── Acento de color superior (solo para activos) */}
      {isActive && (
        <View style={{ height: 3, backgroundColor: cfg.color, opacity: 0.8 }} />
      )}

      {/* ── Header tappable */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.85} className="px-5 pt-5 pb-4">
        
        {/* Fila 1: Número + Status */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center">
            {/* Badge de número */}
            <View className="items-center justify-center mr-3" style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: cfg.bg, borderWidth: 1, borderColor: `${cfg.color}30` }}>
              <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
            </View>
            <View>
              <Text className="text-white font-black tracking-tight" style={{ fontSize: 18 }}>
                Orden <Text style={{ color: cfg.color }}>#{order.id}</Text>
              </Text>
              <Text className="text-neutral-500 text-[11px] font-bold mt-0.5 uppercase tracking-wider">
                {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>

          {/* Badge de estado */}
          <View className="items-end">
            <View className="px-3 py-1.5 rounded-full flex-row items-center" style={{ backgroundColor: cfg.bg }}>
              <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: cfg.color }} />
              <Text className="font-black uppercase text-[10px] tracking-widest" style={{ color: cfg.color }}>
                {cfg.label}
              </Text>
            </View>
            {cfg.desc ? (
              <Text className="text-neutral-600 text-[9px] font-bold mt-1.5 uppercase tracking-wider text-right" style={{ maxWidth: 120 }}>
                {cfg.desc}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Fila 2: Resumen rápido */}
        <View className="flex-row items-center justify-between pt-3 border-t border-white/[0.04]">
          <View className="flex-row items-center">
            <FontAwesome name={order.deliveryFee > 0 ? 'motorcycle' : 'building'} size={11} color="#525252" />
            <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider ml-1.5">
              {order.deliveryFee > 0 ? 'Delivery' : 'Retiro Local'}
            </Text>
            <Text className="text-neutral-700 mx-2 text-[10px]">·</Text>
            <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="font-black text-[20px] tracking-tight" style={{ color: cfg.color }}>
              ${order.total.toLocaleString('es-CL')}
            </Text>
            <Animated.View style={{ transform: [{ rotate }], marginLeft: 10 }}>
              <FontAwesome name="chevron-down" size={12} color="#525252" />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Detalle expandible */}
      {expanded && (
        <View className="px-5 pb-5 border-t border-white/[0.04]">
          <Text className="text-neutral-600 text-[9px] font-black uppercase tracking-widest mb-3 mt-4">
            Detalle del Pedido
          </Text>
          
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} className="flex-row items-center mb-3">
              {/* Qty badge */}
              <View className="w-8 h-8 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(234,179,8,0.1)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.15)' }}>
                <Text className="text-yellow-500 font-black text-[12px]">{item.quantity}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-[13px]" numberOfLines={1}>
                  {item.product?.name ?? 'Producto eliminado'}
                </Text>
                {item.extras && item.extras.length > 0 && (
                  <View className="flex-row flex-wrap mt-1">
                    {item.extras.map((e: any, ei: number) => (
                      <View key={ei} className="bg-white/5 rounded-full px-2 py-0.5 mr-1 mb-0.5">
                        <Text className="text-neutral-400 text-[9px] font-bold uppercase">+{e.extra.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Text className="text-neutral-400 font-bold text-[12px] ml-2">
                ${(item.priceAtPurchase * item.quantity).toLocaleString('es-CL')}
              </Text>
            </View>
          ))}

          {/* Separador y totales */}
          <View className="mt-2 pt-4 border-t border-dashed border-white/[0.06]">
            {order.deliveryFee > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-neutral-600 text-[11px] font-bold uppercase tracking-wider">Delivery</Text>
                <Text className="text-neutral-400 font-bold text-[11px]">${order.deliveryFee.toLocaleString('es-CL')}</Text>
              </View>
            )}
            <View className="flex-row justify-between items-center">
              <Text className="text-neutral-400 text-[11px] font-black uppercase tracking-widest">Total Pagado</Text>
              <Text className="font-black text-[22px]" style={{ color: cfg.color }}>
                ${order.total.toLocaleString('es-CL')}
              </Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View className="flex-row items-center justify-between mt-5 gap-x-3">
            {order.status === 'PENDIENTE' && onCancel && (
              <TouchableOpacity
                onPress={() => onCancel(order)}
                activeOpacity={0.8}
                className="py-4 rounded-2xl flex-1 flex-row justify-center items-center bg-neutral-900 border border-white/10"
              >
                <FontAwesome name="times" size={13} color="#9CA3AF" />
                <Text className="font-black uppercase text-[11px] ml-2.5 tracking-widest text-neutral-400">
                  Cancelar
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => onReorder(order)}
              activeOpacity={0.8}
              className="py-4 rounded-2xl flex-1 flex-row justify-center items-center"
              style={{
                backgroundColor: isActionable ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)',
                borderWidth: 1,
                borderColor: isActionable ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.25)',
              }}
            >
              <FontAwesome
                name={isActionable ? 'refresh' : 'repeat'}
                size={13}
                color={isActionable ? '#EF4444' : '#EAB308'}
              />
              <Text
                className="font-black uppercase text-[11px] ml-2.5 tracking-widest"
                style={{ color: isActionable ? '#EF4444' : '#EAB308' }}
              >
                {isActionable ? 'Reintentar Pago' : 'Volver a Pedir'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Estado vacío cinematográfico ─────────────────────────────────────────────
function EmptyOrdersState({ onGoToMenu }: { onGoToMenu: () => void }) {
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in general
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    // Pulsación del ícono
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Flotación suave
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Glow pulsante del aura
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const glowOpacity = glowAnim;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Imagen de fondo */}
      <Image
        source={require('../../assets/images/menu/banner.jpg')}
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.5 }}
        resizeMode="cover"
      />
      {/* Capa oscura encima */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, opacity: fadeAnim }}>

        {/* Ícono animado con aura */}
        <Animated.View style={{ alignItems: 'center', transform: [{ translateY }], marginBottom: 36 }}>
          {/* Anillo de aura exterior */}
          <Animated.View style={{
            position: 'absolute', width: 180, height: 180, borderRadius: 90,
            backgroundColor: 'rgba(234,179,8,0.06)',
            borderWidth: 1, borderColor: 'rgba(234,179,8,0.15)',
            opacity: glowOpacity,
            transform: [{ scale: pulseAnim }],
          }} />
          {/* Anillo medio */}
          <Animated.View style={{
            position: 'absolute', width: 130, height: 130, borderRadius: 65,
            backgroundColor: 'rgba(234,179,8,0.08)',
            opacity: glowOpacity,
          }} />
          {/* Círculo ícono */}
          <Animated.View style={{
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: 'rgba(234,179,8,0.12)',
            borderWidth: 1.5, borderColor: 'rgba(234,179,8,0.4)',
            alignItems: 'center', justifyContent: 'center',
            transform: [{ scale: pulseAnim }],
            shadowColor: '#EAB308', shadowOpacity: 0.5, shadowRadius: 30, elevation: 20,
          }}>
            <FontAwesome name="motorcycle" size={42} color="#EAB308" />
          </Animated.View>
        </Animated.View>

        {/* Texto principal */}
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, lineHeight: 40, marginBottom: 14 }}>
          Tu historial{'\n'}<Text style={{ color: '#EAB308' }}>está vacío</Text>
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 48, fontWeight: '500' }}>
          Cuando hagas tu primer pedido aparecerá aquí con todos los detalles y tu historial de Lajambre Club.
        </Text>

        {/* Botón brillante */}
        <TouchableOpacity
          onPress={onGoToMenu}
          activeOpacity={0.85}
          style={{
            borderRadius: 26, overflow: 'hidden',
            shadowColor: '#EAB308', shadowOpacity: 0.6, shadowRadius: 25, elevation: 15,
          }}
        >
          <LinearGradient
            colors={['#FDE047', '#EAB308', '#CA8A04']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 36, paddingVertical: 18 }}
          >
            <FontAwesome name="cutlery" size={16} color="#000" />
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 3, marginLeft: 12, textTransform: 'uppercase' }}>
              Explorar Menú
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart, addItem } = useCartStore();

  useFocusEffect(
    useCallback(() => { fetchOrders(); }, [])
  );

  const fetchOrders = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) { router.replace('/(auth)/login'); return; }
      setIsLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await clearSession();
        router.replace('/(auth)/login');
      } else {
        Toast.show({ type: 'error', text1: 'Error de conexión', text2: 'No se pudieron cargar tus pedidos. Verifica tu internet.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (order: any) => {
    // Si el pedido está PENDIENTE: reintentar pago de la orden EXISTENTE (no crear una nueva)
    if (order.status === 'PENDIENTE') {
      try {
        const payResponse = await api.post(`/orders/${order.id}/pay`);
        const checkoutUrl = payResponse.data.checkout_url;
        await WebBrowser.openBrowserAsync(checkoutUrl);
        fetchOrders(); // Recargar estado al volver
      } catch (error: any) {
        const msg = error.response?.data?.message || 'No se pudo reintentar el pago.';
        Toast.show({ type: 'error', text1: 'Error', text2: Array.isArray(msg) ? msg[0] : msg });
      }
      return;
    }
    // Si el pedido está CANCELADO: volver a pedir (crear orden nueva con los mismos items)
    clearCart();
    order.items.forEach((item: any) => {
      const product = { id: item.product.id, name: item.product.name, price: item.product.price, image: item.product.image };
      const extras = item.extras?.map((e: any) => e.extra) || [];
      for (let i = 0; i < item.quantity; i++) addItem(product, extras);
    });
    router.push('/(client)/cart');
  };

  const handleCancel = async (order: any) => {
    Alert.alert(
      '¿Cancelar Pedido?',
      '¿Estás seguro que deseas cancelar este pedido? Si usaste puntos, se te devolverán.',
      [
        { text: 'No, mantener', style: 'cancel' },
        { 
          text: 'Sí, cancelar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/orders/${order.id}/cancel`);
              Toast.show({ type: 'success', text1: 'Cancelado', text2: 'El pedido ha sido cancelado con éxito.' });
              fetchOrders();
            } catch (error: any) {
              const msg = error.response?.data?.message || 'No se pudo cancelar el pedido.';
              Toast.show({ type: 'error', text1: 'Error', text2: Array.isArray(msg) ? msg[0] : msg });
            }
          }
        }
      ]
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#EAB308" />
        <Text className="text-neutral-600 text-[11px] font-black uppercase tracking-widest mt-4">Cargando pedidos...</Text>
      </View>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return <EmptyOrdersState onGoToMenu={() => router.push('/(client)')} />;
  }

  // ── Lista de órdenes ────────────────────────────────────────────────────────
  const activeOrders = orders.filter(o => ['PAGADO', 'PREPARANDO', 'EN_CAMINO'].includes(o.status));
  const pastOrders   = orders.filter(o => !['PAGADO', 'PREPARANDO', 'EN_CAMINO'].includes(o.status));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#000' }} edges={['top']}>
      {/* ── Fondo Global de la Pantalla ── */}
      <View className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        <Image
          source={require('../../assets/images/menu/banner.jpg')}
          className="w-full h-full"
          resizeMode="cover"
          style={{ opacity: 0.6 }}
        />
        <View className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} />
      </View>

      {/* ── Header ── */}
      <View className="px-5 pt-4 pb-5 flex-row items-center">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white font-black uppercase tracking-widest" style={{ fontSize: 26 }}>
              Mis Pedidos
            </Text>
            <View className="flex-1 h-[2px] bg-yellow-500 ml-4 rounded-full opacity-50" />
          </View>
          <View className="flex-row items-center mt-1">
            <View className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-2" />
            <Text className="text-neutral-500 text-[11px] font-bold uppercase tracking-widest">
              {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'} en total
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={fetchOrders}
          className="w-11 h-11 rounded-2xl items-center justify-center ml-4"
          style={{ backgroundColor: 'rgba(234,179,8,0.1)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.15)' }}
        >
          <FontAwesome name="refresh" size={16} color="#EAB308" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* ── Sección: Pedidos Activos ── */}
        {activeOrders.length > 0 && (
          <>
            <View className="flex-row items-center mb-4">
              <View className="w-2 h-2 rounded-full bg-green-400 mr-2" style={{ shadowColor: '#4ade80', shadowOpacity: 1, shadowRadius: 6 }} />
              <Text className="text-green-400 font-black uppercase text-[10px] tracking-[3px]">En Progreso</Text>
            </View>
            {activeOrders.map(o => (
              <OrderCard key={o.id} order={o} onReorder={handleReorder} onCancel={handleCancel} />
            ))}
            <View className="h-2" />
          </>
        )}

        {/* ── Sección: Historial ── */}
        {pastOrders.length > 0 && (
          <>
            <View className="flex-row items-center mb-4 mt-2">
              <Text className="text-neutral-600 font-black uppercase text-[10px] tracking-[3px]">Historial</Text>
              <View className="flex-1 h-px bg-white/[0.04] ml-3" />
            </View>
            {pastOrders.map(o => (
              <OrderCard key={o.id} order={o} onReorder={handleReorder} onCancel={handleCancel} />
            ))}
          </>
        )}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
