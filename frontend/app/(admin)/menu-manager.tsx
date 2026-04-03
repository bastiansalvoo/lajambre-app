import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
// 👇 1. Importamos useQueryClient para poder refrescar la lista
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/api';
import * as ImagePicker from 'expo-image-picker';

export default function MenuManagerScreen() {
  // 👇 2. Inicializamos el refrescador
  const queryClient = useQueryClient();

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  // 👇 3. La función de subida real
  const pickImage = async (productId: number, productName: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        
        // --- PREPARAMOS EL PAQUETE ---
        const formData = new FormData();
        
        // React Native necesita que le expliquemos qué tipo de archivo es
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        // Metemos la foto al paquete
        formData.append('image', { 
          uri: imageUri, 
          name: filename, 
          type 
        } as any);

        // --- ENVIAMOS AL SERVIDOR ---
        try {
          // ⚠️ Asumo que tu ruta en NestJS para subir fotos es algo como PATCH /products/:id/image o similar.
          // Si le pusiste otro nombre en tu backend, lo ajustamos luego.
          await api.patch(`/products/${productId}/image`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // Si sale bien, avisamos y refrescamos la lista
          Alert.alert("¡Éxito!", `La foto de ${productName} se guardó correctamente.`);
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          
        } catch (uploadError) {
          console.error("Error subiendo la imagen:", uploadError);
          Alert.alert("Error de Servidor", "No se pudo guardar la foto en la base de datos.");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al abrir la galería.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={['left', 'right', 'bottom']}>
      
      <TouchableOpacity className="absolute bottom-6 right-6 bg-yellow-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50 active:bg-yellow-600">
        <FontAwesome name="plus" size={20} color="black" />
      </TouchableOpacity>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        
        <View className="mb-6 flex-row justify-between items-end">
          <View>
            <Text className="text-white text-2xl font-black uppercase tracking-widest">Tus Productos</Text>
            <Text className="text-neutral-400 mt-1">Selecciona uno para subir su foto real</Text>
          </View>
          <View className="bg-neutral-800 px-3 py-1 rounded-lg">
            <Text className="text-yellow-500 font-bold">{products?.length || 0} Items</Text>
          </View>
        </View>

        {isLoading && (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#EAB308" />
            <Text className="text-neutral-500 mt-4">Cargando base de datos...</Text>
          </View>
        )}

        {isError && (
          <View className="bg-red-500/10 border border-red-500 p-4 rounded-xl items-center">
            <FontAwesome name="warning" size={24} color="#EF4444" />
            <Text className="text-red-500 mt-2 font-bold text-center">Error al conectar con el servidor</Text>
          </View>
        )}

        {products?.map((burger: any) => (
          <View key={burger.id} className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl mb-4 flex-row items-center">
            
            <View className="relative">
              <Image 
                source={burger.image ? { uri: burger.image } : require('../../assets/images/menu/bbq.jpg')} 
                className={`w-16 h-16 rounded-xl ${!burger.image && 'opacity-30'}`}
                resizeMode="cover"
              />
              {!burger.image && (
                <View className="absolute inset-0 items-center justify-center">
                  <FontAwesome name="camera" size={20} color="#EAB308" />
                </View>
              )}
            </View>
            
            <View className="flex-1 ml-4">
              <Text className="text-white font-bold text-base uppercase" numberOfLines={1}>{burger.name}</Text>
              <Text className="text-yellow-500 font-black mt-1">${burger.price.toLocaleString('es-CL')}</Text>
            </View>

            <TouchableOpacity 
              onPress={() => pickImage(burger.id, burger.name)}
              className="bg-neutral-800 p-3 rounded-xl ml-2 active:bg-neutral-700"
            >
              <FontAwesome name="upload" size={18} color="#EAB308" />
            </TouchableOpacity>

            <TouchableOpacity className="bg-neutral-800 p-3 rounded-xl ml-2 active:bg-neutral-700">
              <FontAwesome name="pencil" size={18} color="white" />
            </TouchableOpacity>

          </View>
        ))}

        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}