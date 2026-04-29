import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../src/api/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [rewardsData, setRewardsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Hacemos ambas peticiones en paralelo para que cargue más rápido
      const [profileRes, rewardsRes] = await Promise.all([
        api.get('/auth/perfil'),
        api.get('/auth/recompensas')
      ]);
      setProfile(profileRes.data.usuario);
      setRewardsData(rewardsRes.data);
    } catch (error) {
      console.error("Error al cargar perfil o recompensas:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userRole');
    delete api.defaults.headers.common['Authorization'];
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  // Lógica para la Barra de Progreso
  // Buscamos la primera recompensa que AÚN NO ha sido alcanzada
  const nextReward = rewardsData?.recompensas.find((r: any) => !r.alcanzado);
  
  // Calculamos el porcentaje (si ya alcanzó todo, es 100%)
  const progressPercentage = nextReward 
    ? Math.min((rewardsData.puntosActuales / nextReward.puntosRequeridos) * 100, 100) 
    : 100;

  // Colores dinámicos según el nivel
  const isGold = rewardsData?.nivelActual?.includes('Oro');
  const isSilver = rewardsData?.nivelActual?.includes('Plata');
  const cardBorderColor = isGold ? 'border-yellow-400' : isSilver ? 'border-gray-400' : 'border-orange-500/50';
  const cardShadow = isGold ? 'shadow-yellow-500/30' : isSilver ? 'shadow-gray-400/20' : 'shadow-orange-500/10';

  return (
    <View className="flex-1 bg-black">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor="#EAB308" />}
      >
        
        {/* 👤 CABECERA DE USUARIO */}
        <View className="px-6 pt-8 pb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-black uppercase tracking-widest">Mi Perfil</Text>
            <Text className="text-neutral-500 font-bold text-xs">{profile?.email}</Text>
          </View>
          <View className="w-12 h-12 bg-neutral-900 rounded-full border border-neutral-800 items-center justify-center">
            <FontAwesome name="user" size={20} color="#EAB308" />
          </View>
        </View>

        {/* 💳 TARJETA DE MEMBRESÍA (THE GOLDEN CARD) */}
        <View className={`mx-5 my-4 bg-neutral-900 border ${cardBorderColor} rounded-3xl p-6 shadow-xl ${cardShadow} relative overflow-hidden`}>
          {/* Brillo decorativo de fondo */}
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl" />
          
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-1">Membresía Lajambre</Text>
              <Text className={`text-lg font-black uppercase tracking-wider ${isGold ? 'text-yellow-400' : isSilver ? 'text-gray-300' : 'text-orange-400'}`}>
                {rewardsData?.nivelActual}
              </Text>
            </View>
            <FontAwesome name="star" size={24} color={isGold ? '#FACC15' : isSilver ? '#D1D5DB' : '#F97316'} />
          </View>
          
          <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Saldo Disponible</Text>
          <View className="flex-row items-baseline mt-1 mb-6">
            <Text className="text-white text-5xl font-black">{rewardsData?.puntosActuales || 0}</Text>
            <Text className="text-yellow-500 font-bold ml-2 uppercase text-xs">pts</Text>
          </View>

          {/* 🚀 BARRA DE PROGRESO HACIA LA SIGUIENTE RECOMPENSA */}
          <View className="bg-black/50 p-4 rounded-2xl border border-neutral-800">
            {nextReward ? (
              <>
                <View className="flex-row justify-between items-end mb-2">
                  <Text className="text-neutral-300 text-xs font-bold">
                    Faltan <Text className="text-yellow-500 font-black">{nextReward.faltan} pts</Text> para:
                  </Text>
                  <Text className="text-white font-black text-xs uppercase">{nextReward.icono} {nextReward.nombre}</Text>
                </View>
                {/* Barra de fondo */}
                <View className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  {/* Barra de llenado dinámica */}
                  <View 
                    className="h-full bg-yellow-500 rounded-full" 
                    style={{ width: `${progressPercentage}%` }} 
                  />
                </View>
              </>
            ) : (
              <Text className="text-yellow-500 font-black text-center text-xs uppercase tracking-widest">¡Has desbloqueado todos los premios!</Text>
            )}
          </View>
        </View>

        {/* 🎁 CATÁLOGO DE RECOMPENSAS (Carrusel Horizontal) */}
        <View className="mt-4 mb-8">
          <View className="px-6 mb-4 flex-row items-center">
            <View className="h-4 w-1 bg-yellow-500 mr-2 rounded-full" />
            <Text className="text-white text-lg font-bold uppercase tracking-widest">Premios Disponibles</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5">
            {rewardsData?.recompensas?.map((premio: any) => (
              <View 
                key={premio.id} 
                className={`w-36 p-4 rounded-2xl mr-4 border ${premio.alcanzado ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-neutral-900 border-neutral-800'}`}
              >
                <Text className="text-2xl mb-2">{premio.icono}</Text>
                <Text className="text-white font-black uppercase text-xs mb-1 h-8" numberOfLines={2}>{premio.nombre}</Text>
                <View className={`px-2 py-1 rounded mt-2 self-start ${premio.alcanzado ? 'bg-yellow-500' : 'bg-neutral-800'}`}>
                  <Text className={`text-[10px] font-black uppercase ${premio.alcanzado ? 'text-black' : 'text-neutral-500'}`}>
                    {premio.puntosRequeridos} pts
                  </Text>
                </View>
              </View>
            ))}
            <View className="w-5" />
          </ScrollView>
        </View>

        {/* 🕒 HISTORIAL DE MOVIMIENTOS */}
        <View className="px-5 mb-8">
          <View className="mb-4 flex-row items-center">
            <View className="h-4 w-1 bg-neutral-500 mr-2 rounded-full" />
            <Text className="text-white text-lg font-bold uppercase tracking-widest">Movimientos</Text>
          </View>
          
          <View className="bg-neutral-900 rounded-3xl p-5 border border-neutral-800">
            {rewardsData?.historial?.length === 0 ? (
              <View className="items-center py-4">
                <FontAwesome name="history" size={30} color="#404040" />
                <Text className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-3">Sin movimientos</Text>
              </View>
            ) : (
              rewardsData?.historial?.map((tx: any, index: number) => {
                const isEarned = tx.tipo === 'EARNED';
                const isRedeemed = tx.tipo === 'REDEEMED';
                
                return (
                  <View key={tx.id}>
                    <View className="flex-row items-center justify-between py-3">
                      <View className="flex-row items-center flex-1">
                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isEarned ? 'bg-green-500/10 border border-green-500/20' : isRedeemed ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                          <FontAwesome name={isEarned ? "arrow-up" : isRedeemed ? "gift" : "calendar-times-o"} size={14} color={isEarned ? "#22C55E" : isRedeemed ? "#3B82F6" : "#EF4444"} />
                        </View>
                        <View className="flex-1 pr-2">
                          <Text className="text-neutral-200 font-bold text-sm uppercase tracking-wide" numberOfLines={1}>
                            {isEarned ? 'Puntos Ganados' : isRedeemed ? 'Premio Canjeado' : 'Puntos Vencidos'}
                          </Text>
                          <Text className="text-neutral-500 text-[10px] font-bold mt-0.5">
                            {new Date(tx.fecha).toLocaleDateString('es-CL')}
                          </Text>
                        </View>
                      </View>
                      <Text className={`font-black text-base ${isEarned ? 'text-green-500' : isRedeemed ? 'text-blue-500' : 'text-red-500'}`}>
                        {isEarned ? '+' : ''}{tx.puntos}
                      </Text>
                    </View>
                    {/* Línea divisoria excepto en el último */}
                    {index < rewardsData.historial.length - 1 && <View className="h-[1px] w-full bg-neutral-800" />}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* 🚪 BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="mx-5 mb-20 bg-neutral-900 border border-red-500/20 py-4 rounded-2xl flex-row justify-center items-center"
        >
          <FontAwesome name="sign-out" size={16} color="#EF4444" />
          <Text className="text-red-500 font-black uppercase ml-3 tracking-widest text-sm">Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}