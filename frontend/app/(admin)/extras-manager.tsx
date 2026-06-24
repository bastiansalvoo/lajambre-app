import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/api';

export default function ExtrasManagerScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // 1. Obtener la lista de Extras
  const { data: extras, isLoading: loadingExtras } = useQuery({
    queryKey: ['admin-extras'],
    queryFn: async () => {
      const response = await api.get('/extras');
      return response.data;
    },
  });

  const resetForm = () => {
    setIsModalVisible(false);
    setEditId(null);
    setNewName(''); 
    setNewPrice('');
  };

  const openEditModal = (extra: any) => {
    setEditId(extra.id);
    setNewName(extra.name);
    setNewPrice(extra.price.toString());
    setIsModalVisible(true);
  };

  // 2. Guardar o Actualizar Extra
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: newName,
        price: Number(newPrice),
      };

      if (editId) {
        // Actualizar existente
        await api.patch(`/extras/${editId}`, payload);
      } else {
        // Crear nuevo
        await api.post('/extras', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-extras'] });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Extra guardado correctamente' });
      resetForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Error al guardar";
      Toast.show({ type: 'error', text1: 'Error', text2: Array.isArray(msg) ? msg[0] : msg });
    }
  });

  // 3. Botón de Apagado/Encendido Rápido
  const toggleAvailability = async (extra: any) => {
    try {
      await api.patch(`/extras/${extra.id}`, { isAvailable: !extra.isAvailable });
      queryClient.invalidateQueries({ queryKey: ['admin-extras'] });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo cambiar la disponibilidad.' });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#090909' }} edges={['top', 'left', 'right']}>
      {/* Fondo sutil */}
      <Image source={require('../../assets/images/menu/banner.jpg')} className="absolute inset-0 w-full h-full" resizeMode="cover" style={{ opacity: 0.06 }} />
      {/* Título */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-xl font-black uppercase">Gestor de Extras</Text>
          <Text className="text-neutral-500 text-[10px] font-bold uppercase mt-0.5">{extras?.length || 0} extras</Text>
        </View>
        <TouchableOpacity
          onPress={() => { resetForm(); setIsModalVisible(true); }}
          className="bg-yellow-500 w-9 h-9 rounded-2xl items-center justify-center"
        >
          <FontAwesome name="plus" size={16} color="black" />
        </TouchableOpacity>
      </View>

      {/* ── PRECIO LEGEND ── */}
      <View className="px-5 pb-2 flex-row gap-x-2">
        <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1 flex-row items-center">
          <Text className="text-yellow-500 font-black text-[10px]">$1.000</Text>
        </View>
        <View className="bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 flex-row items-center">
          <Text className="text-orange-400 font-black text-[10px]">$500</Text>
        </View>
        <View className="bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 flex-row items-center">
          <Text className="text-red-400 font-black text-[10px]">$3.000</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {loadingExtras && <ActivityIndicator color="#EAB308" className="mt-10" />}
        <View className="pb-20">
          {extras?.map((item: any) => {
            let priceColor = 'text-yellow-500';
            let priceBg = 'bg-yellow-500/10 border-yellow-500/20';
            if (item.price === 500) { priceColor = 'text-orange-400'; priceBg = 'bg-orange-500/10 border-orange-500/20'; }
            if (item.price === 3000) { priceColor = 'text-red-400'; priceBg = 'bg-red-500/10 border-red-500/20'; }

            return (
              <View
                key={item.id}
                className={`rounded-2xl mb-2.5 flex-row items-center p-4 border ${
                  item.isAvailable ? 'bg-neutral-950 border-neutral-800/50' : 'bg-neutral-950 border-red-500/20 opacity-50'
                }`}
              >
                {/* Icono de precio */}
                <View className={`w-12 h-12 rounded-2xl items-center justify-center border mr-4 ${priceBg}`}>
                  <Text className={`font-black text-sm ${priceColor}`}>
                    {item.price === 3000 ? '3K' : `$${item.price}`}
                  </Text>
                </View>

                {/* Nombre */}
                <View className="flex-1">
                  <Text className="text-white font-black uppercase text-sm" numberOfLines={1}>{item.name}</Text>
                  {!item.isAvailable && (
                    <Text className="text-red-500 text-[9px] font-bold uppercase mt-0.5">No disponible</Text>
                  )}
                </View>

                {/* Acciones */}
                <View className="flex-row items-center gap-x-2">
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    className="bg-neutral-900 w-9 h-9 rounded-xl items-center justify-center border border-neutral-800"
                  >
                    <FontAwesome name="pencil" size={14} color="#EAB308" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleAvailability(item)}
                    className={`w-9 h-9 rounded-xl items-center justify-center border ${
                      item.isAvailable ? 'bg-green-500/10 border-green-500/20' : 'bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    <FontAwesome
                      name={item.isAvailable ? 'eye' : 'eye-slash'}
                      size={14}
                      color={item.isAvailable ? '#22C55E' : '#525252'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── MODAL ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-neutral-950 rounded-t-[40px] p-6 border-t border-neutral-800">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-black uppercase">
                {editId ? 'Editar Extra' : 'Nuevo Extra'}
              </Text>
              <TouchableOpacity onPress={resetForm} className="bg-neutral-900 w-10 h-10 rounded-2xl items-center justify-center border border-neutral-800">
                <FontAwesome name="close" size={16} color="#EAB308" />
              </TouchableOpacity>
            </View>

            <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px]">Nombre</Text>
            <TextInput value={newName} onChangeText={setNewName} className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-2xl mb-5 font-bold" placeholder="Ej: Tocino Crujiente" placeholderTextColor="#444" />

            <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px]">Precio ($)</Text>
            <TextInput value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-2xl mb-8 font-bold" placeholder="1000" placeholderTextColor="#444" />

            <TouchableOpacity
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={`bg-yellow-500 p-5 rounded-2xl items-center mb-6 ${saveMutation.isPending && 'opacity-50'}`}
            >
              {saveMutation.isPending ? <ActivityIndicator color="black" /> : (
                <Text className="text-black font-black uppercase text-base">{editId ? 'Guardar Cambios' : 'Crear Extra'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}