import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, Image, 
  ActivityIndicator, Modal, TextInput, Switch 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router'; // <-- Importamos useRouter
import { api } from '../../src/api/api';
import * as ImagePicker from 'expo-image-picker';

export default function MenuManagerScreen() {
  const queryClient = useQueryClient();
  const router = useRouter(); // <-- Instanciamos router

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#090909' }} edges={['top', 'left', 'right']}>
      {/* Fondo sutil */}
      <Image source={require('../../assets/images/menu/banner.jpg')} className="absolute inset-0 w-full h-full" resizeMode="cover" style={{ opacity: 0.06 }} />
      {/* Título */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-xl font-black uppercase">Gestor de Menú</Text>
          <Text className="text-neutral-500 text-[10px] font-bold uppercase mt-0.5">{products?.length || 0} productos</Text>
        </View>
        <TouchableOpacity
          onPress={() => { resetForm(); setIsModalVisible(true); }}
          className="bg-yellow-500 w-9 h-9 rounded-2xl items-center justify-center"
        >
          <FontAwesome name="plus" size={16} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {loadingProducts && <ActivityIndicator color="#EAB308" className="mt-10" />}
        <View className="pb-20">
          {products?.map((item: any) => (
            <View
              key={item.id}
              className={`rounded-3xl mb-3 overflow-hidden border ${
                item.isAvailable ? 'bg-neutral-950 border-neutral-800/50' : 'bg-neutral-950 border-red-500/20 opacity-60'
              }`}
            >
              <View className="flex-row items-center p-3">
                {/* Imagen */}
                <Image
                  source={item.image ? { uri: item.image } : require('../../assets/images/menu/bbq.jpg')}
                  className="w-[72px] h-[72px] rounded-2xl bg-neutral-900"
                  resizeMode="cover"
                />

                {/* Info */}
                <View className="flex-1 ml-4">
                  <Text className="text-white font-black uppercase text-sm" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-yellow-500 font-black text-base">${item.price.toLocaleString('es-CL')}</Text>
                    {!item.isAvailable && (
                      <View className="ml-2 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                        <Text className="text-red-500 text-[9px] font-black uppercase">Pausado</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Acciones */}
                <View className="items-center gap-y-2">
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
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── MODAL DE EDICIÓN ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-neutral-950 rounded-t-[40px] p-6 h-[88%] border-t border-neutral-800">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-black uppercase">
                {editId ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>
              <TouchableOpacity onPress={resetForm} className="bg-neutral-900 w-10 h-10 rounded-2xl items-center justify-center border border-neutral-800">
                <FontAwesome name="close" size={16} color="#EAB308" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Imagen */}
              <TouchableOpacity onPress={pickNewProductImage} className="w-full h-48 bg-neutral-900 rounded-3xl border-2 border-dashed border-neutral-800 items-center justify-center mb-6 overflow-hidden">
                {newImage ? (
                  <Image source={{ uri: newImage }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="items-center">
                    <FontAwesome name="image" size={36} color="#EAB308" />
                    <Text className="text-neutral-500 text-xs font-bold mt-2">Tocar para elegir foto</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Nombre */}
              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px]">Nombre</Text>
              <TextInput value={newName} onChangeText={setNewName} className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-2xl mb-4 font-bold" placeholder="Ej: La Jambre Especial" placeholderTextColor="#444" />

              {/* Precio */}
              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px]">Precio ($)</Text>
              <TextInput value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-2xl mb-4 font-bold" placeholder="8990" placeholderTextColor="#444" />

              {/* Categoría */}
              <Text className="text-neutral-400 font-bold mb-3 uppercase text-[10px]">Categoría</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {loadingCats ? <ActivityIndicator color="#EAB308" /> : categories?.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setNewCategoryId(cat.id)}
                    className={`px-5 py-2.5 rounded-2xl border ${
                      newCategoryId === cat.id ? 'bg-yellow-500 border-yellow-500' : 'bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    <Text className={`font-black text-xs uppercase ${newCategoryId === cat.id ? 'text-black' : 'text-neutral-400'}`}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Descripción */}
              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px]">Descripción</Text>
              <TextInput value={newDesc} onChangeText={setNewDesc} multiline className="bg-neutral-900 border border-neutral-800 text-white p-4 rounded-2xl mb-6 h-24" textAlignVertical="top" placeholder="Detalle ingredientes..." placeholderTextColor="#444" />

              {/* Botón Guardar */}
              <TouchableOpacity
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className={`bg-yellow-500 p-5 rounded-2xl items-center mb-10 ${saveMutation.isPending && 'opacity-50'}`}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black font-black uppercase text-base">{editId ? 'Guardar Cambios' : 'Publicar en Menú'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}