import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, LayoutAnimation, UIManager, Platform, Animated, Easing, Dimensions } from 'react-native';
import { showAlert } from '@/src/utils/alert';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from '@/src/utils/storage';
import { api, API_BASE_URL } from '../../src/api/api';
import { useCartStore, CartItem } from '../../src/store/cartStore';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';

// Habilitar animaciones de layout en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Estado vacío cinematográfico ─────────────────────────────────────────────
function EmptyCartState({ onGoToMenu }: { onGoToMenu: () => void }) {
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#000' }}>
      {/* Imagen de fondo tentadora */}
      <Image
        source={require('../../assets/images/menu/banner.jpg')}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
        style={{ opacity: 0.5 }}
      />
      {/* Overlay degradado desde abajo */}
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
            <FontAwesome name="shopping-bag" size={42} color="#EAB308" />
          </Animated.View>
        </Animated.View>

        <Text className="text-white text-[32px] font-black tracking-tighter text-center mb-3">
          Tu bolsa está{'\n'}
          <Text className="text-yellow-500">esperando.</Text>
        </Text>
        <Text className="text-neutral-500 text-[13px] text-center font-medium leading-6 mb-12">
          Arma tu pedido perfecto desde el menú{'\n'}y dale ese gustito que mereces.
        </Text>
        
        {/* Botón brillante */}
        <TouchableOpacity
          onPress={onGoToMenu}
          activeOpacity={0.85}
          style={{
            borderRadius: 26, overflow: 'hidden',
            shadowColor: '#EAB308', shadowOpacity: 0.6, shadowRadius: 25, elevation: 15,
            width: '100%'
          }}
        >
          <LinearGradient
            colors={['#FDE047', '#EAB308', '#CA8A04']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 }}
          >
            <FontAwesome name="cutlery" size={16} color="#000" />
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 3, marginLeft: 12, textTransform: 'uppercase' }}>
              Ver Menú Completo
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  
  const [isDelivery, setIsDelivery] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderAddress, setOrderAddress] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  
  // --- SISTEMA DE PUNTOS ---
  const [userPoints, setUserPoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  
  // --- LAJAMBRE CLUB COLAPSABLE ---
  const [clubExpanded, setClubExpanded] = useState(false);

  const toggleClub = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setClubExpanded(prev => !prev);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchUserProfile = async () => {
        try {
          const token = await SecureStore.getItemAsync('userToken');
          if (token) {
            const profileRes = await api.get('/auth/perfil');
            setOrderAddress(profileRes.data.usuario.address || '');
            setOrderPhone(profileRes.data.usuario.phone || '');
            const rewardsRes = await api.get('/auth/recompensas');
            setUserPoints(rewardsRes.data.puntosActuales || 0);
          }
        } catch (error) {
          console.log("Error cargando datos en el carrito:", error);
        }
      };
      fetchUserProfile();
    }, [])
  );

  const getItemTotalPrice = (item: CartItem) => {
    const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
    return item.price + extrasTotal;
  };

  // --- CÁLCULO DINÁMICO DE DESCUENTOS ---
  let totalAmount = items.reduce((sum, item) => sum + (getItemTotalPrice(item) * item.quantity), 0);
  let deliveryCost = isDelivery ? 1800 : 0;
  let rewardDiscount = 0;
  const hasBurger = items.some(item => item.price >= 5000);

  if (selectedReward === 'DELIVERY_GRATIS') {
    deliveryCost = 0;
  } else if (selectedReward === 'BEBIDA_GRATIS') {
    rewardDiscount = 1200;
  } else if (selectedReward === 'BURGER_GRATIS' && hasBurger) {
    rewardDiscount = 8490;
  } else if (selectedReward === 'BURGER_GRATIS' && !hasBurger) {
    setSelectedReward(null);
    Toast.show({ type: 'error', text1: 'Aviso', text2: 'Debes tener al menos una hamburguesa en el carrito para usar este premio.' });
  }

  let finalTotal = totalAmount + deliveryCost - rewardDiscount;
  if (finalTotal < 0) finalTotal = 0;

  const REWARD_OPTIONS = [
    { id: 'QUESO_GRATIS', name: 'Queso Extra', points: 50, emoji: '🧀', desc: '50 pts' },
    { id: 'TOCINO_GRATIS', name: 'Tocino Extra', points: 80, emoji: '🥓', desc: '80 pts' },
    { id: 'BEBIDA_GRATIS', name: 'Bebida Gratis', points: 150, emoji: '🥤', desc: '150 pts' },
    { id: 'DELIVERY_GRATIS', name: 'Delivery Gratis', points: 200, emoji: '🛵', desc: '200 pts' },
    { id: 'PAPAS_GRATIS', name: 'Papas Rústicas', points: 250, emoji: '🍟', desc: '250 pts' },
    { id: 'CARNE_EXTRA', name: 'Doble Carne', points: 350, emoji: '🥩', desc: '350 pts' },
    { id: 'DOS_BEBIDAS', name: '2 Bebidas Gratis', points: 350, emoji: '🧊', desc: '350 pts' },
    { id: 'UPGRADE_BURGER', name: 'Upgrade Premium', points: 450, emoji: '⭐', desc: '450 pts' },
    { id: 'DOS_POR_UNO', name: 'Promo 2x1', points: 600, emoji: '🍔', desc: '600 pts' },
    { id: 'BURGER_GRATIS', name: 'Burger Gratis', points: 800, emoji: '🍔', desc: '800 pts' }
  ];

  const handleRewardSelection = (rewardId: string, requiredPoints: number) => {
    if (userPoints < requiredPoints) {
      Toast.show({ type: 'error', text1: 'Puntos Insuficientes', text2: `Necesitas ${requiredPoints} pts. Tienes ${userPoints} pts.` });
      return;
    }
    if (selectedReward === rewardId) {
      setSelectedReward(null);
    } else {
      setSelectedReward(rewardId);
    }
  };

  const handleOpenCheckout = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      showAlert('Identifícate', 'Inicia sesión para continuar con tu pedido.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir al Login', onPress: () => router.push('/(auth)/login') }
      ]);
      return;
    }
    setShowModal(true);
  };

  const confirmOrder = async () => {
    if (isDelivery && !orderAddress) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Por favor ingresa una dirección de entrega.' });
      return;
    }
    if (!orderPhone || orderPhone.length < 9) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Por favor ingresa un teléfono válido (ej: +56945564917).' });
      return;
    }

    setIsProcessing(true);
    try {
      const orderPayload = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          extraIds: item.extras?.map(e => e.id) || []
        })),
        deliveryAddress: isDelivery ? orderAddress : 'Retiro en Local',
        contactPhone: orderPhone,
        ...(selectedReward && { rewardType: selectedReward })
      };
      
      const orderResponse = await api.post('/orders', orderPayload);
      const newOrderId = orderResponse.data.id;
      setShowModal(false);
      // NO limpiamos el carrito aquí: esperamos a confirmar que el pago se inició

      const payResponse = await api.post(`/orders/${newOrderId}/pay`);

      // Pedido pagado 100% con puntos (sin pasar por pasarela)
      if (payResponse.data.is_free) {
        clearCart();
        showAlert(
          '¡Pedido Gratis! 🎉',
          'Tu pedido fue pagado completamente con tus puntos de recompensa.',
          [{ text: 'Ver mis pedidos', onPress: () => router.replace('/(client)/orders') }]
        );
        return;
      }

      // Abrir Checkout Pro de Mercado Pago en el navegador
      const checkoutUrl = payResponse.data.checkout_url;
      clearCart(); // Limpiamos el carrito justo antes de abrir MP
      await WebBrowser.openBrowserAsync(checkoutUrl);

      // Al volver a la app, llevar al usuario a sus pedidos
      router.replace('/(client)/orders');

    } catch (error: any) {
      console.error('Error en el flujo de pago:', error);
      const msg = error.response?.data?.message || 'Error al procesar el pedido o conectar con Mercado Pago';
      Toast.show({ type: 'error', text1: 'Error', text2: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER: ESTADO VACÍO CINEMATOGRÁFICO
  // ─────────────────────────────────────────────
  if (items.length === 0) {
    return <EmptyCartState onGoToMenu={() => router.push('/(client)')} />;
  }

  // ─────────────────────────────────────────────
  // RENDER: ESTADO LLENO
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#060606' }} edges={['left', 'right']}>
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        
        <View className="flex-row items-center mb-6">
          <Text className="text-white text-[28px] font-black uppercase tracking-tight">Tu Pedido</Text>
          <View className="flex-1 h-[2px] bg-yellow-500 ml-4 rounded-full opacity-50" />
        </View>

        {/* ── Selector Delivery / Retiro ── */}
        <View className="flex-row bg-[#111] rounded-[20px] p-1.5 mb-8 border border-white/5">
          <TouchableOpacity
            onPress={() => setIsDelivery(true)}
            className={`flex-1 py-3.5 rounded-2xl flex-row justify-center items-center ${isDelivery ? 'bg-yellow-500' : ''}`}
          >
            <FontAwesome name="motorcycle" size={16} color={isDelivery ? 'black' : '#525252'} />
            <Text className={`ml-2 font-black uppercase tracking-wider text-[11px] ${isDelivery ? 'text-black' : 'text-neutral-500'}`}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsDelivery(false)}
            className={`flex-1 py-3.5 rounded-2xl flex-row justify-center items-center ${!isDelivery ? 'bg-yellow-500' : ''}`}
          >
            <FontAwesome name="shopping-bag" size={16} color={!isDelivery ? 'black' : '#525252'} />
            <Text className={`ml-2 font-black uppercase tracking-wider text-[11px] ${!isDelivery ? 'text-black' : 'text-neutral-500'}`}>Retiro Local</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tarjetas de Productos (estilo banner) ── */}
        {items.map((item) => (
          <View
            key={item.cartItemId}
            className="mb-4 rounded-[24px] overflow-hidden border border-white/5"
            style={{
              backgroundColor: '#111',
              shadowColor: '#EAB308',
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            {/* Foto grande tipo banner */}
            <View className="relative h-28">
              <Image
                source={item.image ? { uri: item.image.startsWith('/') ? API_BASE_URL + item.image : item.image } : require('../../assets/images/menu/bbq.jpg')}
                className="w-full h-full"
                resizeMode="cover"
              />
              {/* Overlay oscuro desde abajo */}
              <View className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
              {/* Precio badge */}
              <View className="absolute top-3 right-3 bg-black/80 px-3 py-1.5 rounded-xl border border-yellow-500/30">
                <Text className="text-yellow-500 font-black text-[12px] tracking-wider">
                  ${getItemTotalPrice(item).toLocaleString('es-CL')}
                </Text>
              </View>
            </View>

            {/* Info y controles */}
            <View className="px-4 py-3 flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <Text className="text-white font-black uppercase text-sm tracking-tight" numberOfLines={1}>{item.name}</Text>
                {item.extras && item.extras.length > 0 && (
                  <View className="flex-row flex-wrap mt-1">
                    {item.extras.map(e => (
                      <View key={e.id} className="bg-white/5 rounded-full px-2 py-0.5 mr-1 mt-0.5">
                        <Text className="text-neutral-400 text-[9px] uppercase font-bold">+{e.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Controles cantidad */}
              <View className="flex-row items-center bg-black border border-white/5 rounded-xl overflow-hidden">
                <TouchableOpacity
                  onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                  className="w-9 h-9 items-center justify-center"
                >
                  <FontAwesome name="minus" size={9} color="#A3A3A3" />
                </TouchableOpacity>
                <Text className="text-white font-black text-[13px] w-7 text-center">{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                  className="w-9 h-9 items-center justify-center"
                >
                  <FontAwesome name="plus" size={9} color="#EAB308" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* ── LAJAMBRE CLUB (COLAPSABLE) ── */}
        <View
          className="mt-6 mb-8 rounded-[28px] overflow-hidden border border-yellow-500/10"
          style={{ backgroundColor: '#000' }}
        >
          {/* Header del acordeón */}
          <TouchableOpacity
            onPress={toggleClub}
            activeOpacity={0.8}
            className="px-5 py-5 flex-row justify-between items-center z-10"
          >
            <View className="flex-row items-center">
              <Text className="text-[26px] mr-3">👑</Text>
              <View>
                <Text className="text-white font-black uppercase tracking-widest text-[15px] mb-0.5">Lajambre Club</Text>
                {selectedReward ? (
                  <Text className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">
                    Premio Activo: {REWARD_OPTIONS.find(r => r.id === selectedReward)?.name}
                  </Text>
                ) : (
                  <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                    Tienes {userPoints} pts para canjear
                  </Text>
                )}
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
              <FontAwesome name={clubExpanded ? 'chevron-up' : 'chevron-down'} size={12} color="#A3A3A3" />
            </View>
          </TouchableOpacity>

          {/* Cuerpo desplegable */}
          {clubExpanded && (
            <View className="px-5 pb-6 pt-2 border-t border-white/5 z-10">
              <View style={{ gap: 12, marginTop: 8 }}>
                {REWARD_OPTIONS.filter(r => r.points <= userPoints).length > 0 ? (
                  REWARD_OPTIONS.filter(r => r.points <= userPoints).map((reward) => {
                    const isSelected = selectedReward === reward.id;

                    return (
                      <TouchableOpacity
                        key={reward.id}
                        onPress={() => handleRewardSelection(reward.id, reward.points)}
                        activeOpacity={0.8}
                        className="flex-row items-center p-4 rounded-2xl"
                        style={{ 
                          backgroundColor: isSelected ? 'rgba(234,179,8,0.1)' : '#0A0A0A',
                          borderWidth: 1,
                          borderColor: isSelected ? '#EAB308' : 'rgba(255,255,255,0.08)'
                        }}
                      >
                        {/* Círculo del Emoji */}
                        <View 
                          className="w-12 h-12 rounded-full items-center justify-center mr-4"
                          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                        >
                          <Text className="text-[24px]">{reward.emoji}</Text>
                        </View>

                        {/* Info principal */}
                        <View className="flex-1 border-r border-dashed border-white/10 pr-4 mr-4">
                          <Text className={`font-black uppercase tracking-wider text-[13px] ${isSelected ? 'text-yellow-500' : 'text-white'}`}>
                            {reward.name}
                          </Text>
                          <Text className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isSelected ? 'text-yellow-500/80' : 'text-neutral-500'}`}>
                            {isSelected ? '💎 RECOMPENSA ACTIVA' : '✨ DESBLOQUEADO'}
                          </Text>
                        </View>

                        {/* Puntos (Ticket Stub) */}
                        <View className="items-center justify-center min-w-[45px]">
                          <Text className={`font-black text-[16px] ${isSelected ? 'text-yellow-500' : 'text-white'}`}>
                            {reward.points}
                          </Text>
                          <Text className={`font-black text-[9px] uppercase tracking-widest mt-0.5 ${isSelected ? 'text-yellow-500/70' : 'text-neutral-600'}`}>
                            Pts
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View className="items-center py-6 px-4">
                    <Text className="text-neutral-500 font-bold uppercase text-[11px] tracking-widest text-center leading-5">
                      Aún no te alcanzan los puntos para canjear premios.{'\n'}
                      <Text className="text-yellow-500">¡Sigue comprando para ganar más!</Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ── Resumen Final (Estilo Receipt de Lujo) ── */}
        <View
          className="rounded-[24px] border border-white/5 mb-36 overflow-hidden"
          style={{ backgroundColor: '#111' }}
        >
          {/* Header del receipt */}
          <View className="px-6 pt-5 pb-4 border-b border-white/5">
            <Text className="text-neutral-500 font-black uppercase text-[10px] tracking-[0.2em]">Resumen del Pedido</Text>
          </View>

          <View className="px-6 pt-4 pb-2">
            {/* Fila Subtotal */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-neutral-500 text-[12px] font-bold uppercase tracking-wider">Subtotal</Text>
              <Text className="text-white font-black text-[13px]">${totalAmount.toLocaleString('es-CL')}</Text>
            </View>

            {/* Fila Delivery */}
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Text className="text-neutral-500 text-[12px] font-bold uppercase tracking-wider">Delivery</Text>
                {selectedReward === 'DELIVERY_GRATIS' && (
                  <View className="ml-2 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                    <Text className="text-yellow-500 text-[8px] font-black uppercase">Gratis</Text>
                  </View>
                )}
              </View>
              <Text className={`font-black text-[13px] ${selectedReward === 'DELIVERY_GRATIS' ? 'text-yellow-500 line-through opacity-50' : 'text-white'}`}>
                ${(1800).toLocaleString('es-CL')}
              </Text>
            </View>

            {/* Fila descuento premio */}
            {rewardDiscount > 0 && (
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-yellow-500 text-[12px] font-bold uppercase tracking-wider">Premio Club</Text>
                <Text className="text-yellow-500 font-black text-[13px]">-${rewardDiscount.toLocaleString('es-CL')}</Text>
              </View>
            )}
          </View>

          {/* Separador punteado estilo receipt */}
          <View className="mx-6 flex-row items-center my-1">
            {Array.from({ length: 30 }).map((_, i) => (
              <View key={i} className="flex-1 h-[1px] mx-0.5 bg-white/10" />
            ))}
          </View>

          {/* Total */}
          <View className="px-6 pt-4 pb-6 flex-row justify-between items-end">
            <View>
              <Text className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-1">Total a Pagar</Text>
              <Text className="text-white font-black text-[13px]">
                {isDelivery ? 'Incluye delivery' : 'Retiro en local'}
              </Text>
            </View>
            <Text className="text-yellow-500 font-black text-[30px] tracking-tighter">
              ${finalTotal.toLocaleString('es-CL')}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Botón Flotante Ir a Pagar ── */}
      <View
        className="absolute bottom-0 w-full px-5 pb-6 pt-4 border-t border-white/5"
        style={{ backgroundColor: 'rgba(6,6,6,0.95)' }}
      >
        <TouchableOpacity
          onPress={handleOpenCheckout}
          activeOpacity={0.85}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#EAB308',
            shadowOpacity: 0.6,
            shadowRadius: 25,
            elevation: 15,
          }}
        >
          <LinearGradient
            colors={['#FDE047', '#EAB308', '#CA8A04']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 }}
          >
            <View>
              <Text className="text-black font-black uppercase tracking-widest text-[16px]">Ir a Pagar</Text>
              <Text className="text-black/60 text-[10px] font-black uppercase tracking-widest mt-0.5">
                {items.reduce((t, i) => t + i.quantity, 0)} producto{items.reduce((t, i) => t + i.quantity, 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text className="text-black font-black text-[20px] tracking-tighter">${finalTotal.toLocaleString('es-CL')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Modal Confirmar Datos ── */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/90">
          <View className="bg-[#111] rounded-t-[32px] p-6 border-t border-white/10">
            <View className="flex-row justify-between items-center mb-6 mt-2">
              <Text className="text-white text-[22px] font-black uppercase tracking-tight">Confirmar Datos</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} className="bg-black p-2.5 rounded-full border border-white/5">
                <FontAwesome name="close" size={16} color="#A3A3A3" />
              </TouchableOpacity>
            </View>

            {isDelivery && (
              <View className="mb-5">
                <Text className="text-neutral-500 font-black mb-2.5 uppercase text-[10px] tracking-widest">Dirección de Entrega</Text>
                <TextInput
                  value={orderAddress}
                  onChangeText={setOrderAddress}
                  placeholder="Ej: Calle Los Alerces 123, Laja"
                  placeholderTextColor="#525252"
                  className="bg-[#000] border border-white/5 text-white p-4 rounded-2xl font-bold"
                />
              </View>
            )}

            <View className="mb-8">
              <Text className="text-neutral-500 font-black mb-2.5 uppercase text-[10px] tracking-widest">Teléfono de Contacto</Text>
              <TextInput
                value={orderPhone}
                onChangeText={setOrderPhone}
                keyboardType="phone-pad"
                placeholder="+569..."
                maxLength={12} // <- Limitamos a 12 caracteres (ej: +56945564917)
                placeholderTextColor="#525252"
                className="bg-[#000] border border-white/5 text-white p-4 rounded-2xl font-bold"
              />
            </View>

            <TouchableOpacity
              onPress={confirmOrder}
              disabled={isProcessing}
              className="bg-yellow-500 py-5 rounded-[20px] items-center active:bg-yellow-600 mb-2"
              style={{ shadowColor: '#EAB308', shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 }}
            >
              {isProcessing ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-black uppercase text-lg tracking-widest">
                  Pagar • ${finalTotal.toLocaleString('es-CL')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
