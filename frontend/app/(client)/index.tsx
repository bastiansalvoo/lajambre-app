import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInRight, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 📸 1. Tus banners 100% locales
const BANNER_IMAGES = [
  require('../../assets/images/menu/banner.jpg'), 
  require('../../assets/images/menu/banner2.jpg'), 
  require('../../assets/images/menu/banner3.jpg'), 
];

const CATEGORIES = ['Todos', 'Burgers', 'Papas/Lados', 'Bebidas'];

const MENU_MOCK = [
  { id: 1, name: 'LA BBQ', price: '$9.790', image: require('../../assets/images/menu/bbq.jpg') },
  { id: 2, name: 'LA CLASICA', price: '$8.590', image: require('../../assets/images/menu/clasica.jpg') },
  { id: 3, name: 'LA DE PALTA', price: '$9.390', image: require('../../assets/images/menu/palta.jpg') },
  { id: 4, name: 'LA MOSTAZA-MIEL', price: '$9.290', image: require('../../assets/images/menu/mostaza.jpg') },
  { id: 5, name: 'LA TRIPLECHEESE', price: '$9.190', image: require('../../assets/images/menu/triple.jpg') },
];

// ⏳ 2. Skeletons arreglados: Usamos opacidad en vez de animate-pulse y los hacemos entrar fluidos
function BurgerSkeleton({ index }: { index: number }) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)} 
      className="w-[48%] mb-8"
    >
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
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false); 
    }, 3000);

    const carrouselTimer = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % BANNER_IMAGES.length;
        scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
        return nextIndex;
      });
    }, 5000); 

    return () => {
      clearTimeout(loadingTimer);
      clearInterval(carrouselTimer);
    };
  }, []);

  return (
     <SafeAreaView className="flex-1 bg-black" edges={['left', 'right']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* ⬆️⬇️ Borde arriba y abajo, un poco más fino (y-2) */}
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
                    if (index !== currentBannerIndex) {
                        setCurrentBannerIndex(index);
                    }
                }}
            >
                {BANNER_IMAGES.map((img, index) => (
                    <Image 
                        key={index}
                        source={img} 
                        style={{ width: SCREEN_WIDTH }}
                        className="h-full"
                        resizeMode="cover"
                    />
                ))}
            </ScrollView>
           
           <View className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent justify-end p-5">
              <Text style={styles.heroTextShadow} className="text-white text-3xl font-black italic tracking-tighter uppercase mb-2">
                PARA QUE COCINAR?
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

        <View className="p-4">
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {CATEGORIES.map((cat, index) => (
              <Animated.View 
                key={cat}
                entering={FadeInRight.delay(index * 100).springify()}
              >
                <TouchableOpacity 
                  className={`mr-3 px-6 py-2.5 rounded-full border ${index === 0 ? 'bg-yellow-500 border-yellow-500' : 'border-neutral-700'}`}
                >
                  <Text className={`font-bold ${index === 0 ? 'text-black' : 'text-neutral-500'}`}>{cat}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          <View className="flex-row items-center mb-6">
            <View className="h-[2px] w-8 bg-yellow-500 mr-3" />
            <Text className="text-white text-xl font-bold uppercase tracking-widest">
              Nuestras Burgers
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {isLoading ? (
                <>
                    <BurgerSkeleton index={0} />
                    <BurgerSkeleton index={1} />
                    <BurgerSkeleton index={2} />
                    <BurgerSkeleton index={3} />
                </>
            ) : (
                MENU_MOCK.map((burger, index) => (
                  <Animated.View 
                    key={burger.id} 
                    className="w-[48%] mb-8"
                    entering={FadeInDown.delay(index * 150).springify()}
                    layout={LinearTransition.springify()}
                  >
                    <View className="relative">
                      <Image 
                        source={burger.image} 
                        className="w-full h-44 rounded-2xl bg-neutral-900"
                        resizeMode="cover"
                      />
                      <View className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-lg">
                        <Text className="text-yellow-500 font-bold text-xs">{burger.price}</Text>
                      </View>
                    </View>
                    
                    <View className="mt-3 flex-row justify-between items-center">
                      <Text className="text-white text-[13px] font-black uppercase flex-1 mr-1">
                        {burger.name}
                      </Text>
                      <TouchableOpacity className="bg-yellow-500 w-7 h-7 rounded-lg items-center justify-center active:bg-yellow-600 active:scale-90 transition-transform">
                        <Text className="text-black font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                ))
            )}
          </View>
        </View>
        
        <View className="h-20" /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroTextShadow: {
    // 👇 Sombra intensificada (Aumento de opacidad, offset y radio)
    textShadowColor: 'rgba(0, 0, 0, 1)', // Negro absoluto
    textShadowOffset: {width: 0, height: 3}, // Un poco más abajo
    textShadowRadius: 4, // Más difuminado y amplio
  },
});