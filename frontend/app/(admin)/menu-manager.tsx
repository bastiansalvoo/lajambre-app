import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, Image, 
  ActivityIndicator, Alert, Modal, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/api';
import * as ImagePicker from 'expo-image-picker';

export default function MenuManagerScreen() {
  const queryClient = useQueryClient();

  // --- ESTADOS ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [newImage, setNewImage] = useState<string | null>(null);

  // --- 1. OBTENER PRODUCTOS ---
  const { data: products, isLoading: loadingProducts, isError } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  // --- 2. OBTENER CATEGORÍAS REALES ---
  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  // Seleccionamos la primera por defecto al cargar
  useEffect(() => {
    if (categories?.length > 0 && !newCategoryId) {
      setNewCategoryId(categories[0].id);
    }
  }, [categories]);

  // --- 3. MUTACIÓN PARA CREAR ---
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      Alert.alert("🔥 ¡Éxito!", "Producto guardado en Lajambre DB.");
      resetForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Error de servidor";
      Alert.alert("Error", Array.isArray(msg) ? msg[0] : msg);
    }
  });

  const resetForm = () => {
    setIsModalVisible(false);
    setNewName(''); setNewPrice(''); setNewDesc(''); setNewImage(null);
    if (categories) setNewCategoryId(categories[0].id);
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

  const handleSaveProduct = () => {
    if (!newName || !newPrice || !newDesc || !newCategoryId) {
      Alert.alert("Atención", "Faltan datos obligatorios.");
      return;
    }

    const formData = new FormData();
    formData.append('name', newName);
    formData.append('description', newDesc);
    formData.append('price', newPrice);
    formData.append('categoryId', newCategoryId.toString());

    if (newImage) {
      const filename = newImage.split('/').pop() || 'burger.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      // @ts-ignore
      formData.append('image', { uri: newImage, name: filename, type });
    }

    createMutation.mutate(formData);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={['left', 'right', 'bottom']}>
      
      {/* Botón Flotante */}
      <TouchableOpacity 
        onPress={() => setIsModalVisible(true)}
        className="absolute bottom-6 right-6 bg-yellow-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50 active:bg-yellow-600"
      >
        <FontAwesome name="plus" size={24} color="black" />
      </TouchableOpacity>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-white text-2xl font-black uppercase tracking-widest">Gestor de Menú</Text>
          <Text className="text-neutral-400 mt-1">Base de datos dinámica</Text>
        </View>

        {loadingProducts && <ActivityIndicator color="#EAB308" className="mt-10" />}

        {products?.map((item: any) => (
          <View key={item.id} className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl mb-4 flex-row items-center shadow-sm">
            <Image 
              source={item.image ? { uri: item.image } : require('../../assets/images/menu/bbq.jpg')} 
              className="w-16 h-16 rounded-xl bg-neutral-800"
              resizeMode="cover"
            />
            <View className="flex-1 ml-4">
              <Text className="text-white font-bold text-base uppercase" numberOfLines={1}>{item.name}</Text>
              <Text className="text-yellow-500 font-black mt-1">${item.price.toLocaleString('es-CL')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL DE CREACIÓN */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-neutral-900 rounded-t-[40px] p-8 h-[85%] border-t border-neutral-800">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-black uppercase">Nueva Burger</Text>
              <TouchableOpacity onPress={resetForm}><FontAwesome name="times-circle" size={28} color="#525252" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={pickNewProductImage} className="w-full h-44 bg-neutral-800 rounded-3xl border-2 border-dashed border-neutral-700 items-center justify-center mb-6 overflow-hidden">
                {newImage ? <Image source={{ uri: newImage }} className="w-full h-full" /> : <FontAwesome name="image" size={40} color="#EAB308" />}
              </TouchableOpacity>

              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Nombre</Text>
              <TextInput value={newName} onChangeText={setNewName} className="bg-neutral-800 text-white p-4 rounded-xl mb-4 font-bold" placeholder="Ej: La Jambre Especial" placeholderTextColor="#444"/>

              <Text className="text-neutral-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Precio ($)</Text>
              <TextInput value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" className="bg-neutral-800 text-white p-4 rounded-xl mb-4 font-bold" placeholder="8990" placeholderTextColor="#444"/>

              {/* CHIPS DE CATEGORÍA */}
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

              <TouchableOpacity onPress={handleSaveProduct} disabled={createMutation.isPending} className={`bg-yellow-500 p-5 rounded-2xl items-center mb-10 ${createMutation.isPending && 'opacity-50'}`}>
                {createMutation.isPending ? <ActivityIndicator color="black" /> : <Text className="text-black font-black uppercase text-lg">Publicar en Menú</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}