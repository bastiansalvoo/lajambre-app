import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, Image, 
  ActivityIndicator, Alert, Modal, TextInput, Switch 
} from 'react-native';
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
      Alert.alert("Error", Array.isArray(msg) ? msg[0] : msg);
    }
  });

  const toggleAvailability = async (product: any) => {
    try {
      await api.patch(`/products/${product.id}`, { isAvailable: !product.isAvailable });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar el estado del producto.");
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
            <FontAwesome name="cutlery" size={16} color="black" />
          </View>
          <View>
            <Text className="text-white text-lg font-black uppercase tracking-widest">Gestor de Menú</Text>
            <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Control de Catálogo</Text>
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
        {loadingProducts && <ActivityIndicator color="#EAB308" className="mt-10" />}

        {/* CONTENEDOR DE LA LISTA: Quitamos el flex-1 para que no se estire */}
        <View className="pb-20">
          {products?.map((item: any) => (
            <View key={item.id} className={`bg-neutral-900 border ${item.isAvailable ? 'border-neutral-800' : 'border-red-500/30 bg-neutral-950'} p-3 rounded-2xl mb-4 flex-row items-center shadow-sm`}>
              
              <Image 
                source={item.image ? { uri: item.image } : require('../../assets/images/menu/bbq.jpg')} 
                className={`w-16 h-16 rounded-xl bg-neutral-800 ${!item.isAvailable && 'opacity-40'}`}
                resizeMode="cover"
              />
              
              <View className="flex-1 mx-4">
                <Text className={`font-bold text-base uppercase ${item.isAvailable ? 'text-white' : 'text-neutral-500'}`} numberOfLines={1}>{item.name}</Text>
                <Text className={`${item.isAvailable ? 'text-yellow-500' : 'text-red-500/70'} font-black mt-1`}>
                  ${item.price.toLocaleString('es-CL')}
                </Text>
              </View>

              <View className="items-end justify-between h-16 py-1">
                <TouchableOpacity onPress={() => openEditModal(item)} className="p-2 bg-neutral-800 rounded-lg mb-2">
                  <FontAwesome name="pencil" size={14} color="#EAB308" />
                </TouchableOpacity>
                
                <Switch
                  trackColor={{ false: "#3f3f46", true: "#EAB308" }}
                  thumbColor={item.isAvailable ? "#000000" : "#a1a1aa"}
                  ios_backgroundColor="#3f3f46"
                  onValueChange={() => toggleAvailability(item)}
                  value={item.isAvailable}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>

            </View>
          ))}
        </View>
      </ScrollView>

      {/* MODAL DE EDICIÓN/CREACIÓN */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/90">
          <View className="bg-neutral-900 rounded-t-[40px] p-8 h-[85%] border-t border-neutral-800 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-black uppercase">
                {editId ? 'Editar Producto' : 'Nueva Burger'}
              </Text>
              <TouchableOpacity onPress={resetForm}><FontAwesome name="times-circle" size={28} color="#525252" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={pickNewProductImage} className="w-full h-44 bg-neutral-800 rounded-3xl border-2 border-dashed border-neutral-700 items-center justify-center mb-6 overflow-hidden">
                {newImage ? <Image source={{ uri: newImage }} className="w-full h-full" /> : <FontAwesome name="image" size={40} color="#EAB308" />}
                <View className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-lg">
                  <FontAwesome name="camera" size={16} color="white" />
                </View>
              </TouchableOpacity>

              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Nombre</Text>
              <TextInput value={newName} onChangeText={setNewName} className="bg-neutral-800 text-white p-4 rounded-xl mb-4 font-bold" placeholder="Ej: La Jambre Especial" placeholderTextColor="#444"/>

              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Precio ($)</Text>
              <TextInput value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" className="bg-neutral-800 text-white p-4 rounded-xl mb-4 font-bold" placeholder="8990" placeholderTextColor="#444"/>

              <Text className="text-neutral-400 font-bold mb-3 uppercase text-[10px] tracking-widest">Categoría</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {loadingCats ? <ActivityIndicator color="#EAB308" /> : categories?.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setNewCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-full border ${newCategoryId === cat.id ? 'bg-yellow-500 border-yellow-500' : 'bg-neutral-800 border-neutral-700'}`}
                  >
                    <Text className={`font-bold text-[10px] uppercase ${newCategoryId === cat.id ? 'text-black' : 'text-neutral-400'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Descripción</Text>
              <TextInput value={newDesc} onChangeText={setNewDesc} multiline className="bg-neutral-800 text-white p-4 rounded-xl mb-6 h-24" textAlignVertical="top" placeholder="Detalle ingredientes..." placeholderTextColor="#444"/>

              <TouchableOpacity onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending} className={`bg-yellow-500 p-5 rounded-2xl items-center mb-10 ${saveMutation.isPending && 'opacity-50'}`}>
                {saveMutation.isPending ? <ActivityIndicator color="black" /> : <Text className="text-black font-black uppercase text-lg">{editId ? 'Guardar Cambios' : 'Publicar en Menú'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}