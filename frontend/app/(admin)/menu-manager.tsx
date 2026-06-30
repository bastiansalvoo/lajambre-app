import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, Image, 
  ActivityIndicator, Modal, TextInput 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/api';
import * as ImagePicker from 'expo-image-picker';

export default function MenuManagerScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [newImage, setNewImage] = useState<string | null>(null);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  useEffect(() => {
    if (categories?.length > 0 && !newCategoryId) {
      setNewCategoryId(categories[0].id);
    }
  }, [categories]);

  const resetForm = () => {
    setIsModalVisible(false);
    setEditId(null);
    setNewName(''); setNewPrice(''); setNewDesc(''); setNewImage(null);
    if (categories) setNewCategoryId(categories[0].id);
  };

  const openEditModal = (product: any) => {
    setEditId(product.id);
    setNewName(product.name);
    setNewPrice(product.price.toString());
    setNewDesc(product.description || '');
    setNewCategoryId(product.categoryId);
    setNewImage(product.image);
    setIsModalVisible(true);
  };

  const pickNewProductImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setNewImage(result.assets[0].uri);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        await api.patch(`/products/${editId}`, {
          name: newName,
          price: Number(newPrice),
          description: newDesc,
          categoryId: newCategoryId
        });
        
        if (newImage && !newImage.startsWith('http')) {
          const formData = new FormData();
          const filename = newImage.split('/').pop() || 'burger.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          // @ts-ignore
          formData.append('image', { uri: newImage, name: filename, type });
          await api.patch(`/products/${editId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        const formData = new FormData();
        formData.append('name', newName);
        formData.append('description', newDesc);
        formData.append('price', newPrice);
        formData.append('categoryId', newCategoryId!.toString());

        if (newImage) {
          const filename = newImage.split('/').pop() || 'burger.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          // @ts-ignore
          formData.append('image', { uri: newImage, name: filename, type });
        }
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      resetForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Error al guardar";
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: Array.isArray(msg) ? msg[0] : msg
      });
    }
  });

  const toggleAvailability = async (product: any) => {
    try {
      await api.patch(`/products/${product.id}`, { isAvailable: !product.isAvailable });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cambiar el estado del producto.'
      });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#060606' }} edges={['top', 'left', 'right']}>
      {/* Efectos Ambientales (Sin Blur) */}
      <View className="absolute top-[-50] right-[-50] w-64 h-64 rounded-full" style={{ backgroundColor: '#EAB308', opacity: 0.04, transform: [{ scale: 1.5 }] }} />
      <View className="absolute top-[40%] left-[-80] w-72 h-72 rounded-full" style={{ backgroundColor: '#22C55E', opacity: 0.03, transform: [{ scale: 1.5 }] }} />

      {/* Fondo sutil */}
      <Image source={require('../../assets/images/menu/banner.jpg')} className="absolute inset-0 w-full h-full" resizeMode="cover" style={{ opacity: 0.12 }} />
      
      {/* Título Imponente */}
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-[28px] font-black tracking-tight mb-0.5">Gestor Menú</Text>
          <View className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full self-start">
            <Text className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">{products?.length || 0} Productos</Text>
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
        {loadingProducts && <ActivityIndicator color="#EAB308" className="mt-10" />}
        <View className="pb-24 pt-2">
          {products?.map((item: any) => (
            <View
              key={item.id}
              className="rounded-[24px] mb-4 overflow-hidden border"
              style={{ 
                backgroundColor: '#111',
                borderColor: item.isAvailable ? 'rgba(255,255,255,0.08)' : 'rgba(239, 68, 68, 0.2)',
                opacity: item.isAvailable ? 1 : 0.65
              }}
            >
              <View className="flex-row items-center p-4">
                {/* Imagen */}
                <View className="relative">
                  <Image
                    source={item.image ? { uri: item.image } : require('../../assets/images/menu/bbq.jpg')}
                    className="w-[72px] h-[72px] rounded-2xl"
                    style={{ backgroundColor: '#1A1A1A' }}
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
                </View>

                {/* Info */}
                <View className="flex-1 ml-4 justify-center">
                  <Text className="text-white font-black uppercase text-[15px] tracking-tight mb-1" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-yellow-500 font-black text-lg">${item.price.toLocaleString('es-CL')}</Text>
                    {!item.isAvailable && (
                      <View className="ml-3 border px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <Text className="text-red-500 text-[9px] font-black uppercase tracking-widest">Pausado</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Acciones */}
                <View className="items-center justify-center gap-y-3 ml-2">
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
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── MODAL DE EDICIÓN ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/90">
          <View className="rounded-t-[40px] p-6 h-[88%] border-t border-white/10" style={{ backgroundColor: '#0A0A0A' }}>
            {/* Header del Modal */}
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-[22px] font-black uppercase tracking-tight">
                {editId ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>
              <TouchableOpacity onPress={resetForm} className="w-10 h-10 rounded-2xl items-center justify-center border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <FontAwesome name="close" size={16} color="#737373" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Imagen */}
              <TouchableOpacity onPress={pickNewProductImage} className="w-full h-48 rounded-3xl border-2 border-dashed items-center justify-center mb-8 overflow-hidden relative" style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)' }}>
                {newImage ? (
                  <>
                    <Image source={{ uri: newImage }} className="w-full h-full" resizeMode="cover" />
                    <View className="absolute inset-0 bg-black/20 items-center justify-center">
                      <View className="bg-black/50 w-12 h-12 rounded-full items-center justify-center">
                        <FontAwesome name="pencil" size={18} color="white" />
                      </View>
                    </View>
                  </>
                ) : (
                  <View className="items-center">
                    <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
                      <FontAwesome name="camera" size={20} color="#EAB308" />
                    </View>
                    <Text className="text-neutral-400 text-[11px] font-bold uppercase tracking-widest">Tocar para añadir foto</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Nombre */}
              <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Nombre del Producto</Text>
              <TextInput 
                value={newName} 
                onChangeText={setNewName} 
                className="text-white p-5 rounded-2xl mb-5 font-bold text-[15px] border focus:border-yellow-500/50" 
                style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
                placeholder="Ej: La Jambre Especial" 
                placeholderTextColor="#555" 
              />

              {/* Precio */}
              <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Precio ($)</Text>
              <TextInput 
                value={newPrice} 
                onChangeText={setNewPrice} 
                keyboardType="numeric" 
                className="text-white p-5 rounded-2xl mb-5 font-bold text-[15px] border focus:border-yellow-500/50" 
                style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
                placeholder="8990" 
                placeholderTextColor="#555" 
              />

              {/* Categoría */}
              <Text className="text-neutral-500 font-black mb-3 uppercase text-[10px] tracking-widest">Categoría</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {loadingCats ? <ActivityIndicator color="#EAB308" /> : categories?.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setNewCategoryId(cat.id)}
                    className="px-5 py-3 rounded-2xl border"
                    style={{
                      backgroundColor: newCategoryId === cat.id ? 'rgba(234, 179, 8, 0.15)' : '#111',
                      borderColor: newCategoryId === cat.id ? 'rgba(234, 179, 8, 0.4)' : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <Text className="font-black text-[11px] uppercase tracking-wider" style={{ color: newCategoryId === cat.id ? '#EAB308' : '#737373' }}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Descripción */}
              <Text className="text-neutral-500 font-black mb-2 uppercase text-[10px] tracking-widest">Descripción</Text>
              <TextInput 
                value={newDesc} 
                onChangeText={setNewDesc} 
                multiline 
                className="text-white p-5 rounded-2xl mb-8 h-28 border focus:border-yellow-500/50" 
                style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.05)' }}
                textAlignVertical="top" 
                placeholder="Detalle ingredientes y preparación..." 
                placeholderTextColor="#555" 
              />

              {/* Botón Guardar */}
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
                    <Text className="text-black font-black uppercase text-[15px] tracking-wide">{editId ? 'Guardar Cambios' : 'Publicar en Menú'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}