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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#060606' }} edges={['top', 'left', 'right']}>
      {/* Efectos Ambientales (Sin Blur) */}
      <View className="absolute top-[-50] right-[-50] w-64 h-64 rounded-full" style={{ backgroundColor: '#EAB308', opacity: 0.04, transform: [{ scale: 1.5 }] }} />
      <View className="absolute top-[40%] left-[-80] w-72 h-72 rounded-full" style={{ backgroundColor: '#F97316', opacity: 0.03, transform: [{ scale: 1.5 }] }} />

      {/* Fondo sutil */}
      <Image source={require('../../assets/images/menu/banner2.jpg')} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.12 }} />
      
      {/* Título Imponente */}
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-[28px] font-black tracking-tight mb-0.5">Gestor Extras</Text>
          <View className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full self-start">
            <Text className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">{extras?.length || 0} Extras</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => { resetForm(); setIsModalVisible(true); }}
          className="w-12 h-12 rounded-2xl items-center justify-center border border-yellow-500/30"
          style={{ backgroundColor: '#EAB308', shadowColor: '#EAB308', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
        >
          <FontAwesome name="plus" size={18} color="black" />
        </TouchableOpacity>
      </View>

      {/* ── PRECIO LEGEND ── */}
      <View className="px-6 pb-4 flex-row gap-x-3">
        <View className="border rounded-full px-3 py-1.5 flex-row items-center" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.2)' }}>
          <Text className="text-yellow-500 font-black text-[10px] tracking-widest uppercase">Especial ($1K)</Text>
        </View>
        <View className="border rounded-full px-3 py-1.5 flex-row items-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }}>
          <Text className="text-orange-500 font-black text-[10px] tracking-widest uppercase">Base ($500)</Text>
        </View>
        <View className="border rounded-full px-3 py-1.5 flex-row items-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <Text className="text-red-500 font-black text-[10px] tracking-widest uppercase">Premium ($3K)</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {loadingExtras && <ActivityIndicator color="#EAB308" className="mt-10" />}
        <View className="pb-24">
          {extras?.map((item: any) => {
            let priceColor = '#EAB308';
            let priceBg = 'rgba(234, 179, 8, 0.1)';
            let priceBorder = 'rgba(234, 179, 8, 0.2)';
            
            if (item.price === 500) { 
              priceColor = '#F97316'; 
              priceBg = 'rgba(249, 115, 22, 0.1)'; 
              priceBorder = 'rgba(249, 115, 22, 0.2)'; 
            }
            if (item.price === 3000) { 
              priceColor = '#EF4444'; 
              priceBg = 'rgba(239, 68, 68, 0.1)'; 
              priceBorder = 'rgba(239, 68, 68, 0.2)'; 
            }

            return (
              <View
                key={item.id}
                className="rounded-[20px] mb-3 flex-row items-center p-4 border"
                style={{ 
                  backgroundColor: '#111',
                  borderColor: item.isAvailable ? 'rgba(255,255,255,0.08)' : 'rgba(239, 68, 68, 0.2)',
                  opacity: item.isAvailable ? 1 : 0.65
                }}
              >
                {/* Icono de precio */}
                <View className="w-12 h-12 rounded-2xl items-center justify-center border mr-4" style={{ backgroundColor: priceBg, borderColor: priceBorder }}>
                  <Text className="font-black text-[13px]" style={{ color: priceColor }}>
                    {item.price >= 1000 ? `${item.price / 1000}K` : `$${item.price}`}
                  </Text>
                </View>

                {/* Nombre */}
                <View className="flex-1">
                  <Text className="text-white font-black uppercase text-[14px] tracking-tight mb-0.5" numberOfLines={1}>{item.name}</Text>
                  {!item.isAvailable && (
                    <View className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full self-start mt-1">
                      <Text className="text-red-500 text-[9px] font-black uppercase tracking-widest">Pausado</Text>
                    </View>
                  )}
                </View>

                {/* Acciones */}
                <View className="flex-row items-center gap-x-2 ml-2">
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    className="w-10 h-10 rounded-xl items-center justify-center border border-white/5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  >
                    <FontAwesome name="pencil" size={16} color="#EAB308" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleAvailability(item)}
                    className="w-10 h-10 rounded-xl items-center justify-center border"
                    style={{ 
                      backgroundColor: item.isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderColor: item.isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    <FontAwesome
                      name={item.isAvailable ? 'eye' : 'eye-slash'}
                      size={16}
                      color={item.isAvailable ? '#22C55E' : '#EF4444'}
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
        <View className="flex-1 justify-end bg-black/90">
          <View className="rounded-t-[40px] p-6 border-t border-white/10" style={{ backgroundColor: '#0A0A0A' }}>
            {/* Header del Modal */}
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-[22px] font-black uppercase tracking-tight">
                {editId ? 'Editar Extra' : 'Nuevo Extra'}
              </Text>
              <TouchableOpacity onPress={resetForm} className="w-10 h-10 rounded-2xl items-center justify-center border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <FontAwesome name="close" size={16} color="#737373" />
              </TouchableOpacity>
            </View>

            <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Nombre del Extra</Text>
            <TextInput 
              value={newName} 
              onChangeText={setNewName} 
              className="text-white p-5 rounded-2xl mb-5 font-bold text-[15px] border focus:border-yellow-500/50" 
              style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
              placeholder="Ej: Tocino Crujiente" 
              placeholderTextColor="#555" 
            />

            <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Precio ($)</Text>
            <TextInput 
              value={newPrice} 
              onChangeText={setNewPrice} 
              keyboardType="numeric" 
              className="text-white p-5 rounded-2xl mb-8 font-bold text-[15px] border focus:border-yellow-500/50" 
              style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
              placeholder="1000" 
              placeholderTextColor="#555" 
            />

            <TouchableOpacity
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={`p-5 rounded-[20px] items-center mb-10 flex-row justify-center border border-yellow-500/30 ${saveMutation.isPending && 'opacity-50'}`}
              style={{ backgroundColor: '#EAB308', shadowColor: '#EAB308', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator color="black" />
              ) : (
                <>
                  <FontAwesome name="check-circle" size={18} color="black" style={{ marginRight: 8 }} />
                  <Text className="text-black font-black uppercase text-[15px] tracking-wide">{editId ? 'Guardar Cambios' : 'Crear Extra'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
