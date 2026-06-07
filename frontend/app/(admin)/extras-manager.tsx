import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  ActivityIndicator, Modal, TextInput, Switch 
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
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'left', 'right']}>
      
      {/* 👑 CABECERA */}
      <View className="px-5 py-4 flex-row items-center border-b border-neutral-900 bg-neutral-950">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
          <FontAwesome name="arrow-left" size={20} color="#EAB308" />
        </TouchableOpacity>
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 bg-yellow-500 rounded-lg items-center justify-center mr-3">
            <FontAwesome name="plus-circle" size={16} color="black" />
          </View>
          <View>
            <Text className="text-white text-lg font-black uppercase tracking-widest">Gestor de Extras</Text>
            <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Control de Acompañamientos</Text>
          </View>
        </View>
      </View>

      {/* Botón Flotante para Crear */}
      <TouchableOpacity 
        onPress={() => { resetForm(); setIsModalVisible(true); }}
        className="absolute bottom-6 right-6 bg-yellow-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30 z-50 active:bg-yellow-600"
      >
        <FontAwesome name="plus" size={24} color="black" />
      </TouchableOpacity>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {loadingExtras && <ActivityIndicator color="#EAB308" className="mt-10" />}

        {/* CONTENEDOR DE LA LISTA */}
        <View className="pb-20">
          {extras?.map((item: any) => (
            <View key={item.id} className={`bg-neutral-900 border ${item.isAvailable ? 'border-neutral-800' : 'border-red-500/30 bg-neutral-950'} p-4 rounded-2xl mb-4 flex-row items-center justify-between shadow-sm`}>
              
              <View className="flex-1 mr-4">
                <Text className={`font-black text-lg uppercase ${item.isAvailable ? 'text-white' : 'text-neutral-500'}`} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className={`${item.isAvailable ? 'text-yellow-500' : 'text-red-500/70'} font-bold mt-1`}>
                  + ${item.price.toLocaleString('es-CL')}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => openEditModal(item)} className="p-3 bg-neutral-800 rounded-xl">
                  <FontAwesome name="pencil" size={16} color="#EAB308" />
                </TouchableOpacity>
                
                <Switch
                  trackColor={{ false: "#3f3f46", true: "#EAB308" }}
                  thumbColor={item.isAvailable ? "#000000" : "#a1a1aa"}
                  ios_backgroundColor="#3f3f46"
                  onValueChange={() => toggleAvailability(item)}
                  value={item.isAvailable}
                />
              </View>

            </View>
          ))}
        </View>
      </ScrollView>

      {/* MODAL DE EDICIÓN/CREACIÓN */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/90">
          <View className="bg-neutral-900 rounded-t-[40px] p-8 h-[60%] border-t border-neutral-800 shadow-2xl">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-2xl font-black uppercase">
                {editId ? 'Editar Extra' : 'Nuevo Extra'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <FontAwesome name="times-circle" size={28} color="#525252" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Nombre del Extra</Text>
              <TextInput 
                value={newName} 
                onChangeText={setNewName} 
                className="bg-neutral-800 text-white p-4 rounded-xl mb-6 font-bold text-base" 
                placeholder="Ej: Tocino Crujiente" 
                placeholderTextColor="#444"
              />

              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Precio Adicional ($)</Text>
              <TextInput 
                value={newPrice} 
                onChangeText={setNewPrice} 
                keyboardType="numeric" 
                className="bg-neutral-800 text-white p-4 rounded-xl mb-10 font-bold text-base" 
                placeholder="1500" 
                placeholderTextColor="#444"
              />

              <TouchableOpacity 
                onPress={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending} 
                className={`bg-yellow-500 p-5 rounded-2xl items-center mb-10 ${saveMutation.isPending && 'opacity-50'}`}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-black uppercase text-lg">
                    {editId ? 'Guardar Cambios' : 'Crear Extra'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}