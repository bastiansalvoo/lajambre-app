import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, ActivityIndicator, Modal } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query'; 
import { api } from '../../src/api/api'; 
import { useCartStore, ExtraItem } from '../../src/store/cartStore'; 
import { FontAwesome } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANNER_IMAGES = [
  require('../../assets/images/menu/banner.jpg'), 
  require('../../assets/images/menu/banner2.jpg'), 
  require('../../assets/images/menu/banner3.jpg'), 
];

function ProductSkeleton({ index }: { index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} className="w-[48%] mb-8">
      <View className="w-full h-44 rounded-2xl bg-neutral-800 opacity-60" />
      <View className="mt-3 flex-row justify-between items-center">
         <View className="h-4 w-2/3 rounded-md bg-neutral-800 opacity-60" />
         <View className="h-7 w-7 rounded-lg bg-neutral-800 opacity-60" />
      </View>
    </Animated.View>
  );
}

export default function MenuScreen() {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const addItem = useCartStore((state) => state.addItem);

  // --- ESTADOS DEL MODAL DE EXTRAS ---
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedExtras, setSelectedExtras] = useState<ExtraItem[]>([]);

  // 1. Obtenemos Productos
  const { data: products, isLoading: loadingProducts, isError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  // 2. Obtenemos Categorías
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  // 3. Obtenemos Extras
  const { data: availableExtras } = useQuery({
    queryKey: ['extras'],
    queryFn: async () => {
      const response = await api.get('/products/extras/all');
      return response.data;
    },
  });

  useEffect(() => {
    const carrouselTimer = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % BANNER_IMAGES.length;
        scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
        return nextIndex;
      });
    }, 5000); 
    return () => clearInterval(carrouselTimer);
  }, []);

  // --- LÓGICA DEL MODAL ---
  const openExtrasModal = (product: any) => {
    setSelectedProduct(product);
    setSelectedExtras([]); // Limpiamos selecciones anteriores
  };

  const toggleExtra = (extra: ExtraItem) => {
    const exists = selectedExtras.find(e => e.id === extra.id);
    if (exists) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    addItem({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      image: selectedProduct.image,
    }, selectedExtras);

    setSelectedProduct(null);
    setSelectedExtras([]);
  };

  // Precio dinámico para el botón del Modal
  const currentModalTotal = selectedProduct 
    ? selectedProduct.price + selectedExtras.reduce((sum, e) => sum + e.price, 0)
    : 0;

  const isLoading = loadingProducts || loadingCategories;

  return (
     <SafeAreaView className="flex-1 bg-black" edges={['left', 'right']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Banner Carrusel */}
        <View className="relative h-72 w-full border-y-2 border-yellow-500">
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(event) => {
                    const contentOffset = event.nativeEvent.contentOffset.x;
                    const index = Math.round(contentOffset / SCREEN_WIDTH);
                    if (index !== currentBannerIndex) setCurrentBannerIndex(index);
                }}
            >
                {BANNER_IMAGES.map((img, index) => (
                    <Image key={index} source={img} style={{ width: SCREEN_WIDTH }} className="h-full" resizeMode="cover" />
                ))}
            </ScrollView>
           
           <View className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent justify-end p-5">
              <Text style={styles.heroTextShadow} className="text-white text-3xl font-black italic tracking-tighter uppercase mb-2">
                ¿PARA QUÉ COCINAR?
              </Text>
              <View className="flex-row gap-x-1.5 self-center">
                  {BANNER_IMAGES.map((_, index) => (
                    <Animated.View 
                      key={index} 
                      layout={LinearTransition} 
                      className={`h-2 rounded-full ${index === currentBannerIndex ? 'w-5 bg-yellow-500' : 'w-2 bg-neutral-600'}`} 
                    />
                  ))}
              </View>
           </View>
        </View>

        <View className="p-4 pt-8">
          {isLoading ? (
             <View className="flex-row flex-wrap justify-between">
                <ProductSkeleton index={0} />
                <ProductSkeleton index={1} />
             </View>
          ) : isError ? (
              <Text className="text-red-500 text-center font-bold mt-10">Error al conectar con Lajambre Server</Text>
          ) : (
              categories?.sort((a: any, b: any) => {
                if (a.name.toLowerCase() === 'hamburguesas') return -1;
                if (b.name.toLowerCase() === 'hamburguesas') return 1;
                return 0;
              }).map((category: any) => {
                const categoryProducts = products?.filter((p: any) => p.isAvailable && p.categoryId === category.id);
                if (!categoryProducts || categoryProducts.length === 0) return null;

                return (
                  <View key={category.id} className="mb-6">
                    <View className="flex-row items-center mb-6">
                      <View className="h-[2px] w-8 bg-yellow-500 mr-3" />
                      <Text className="text-white text-xl font-bold uppercase tracking-widest">{category.name}</Text>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                      {categoryProducts.map((product: any, index: number) => (
                        <Animated.View 
                          key={product.id} 
                          className="w-[48%] mb-8"
                          entering={FadeInDown.delay(index * 100).springify()}
                          layout={LinearTransition.springify()}
                        >
                          <TouchableOpacity activeOpacity={0.9} onPress={() => openExtrasModal(product)}>
                            <View className="relative">
                              <Image 
                                source={product.image ? { uri: product.image } : require('../../assets/images/menu/bbq.jpg')} 
                                className="w-full h-44 rounded-2xl bg-neutral-900"
                                resizeMode="cover"
                              />
                              <View className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-lg">
                                <Text className="text-yellow-500 font-bold text-xs">${product.price.toLocaleString('es-CL')}</Text>
                              </View>
                            </View>
                            
                            <View className="mt-3 flex-row justify-between items-center">
                              <Text className="text-white text-[13px] font-black uppercase flex-1 mr-1" numberOfLines={1}>
                                {product.name}
                              </Text>
                              <View className="bg-yellow-500 w-7 h-7 rounded-lg items-center justify-center shadow-sm">
                                <Text className="text-black font-black">+</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        </Animated.View>
                      ))}
                    </View>
                  </View>
                );
              })
          )}
        </View>
        <View className="h-20" /> 
      </ScrollView>

      {/* --- MODAL DE EXTRAS (ESTILO UBER EATS) --- */}
      <Modal visible={!!selectedProduct} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-neutral-900 rounded-t-3xl border-t border-yellow-500/30 overflow-hidden max-h-[85%]">
            
            {/* Header del Modal */}
            <View className="p-6 border-b border-neutral-800">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-4">
                  <Text className="text-white text-2xl font-black uppercase tracking-wide">{selectedProduct?.name}</Text>
                  <Text className="text-neutral-400 text-xs font-bold mt-1" numberOfLines={3}>{selectedProduct?.description}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedProduct(null)} className="bg-neutral-800 p-2 rounded-full">
                  <FontAwesome name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
              <View className="mb-2 flex-row justify-between items-end">
                <Text className="text-white text-lg font-bold uppercase tracking-widest">Mejora tu Burger</Text>
                <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Opcional</Text>
              </View>
              <Text className="text-neutral-500 text-xs mb-6">Elige los extras que desees agregar a tu pedido.</Text>

              {/* Lista de Extras dinámicos */}
              {availableExtras?.map((extra: any) => {
                const isSelected = selectedExtras.some(e => e.id === extra.id);
                return (
                  <TouchableOpacity 
                    key={extra.id} 
                    onPress={() => toggleExtra(extra)}
                    className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border ${isSelected ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-black border-neutral-800'}`}
                  >
                    <View className="flex-row items-center">
                      <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-neutral-600'}`}>
                        {isSelected && <FontAwesome name="check" size={12} color="black" />}
                      </View>
                      <Text className={`font-bold uppercase text-sm ${isSelected ? 'text-yellow-500' : 'text-neutral-300'}`}>{extra.name}</Text>
                    </View>
                    <Text className={`font-black ${isSelected ? 'text-yellow-500' : 'text-neutral-400'}`}>+${extra.price.toLocaleString('es-CL')}</Text>
                  </TouchableOpacity>
                );
              })}
              <View className="h-6" />
            </ScrollView>

            {/* Footer con Botón Agregar */}
            <View className="p-6 bg-black border-t border-neutral-800 pb-10">
              <TouchableOpacity 
                onPress={handleAddToCart}
                className="bg-yellow-500 py-4 rounded-2xl flex-row justify-between items-center px-6 shadow-lg shadow-yellow-500/20 active:bg-yellow-600"
              >
                <Text className="text-black font-black uppercase text-lg">Agregar al Carrito</Text>
                <Text className="text-black font-black text-lg">${currentModalTotal.toLocaleString('es-CL')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroTextShadow: {
    textShadowColor: 'rgba(0, 0, 0, 1)', 
    textShadowOffset: {width: 0, height: 3}, 
    textShadowRadius: 4, 
  },
});