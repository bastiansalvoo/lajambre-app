import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Modal, TextInput, Switch,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/api';

interface RewardForm {
  code: string;
  name: string;
  icon: string;
  pointsCost: string;
  discountAmount: string;
  freeDelivery: boolean;
  requiresBurger: boolean;
}

const EMPTY_FORM: RewardForm = {
  code: '',
  name: '',
  icon: '🎁',
  pointsCost: '',
  discountAmount: '',
  freeDelivery: false,
  requiresBurger: false,
};

export default function RewardsManagerScreen() {
  const queryClient = useQueryClient();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<RewardForm>(EMPTY_FORM);

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['admin-rewards'],
    queryFn: async () => {
      const response = await api.get('/rewards/admin/all');
      return response.data;
    },
  });

  const resetForm = () => {
    setIsModalVisible(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const openEditModal = (reward: any) => {
    setEditId(reward.id);
    setForm({
      code: reward.code,
      name: reward.name,
      icon: reward.icon,
      pointsCost: String(reward.pointsCost),
      discountAmount: String(reward.discountAmount),
      freeDelivery: reward.freeDelivery,
      requiresBurger: reward.requiresBurger,
    });
    setIsModalVisible(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...(editId ? {} : { code: form.code.trim().toUpperCase().replace(/\s+/g, '_') }),
        name: form.name,
        icon: form.icon || '🎁',
        pointsCost: Number(form.pointsCost),
        discountAmount: Number(form.discountAmount) || 0,
        freeDelivery: form.freeDelivery,
        requiresBurger: form.requiresBurger,
      };

      if (editId) {
        await api.patch(`/rewards/${editId}`, payload);
      } else {
        await api.post('/rewards', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Premio guardado correctamente' });
      resetForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al guardar';
      Toast.show({ type: 'error', text1: 'Error', text2: Array.isArray(msg) ? msg[0] : msg });
    },
  });

  const toggleActive = async (reward: any) => {
    try {
      await api.patch(`/rewards/${reward.id}`, { isActive: !reward.isActive });
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo cambiar el estado.' });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#060606' }} edges={['top', 'left', 'right']}>
      <View className="absolute top-[-50] right-[-50] w-64 h-64 rounded-full" style={{ backgroundColor: '#EAB308', opacity: 0.04, transform: [{ scale: 1.5 }] }} />
      <View className="absolute top-[40%] left-[-80] w-72 h-72 rounded-full" style={{ backgroundColor: '#A855F7', opacity: 0.03, transform: [{ scale: 1.5 }] }} />
      <Image source={require('../../assets/images/menu/banner2.jpg')} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.12 }} />

      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-[28px] font-black tracking-tight mb-0.5">Gestor Premios</Text>
          <View className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full self-start">
            <Text className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">{rewards?.length || 0} Premios</Text>
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

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {isLoading && <ActivityIndicator color="#EAB308" className="mt-10" />}
        <View className="pb-24">
          {rewards?.map((item: any) => (
            <View
              key={item.id}
              className="rounded-[20px] mb-3 flex-row items-center p-4 border"
              style={{
                backgroundColor: '#111',
                borderColor: item.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(239, 68, 68, 0.2)',
                opacity: item.isActive ? 1 : 0.65,
              }}
            >
              <View className="w-12 h-12 rounded-2xl items-center justify-center border mr-4" style={{ backgroundColor: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.2)' }}>
                <Text className="text-[22px]">{item.icon}</Text>
              </View>

              <View className="flex-1 pr-2">
                <Text className="text-white font-black uppercase text-[13px] tracking-tight mb-0.5" numberOfLines={1}>{item.name}</Text>
                <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                  {item.pointsCost} pts · {item.freeDelivery ? 'Delivery gratis' : `-$${item.discountAmount.toLocaleString('es-CL')}`}
                  {item.requiresBurger ? ' · Requiere burger' : ''}
                </Text>
                {!item.isActive && (
                  <View className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full self-start mt-1">
                    <Text className="text-red-500 text-[9px] font-black uppercase tracking-widest">Desactivado</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-x-2 ml-2">
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  className="w-10 h-10 rounded-xl items-center justify-center border border-white/5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <FontAwesome name="pencil" size={16} color="#EAB308" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleActive(item)}
                  className="w-10 h-10 rounded-xl items-center justify-center border"
                  style={{
                    backgroundColor: item.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: item.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <FontAwesome
                    name={item.isActive ? 'eye' : 'eye-slash'}
                    size={16}
                    color={item.isActive ? '#22C55E' : '#EF4444'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── MODAL ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/90">
          <ScrollView
            className="rounded-t-[40px] border-t border-white/10"
            style={{ backgroundColor: '#0A0A0A', maxHeight: '90%' }}
            contentContainerStyle={{ padding: 24 }}
          >
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-[22px] font-black uppercase tracking-tight">
                {editId ? 'Editar Premio' : 'Nuevo Premio'}
              </Text>
              <TouchableOpacity onPress={resetForm} className="w-10 h-10 rounded-2xl items-center justify-center border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <FontAwesome name="close" size={16} color="#737373" />
              </TouchableOpacity>
            </View>

            {!editId && (
              <>
                <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">
                  Código único (no se puede cambiar después)
                </Text>
                <TextInput
                  value={form.code}
                  onChangeText={(v) => setForm((f) => ({ ...f, code: v }))}
                  autoCapitalize="characters"
                  className="text-white p-5 rounded-2xl mb-5 font-bold text-[15px] border"
                  style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
                  placeholder="Ej: POSTRE_GRATIS"
                  placeholderTextColor="#555"
                />
              </>
            )}

            <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Nombre</Text>
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              className="text-white p-5 rounded-2xl mb-5 font-bold text-[15px] border"
              style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
              placeholder="Ej: Postre Gratis"
              placeholderTextColor="#555"
            />

            <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Emoji</Text>
            <TextInput
              value={form.icon}
              onChangeText={(v) => setForm((f) => ({ ...f, icon: v }))}
              className="text-white p-5 rounded-2xl mb-5 font-bold text-[15px] border"
              style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
              placeholder="🍮"
              placeholderTextColor="#555"
            />

            <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Puntos requeridos</Text>
            <TextInput
              value={form.pointsCost}
              onChangeText={(v) => setForm((f) => ({ ...f, pointsCost: v }))}
              keyboardType="numeric"
              className="text-white p-5 rounded-2xl mb-5 font-bold text-[15px] border"
              style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
              placeholder="150"
              placeholderTextColor="#555"
            />

            <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Descuento ($, ignorado si es delivery gratis)</Text>
            <TextInput
              value={form.discountAmount}
              onChangeText={(v) => setForm((f) => ({ ...f, discountAmount: v }))}
              keyboardType="numeric"
              className="text-white p-5 rounded-2xl mb-5 font-bold text-[15px] border"
              style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
              placeholder="1200"
              placeholderTextColor="#555"
            />

            <View className="flex-row items-center justify-between p-5 rounded-2xl mb-4 border" style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}>
              <Text className="text-white font-bold text-[13px]">Delivery gratis</Text>
              <Switch
                value={form.freeDelivery}
                onValueChange={(v) => setForm((f) => ({ ...f, freeDelivery: v }))}
                trackColor={{ false: '#333', true: '#EAB308' }}
                thumbColor="#fff"
              />
            </View>

            <View className="flex-row items-center justify-between p-5 rounded-2xl mb-8 border" style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}>
              <Text className="text-white font-bold text-[13px]">Requiere hamburguesa en el carrito</Text>
              <Switch
                value={form.requiresBurger}
                onValueChange={(v) => setForm((f) => ({ ...f, requiresBurger: v }))}
                trackColor={{ false: '#333', true: '#EAB308' }}
                thumbColor="#fff"
              />
            </View>

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
                  <Text className="text-black font-black uppercase text-[15px] tracking-wide">{editId ? 'Guardar Cambios' : 'Crear Premio'}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
