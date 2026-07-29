import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Image, Animated, Dimensions, Easing, StyleSheet
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from '@/src/utils/storage';
import { api, clearSession } from '../../src/api/api';
import { useCartStore } from '../../src/store/cartStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

// Mapeo de nombres de premios a íconos FontAwesome (aproximación)
const getRewardIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('queso')) return { name: 'certificate', color: '#FACC15' };
  if (n.includes('tocino')) return { name: 'fire', color: '#EF4444' };
  if (n.includes('bebida')) return { name: 'glass', color: '#60A5FA' };
  if (n.includes('delivery') || n.includes('envío')) return { name: 'motorcycle', color: '#34D399' };
  if (n.includes('papas') || n.includes('fries')) return { name: 'archive', color: '#F59E0B' };
  if (n.includes('carne')) return { name: 'plus-circle', color: '#DC2626' };
  if (n.includes('premium') || n.includes('upgrade')) return { name: 'star', color: '#EAB308' };
  if (n.includes('promo') || n.includes('2x1')) return { name: 'copy', color: '#A855F7' };
  if (n.includes('burger') || n.includes('hamburguesa')) return { name: 'cutlery', color: '#F97316' };
  return { name: 'gift', color: '#EC4899' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta VIP Flotante con Reflejo (Glare)
// ─────────────────────────────────────────────────────────────────────────────
function VIPCard({ profile, rewardsData, tierColor, tierLabel }: any) {
  const { width: W } = useWindowDimensions();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glareAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de flotación suave
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Animación del reflejo pasando por la tarjeta cada cierto tiempo
    Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(glareAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(glareAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(4000),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const glareTranslateX = glareAnim.interpolate({ inputRange: [0, 1], outputRange: [-W, W * 1.5] });

  const pts = rewardsData?.puntosActuales ?? 0;
  const name = profile?.nombre ?? profile?.email?.split('@')[0] ?? 'Lajambre VIP';

  return (
    <Animated.View style={{ transform: [{ translateY }], marginHorizontal: 20, marginTop: 10, marginBottom: 30 }}>
      {/* Sombra de la tarjeta */}
      <View style={{
        position: 'absolute', top: 20, left: 10, right: 10, bottom: -10,
        backgroundColor: tierColor, opacity: 0.15, borderRadius: 20,
        shadowColor: tierColor, shadowOpacity: 1, shadowRadius: 20, elevation: 10
      }} />

      {/* Contenedor Principal de la Tarjeta (Relación de aspecto 1.6:1 tipo tarjeta de crédito) */}
      <View style={{
        width: '100%', aspectRatio: 1.58, borderRadius: 24, overflow: 'hidden',
        borderWidth: 1, borderColor: tierColor + '40',
        backgroundColor: '#111',
      }}>
        <Image
          source={require('../../assets/images/menu/banner.jpg')}
          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15 }}
          resizeMode="cover"
        />
        
        {/* Gradiente principal encima de la imagen para oscurecer y dar color */}
        <LinearGradient
          colors={['rgba(20,20,20,0.8)', 'rgba(0,0,0,0.95)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* Círculo de luz detrás del texto */}
        <View style={{
          position: 'absolute', top: -50, right: -50, width: 200, height: 200,
          borderRadius: 100, backgroundColor: tierColor, opacity: 0.1,
          shadowColor: tierColor, shadowOpacity: 1, shadowRadius: 50, elevation: 10
        }} />

        {/* Contenido de la Tarjeta */}
        <View style={{ flex: 1, padding: 22, justifyContent: 'space-between' }}>
          
          {/* Header de la tarjeta */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 }}>LAJAMBRE</Text>
              <Text style={{ color: tierColor, fontSize: 8, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase', marginTop: 2 }}>Club Member</Text>
            </View>
            <View style={{
              backgroundColor: tierColor + '20', paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 12, borderWidth: 1, borderColor: tierColor + '40'
            }}>
              <Text style={{ color: tierColor, fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
                {tierLabel}
              </Text>
            </View>
          </View>

          {/* Body / Footer de la tarjeta */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ color: '#888', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                Titular
              </Text>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                {name}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: tierColor, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: -2 }}>
                Puntos
              </Text>
              <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1 }}>
                {pts.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Reflejo de luz (Glare) pasando por encima */}
        <Animated.View style={{
          position: 'absolute', top: 0, bottom: 0, width: 100,
          transform: [{ translateX: glareTranslateX }, { skewX: '-20deg' }],
        }}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: '100%', height: '100%' }}
          />
        </Animated.View>

      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pantalla Principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { width: W } = useWindowDimensions();
  const router = useRouter();
  const [profile, setProfile]     = useState<any>(null);
  const [rewardsData, setRewards] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) { router.replace('/(auth)/login'); return; }
      const [pRes, rRes] = await Promise.all([api.get('/auth/perfil'), api.get('/auth/recompensas')]);
      setProfile(pRes.data.usuario);
      setRewards(rRes.data);
    } catch (error: any) {
      if (error.response?.status === 401) { await clearSession(); router.replace('/(auth)/login'); }
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleLogout = async () => {
    useCartStore.getState().clearCart();
    await clearSession();
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  const nextReward      = rewardsData?.recompensas.find((r: any) => !r.alcanzado);
  const progressPct     = nextReward ? Math.min((rewardsData.puntosActuales / nextReward.puntosRequeridos) * 100, 100) : 100;
  
  // Colores mejorados y vibrantes para los Tiers
  const isGold          = rewardsData?.nivelActual?.includes('Oro');
  const isSilver        = rewardsData?.nivelActual?.includes('Plata');
  // Usamos un dorado intenso, un plateado brillante, o un cobre/bronce cálido (no naranja fosforescente)
  const tierColor       = isGold ? '#FACC15' : isSilver ? '#94A3B8' : '#D97706'; 
  const tierLabel       = rewardsData?.nivelActual ?? 'Bronce';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      
      {/* ── Fondo Global de la Pantalla ── */}
      <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}>
        <Image
          source={require('../../assets/images/menu/banner.jpg')}
          style={{ width: '100%', height: '100%', opacity: 0.6 }}
          resizeMode="cover"
        />
        <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.65)' }} />
      </View>

      {/* ── Brillo de fondo global ── */}
      <View style={{
        position: 'absolute', top: -100, left: -100, width: W, height: W,
        borderRadius: W/2, backgroundColor: tierColor, opacity: 0.05,
        shadowColor: tierColor, shadowOpacity: 1, shadowRadius: 100, elevation: 10
      }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={tierColor} />}
        contentContainerStyle={{ paddingTop: 20 }}
      >

        {/* Título de la sección oculta o pequeña */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 }}>Mi Perfil</Text>
          {/* Línea bonita con degradado hacia transparente */}
          <LinearGradient
            colors={[tierColor + '80', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flex: 1, height: 2, marginLeft: 16, borderRadius: 1 }}
          />
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 8, paddingHorizontal: 12,
              backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12,
              borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
              marginLeft: 16,
            }}
          >
            <FontAwesome name="sign-out" size={14} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 6 }}>
              Cerrar Sesión
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════
            TARJETA VIP FLOTANTE
        ═══════════════════════════════════════════════ */}
        <VIPCard profile={profile} rewardsData={rewardsData} tierColor={tierColor} tierLabel={tierLabel} />

        {/* ═══════════════════════════════════════════════
            BARRA DE PROGRESO (NEXT REWARD)
        ═══════════════════════════════════════════════ */}
        {nextReward && (
          <View style={{ paddingHorizontal: 24, marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
              <Text style={{ color: '#888', fontSize: 11, fontWeight: '700' }}>
                Faltan <Text style={{ color: tierColor, fontWeight: '900' }}>{nextReward.faltan} pts</Text> para
              </Text>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                {nextReward.nombre}
              </Text>
            </View>
            <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <LinearGradient
                colors={[tierColor, tierColor + '80']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: `${progressPct}%`, height: '100%', borderRadius: 3 }}
              />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════
            PREMIOS GLASSMORPHIC
        ═══════════════════════════════════════════════ */}
        <View style={{ marginBottom: 36 }}>
          <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>
              PREMIOS
            </Text>
            <LinearGradient
              colors={[tierColor + '80', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flex: 1, height: 2, marginLeft: 16, borderRadius: 1 }}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            {rewardsData?.recompensas?.map((premio: any, idx: number) => {
              const unlocked = premio.alcanzado;
              const iconData = getRewardIcon(premio.nombre);
              
              return (
                <View key={premio.id} style={{
                  width: 130, marginRight: 16, borderRadius: 20, overflow: 'hidden',
                  backgroundColor: unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
                  borderWidth: 1, borderColor: unlocked ? iconData.color + '40' : 'rgba(255,255,255,0.03)',
                }}>
                  {unlocked && (
                    <LinearGradient
                      colors={[iconData.color + '15', 'transparent']}
                      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                      style={{ position: 'absolute', width: '100%', height: '100%' }}
                    />
                  )}
                  
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <View style={{
                      width: 48, height: 48, borderRadius: 24, marginBottom: 12,
                      backgroundColor: unlocked ? iconData.color + '20' : iconData.color + '08',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FontAwesome
                        name={iconData.name as any}
                        size={20}
                        color={unlocked ? iconData.color : iconData.color + '80'}
                      />
                    </View>

                    <Text style={{
                      color: unlocked ? '#fff' : '#666',
                      fontWeight: '800', fontSize: 10, textAlign: 'center',
                      textTransform: 'uppercase', letterSpacing: 1, minHeight: 28,
                    }} numberOfLines={2}>
                      {premio.nombre}
                    </Text>

                    <View style={{
                      marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                      backgroundColor: unlocked ? tierColor : 'rgba(255,255,255,0.03)',
                    }}>
                      <Text style={{
                        fontWeight: '900', fontSize: 9, letterSpacing: 1,
                        color: unlocked ? '#000' : '#555',
                      }}>
                        {premio.puntosRequeridos} PTS
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ═══════════════════════════════════════════════
            MOVIMIENTOS MINIMALISTAS
        ═══════════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>
              HISTORIAL
            </Text>
            <LinearGradient
              colors={[tierColor + '80', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flex: 1, height: 2, marginLeft: 16, borderRadius: 1 }}
            />
          </View>

          <View style={{
            backgroundColor: '#0a0a0a', borderRadius: 24,
            borderWidth: 1.5, borderColor: tierColor + '25',
            shadowColor: tierColor, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8
          }}>
            {rewardsData?.historial?.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <FontAwesome name="file-text-o" size={24} color="#333" />
                <Text style={{ color: '#555', fontSize: 11, fontWeight: '700', marginTop: 12, letterSpacing: 1 }}>NO HAY MOVIMIENTOS</Text>
              </View>
            ) : (
              rewardsData?.historial?.map((tx: any, index: number) => {
                const isEarned   = tx.tipo === 'EARNED';
                const isRedeemed = tx.tipo === 'REDEEMED';
                const txColor    = isEarned ? '#10B981' : isRedeemed ? '#3B82F6' : '#EF4444';
                const txIcon     = isEarned ? 'plus' : isRedeemed ? 'gift' : 'minus';
                
                return (
                  <View key={tx.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: txColor + '15', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <FontAwesome name={txIcon} size={12} color={txColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                          {isEarned ? 'Compra en Local' : isRedeemed ? 'Canje de Premio' : 'Puntos Expirados'}
                        </Text>
                        <Text style={{ color: '#666', fontSize: 10, marginTop: 2 }}>
                          {new Date(tx.fecha).toLocaleDateString('es-CL')}
                        </Text>
                      </View>
                      <Text style={{ color: txColor, fontSize: 16, fontWeight: '900' }}>
                        {isEarned ? '+' : ''}{tx.puntos}
                      </Text>
                    </View>
                    {index < rewardsData.historial.length - 1 && (
                      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 16 }} />
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
