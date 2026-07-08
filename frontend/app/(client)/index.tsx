import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Modal, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, Platform } from 'react-native';
import Animated, {
  FadeInDown, LinearTransition,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, API_BASE_URL } from '../../src/api/api';
import { useCartStore, ExtraItem } from '../../src/store/cartStore';
import { FontAwesome } from '@expo/vector-icons';

const BANNER_IMAGES = [
  require('../../assets/images/menu/banner.jpg'), 
  require('../../assets/images/menu/banner2.jpg'), 
  require('../../assets/images/menu/banner3.jpg'), 
];

function ProductSkeleton({ index }: { index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={gridStyles.productCard}>
      <View style={{ width: '100%', height: 176, borderRadius: 16, backgroundColor: '#262626', opacity: 0.6 }} />
      <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
         <View style={{ height: 16, width: '66%', borderRadius: 6, backgroundColor: '#262626', opacity: 0.6 }} />
         <View style={{ height: 28, width: 28, borderRadius: 8, backgroundColor: '#262626', opacity: 0.6 }} />
      </View>
    </Animated.View>
  );
}

export default function MenuScreen() {
  const { width: windowWidth } = useWindowDimensions();
  // En web, limitamos el ancho inicial al máximo del contenedor (480px) para que el carrusel
  // no se inicialice con el ancho completo del browser (lo que rompería la paginación)
  const initialWidth = Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth;
  const [sliderWidth, setSliderWidth] = useState(initialWidth);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const addItem = useCartStore((state) => state.addItem);

  // ── ANIMACIONES ──
  const scrollY = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const shimmerAnim = useSharedValue(0);

  // Parallax del banner al scrollear
  const bannerParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 300], [0, 90], Extrapolation.CLAMP) }],
  }));

  // Animaciones cíclicas (Latido y Brillo)
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      true,
    );

    shimmerAnim.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 3000 }), // Espera 3 segundos
        withTiming(1, { duration: 1200 }), // Cruza rápido en 1.2s
        withTiming(0, { duration: 0 })     // Reinicia sin transición
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: '25deg' },
      { translateX: interpolate(shimmerAnim.value, [0, 1], [-150, 250], Extrapolation.CLAMP) }
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  }, []);

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
        scrollViewRef.current?.scrollTo({ x: nextIndex * sliderWidth, animated: true });
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

  const addToCartScale = useSharedValue(1);

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    // Animación de bounce antes de agregar
    addToCartScale.value = withSequence(
      withSpring(0.92, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );

    setTimeout(() => {
      addItem({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
      }, selectedExtras);
      setSelectedProduct(null);
      setSelectedExtras([]);
    }, 120);
  };

  const addToCartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addToCartScale.value }],
  }));

  // Precio dinámico para el botón del Modal
  const currentModalTotal = selectedProduct 
    ? selectedProduct.price + selectedExtras.reduce((sum, e) => sum + e.price, 0)
    : 0;

  const isLoading = loadingProducts || loadingCategories;

  return (
     <SafeAreaView className="flex-1 bg-black" edges={['left', 'right']}>
      {/* Fondo: burger con overlay negro para dar profundidad sin distraer */}
      <Image
        source={require('../../assets/images/menu/banner2.jpg')}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />
      <View className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.88)' }} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        
        {/* Banner Carrusel */}
        <View 
            className="relative h-72 w-full border-y-2 border-yellow-500" 
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        >
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(event) => {
                    const contentOffset = event.nativeEvent.contentOffset.x;
                    const index = Math.round(contentOffset / (sliderWidth || 1));
                    if (index !== currentBannerIndex) setCurrentBannerIndex(index);
                }}
            >
                {BANNER_IMAGES.map((img, index) => (
                    <Animated.Image
                      key={index}
                      source={img}
                      style={[{ width: sliderWidth }, bannerParallax]}
                      className="h-[120%] -top-[10%]"
                      resizeMode="cover"
                    />
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

        {/* Tagline */}
        <View className="px-5 pt-6 pb-1">
          <Text className="text-white text-lg font-black uppercase">
            Ganas de un <Text className="text-yellow-500">gustito?</Text>
          </Text>
          <Text className="text-neutral-400 text-[11px] mt-0.5 font-light uppercase tracking-[3px]">Elige lo que se te antoje</Text>
        </View>

        <View className="p-4 pt-4">
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
              }).map((category: any, catIndex: number, filteredCats: any[]) => {
                const categoryProducts = products?.filter((p: any) => p.isAvailable && p.categoryId === category.id);
                if (!categoryProducts || categoryProducts.length === 0) return null;
                const isLastCategory = catIndex === filteredCats.length - 1;

                return (
                  <View key={category.id} className="mb-6">
                    <View className="flex-row items-center mb-6">
                      <View className="h-[2px] w-8 bg-yellow-500 mr-3" />
                      <Text className="text-white text-xl font-bold uppercase tracking-widest">{category.name}</Text>
                    </View>

                    <View style={gridStyles.productGrid}>
                      {categoryProducts.map((product: any, index: number) => (
                        <Animated.View 
                          key={product.id} 
                          style={gridStyles.productCard}
                          entering={FadeInDown.delay(index * 100).springify()}
                          layout={LinearTransition.springify()}
                        >
                          <TouchableOpacity 
                            activeOpacity={0.9} 
                            onPress={() => openExtrasModal(product)}
                            disabled={!product.inStock}
                          >
                            <View className="relative rounded-2xl border overflow-hidden" style={{ borderColor: product.inStock ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.1)', shadowColor: product.inStock ? '#EAB308' : '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, backgroundColor: '#000' }}>
                              <Image 
                                source={product.image ? { uri: product.image.startsWith('/') ? API_BASE_URL + product.image : product.image } : require('../../assets/images/menu/bbq.jpg')} 
                                style={{ width: '100%', height: 176, backgroundColor: '#171717', opacity: product.inStock ? 1 : 0.4 }}
                                resizeMode="cover"
                              />

                              {!product.inStock && (
                                <View className="absolute inset-0 bg-black/50 justify-center items-center z-30">
                                  <View className="bg-red-600 px-3 py-1.5 rounded-full border border-red-400/50" style={{ transform: [{ rotate: '-10deg' }] }}>
                                    <Text className="text-white font-black uppercase text-[12px] tracking-widest shadow-black shadow-sm">Agotado</Text>
                                  </View>
                                </View>
                              )}
                              
                              {/* Efecto de Brillo Cruzado (Shimmer) */}
                              <Animated.View 
                                style={[{
                                  position: 'absolute',
                                  top: -50, bottom: -50, width: 30,
                                  backgroundColor: 'rgba(255,255,255,0.4)',
                                  shadowColor: 'white', shadowOpacity: 1, shadowRadius: 10, elevation: 5,
                                  zIndex: 10
                                }, shimmerStyle]}
                              />

                              <View className="absolute bottom-2 left-2 bg-black/80 px-2.5 py-1 rounded-lg border border-yellow-500/20 z-20">
                                <Text className="text-yellow-500 font-black text-[11px] tracking-wider">${product.price.toLocaleString('es-CL')}</Text>
                              </View>
                            </View>
                            
                            <View className="mt-3 flex-row justify-between items-center">
                              <Text className="text-white text-[13px] font-black uppercase flex-1 mr-1" numberOfLines={1}>
                                {product.name}
                              </Text>
                              <Animated.View style={pulseStyle} className="bg-yellow-500 w-7 h-7 rounded-lg items-center justify-center shadow-sm">
                                <Text className="text-black font-black">+</Text>
                              </Animated.View>
                            </View>
                          </TouchableOpacity>
                        </Animated.View>
                      ))}
                    </View>

                    {/* Separador entre categorías */}
                    {!isLastCategory && (
                      <View className="flex-row items-center justify-center mt-2 mb-0">
                        <View className="h-px flex-1 bg-neutral-800/30" />
                        <View className="w-1.5 h-1.5 bg-yellow-500/40 rounded-full mx-3" />
                        <View className="h-px flex-1 bg-neutral-800/30" />
                      </View>
                    )}
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
              <Animated.View style={addToCartStyle}>
                <TouchableOpacity 
                  onPress={handleAddToCart}
                  className="bg-yellow-500 py-4 rounded-2xl flex-row justify-between items-center px-6 shadow-lg shadow-yellow-500/20"
                  activeOpacity={0.75}
                >
                  <Text className="text-black font-black uppercase text-lg">Agregar al Carrito</Text>
                  <Text className="text-black font-black text-lg">${currentModalTotal.toLocaleString('es-CL')}</Text>
                </TouchableOpacity>
              </Animated.View>
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

// Estilos de grilla separados para mayor claridad
const gridStyles = StyleSheet.create({
  // Contenedor de la grilla de 2 columnas
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // Cada tarjeta de producto (48% del ancho = 2 columnas con 4% de espacio entre ellas)
  productCard: {
    width: '48%',
    marginBottom: 32,
  },
});
