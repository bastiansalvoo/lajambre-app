import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

// 🍔 MOCK: Datos falsos de lo que habría en el carrito
const MOCK_CART_ITEMS = [
  { 
    id: 1, 
    name: 'LA DE PALTA', 
    price: 8490, 
    quantity: 2, 
    image: require('../../assets/images/menu/palta.jpg') 
  },
  { 
    id: 2, 
    name: 'BBQ BACON', 
    price: 8990, 
    quantity: 1, 
    image: require('../../assets/images/menu/bbq.jpg') 
  },
];

export default function CartScreen() {
  // Calculamos el total falso sumando precios x cantidad
  const totalAmount = MOCK_CART_ITEMS.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={['left', 'right']}>
      
      {/* 📜 LISTA DE PRODUCTOS */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        
        <Text className="text-white text-2xl font-black uppercase tracking-widest mb-6">
          Tu Pedido
        </Text>

        {MOCK_CART_ITEMS.map((item) => (
          <View key={item.id} className="flex-row bg-neutral-900 p-3 rounded-2xl mb-4 items-center">
            {/* Imagen del producto */}
            <Image 
              source={item.image} 
              className="w-20 h-20 rounded-xl bg-black" 
              resizeMode="cover"
            />
            
            {/* Detalles (Nombre y Precio) */}
            <View className="flex-1 ml-4 justify-center">
              <Text className="text-white font-bold text-[15px] uppercase" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-yellow-500 font-black mt-1">
                ${item.price.toLocaleString('es-CL')}
              </Text>
            </View>

            {/* Controles de Cantidad y Basurero */}
            <View className="items-end justify-between h-full py-1">
              {/* Botón de eliminar */}
              <TouchableOpacity className="mb-3">
                <FontAwesome name="trash-o" size={20} color="#EF4444" />
              </TouchableOpacity>

              {/* Sumar / Restar */}
              <View className="flex-row items-center bg-black rounded-lg p-1">
                <TouchableOpacity className="w-7 h-7 bg-neutral-800 rounded flex items-center justify-center">
                  <FontAwesome name="minus" size={12} color="white" />
                </TouchableOpacity>
                
                <Text className="text-white font-bold mx-3 text-sm">
                  {item.quantity}
                </Text>
                
                <TouchableOpacity className="w-7 h-7 bg-yellow-500 rounded flex items-center justify-center">
                  <FontAwesome name="plus" size={12} color="black" />
                </TouchableOpacity>
              </View>
            </View>

          </View>
        ))}

        {/* Espacio extra al final para que el scroll no quede tapado por el footer */}
        <View className="h-40" />
      </ScrollView>

      {/* 💳 FOOTER DE PAGO (Siempre pegado abajo) */}
      <View className="absolute bottom-0 w-full bg-neutral-900 rounded-t-3xl border-t border-neutral-800 p-6 shadow-2xl">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-neutral-400 font-bold text-lg uppercase">Total a pagar</Text>
          <Text className="text-white text-2xl font-black">
            ${totalAmount.toLocaleString('es-CL')}
          </Text>
        </View>

        <TouchableOpacity className="bg-yellow-500 rounded-xl py-4 flex-row justify-center items-center active:bg-yellow-600">
          <Text className="text-black text-lg font-black uppercase tracking-widest mr-2">
            Continuar al Pago
          </Text>
          <FontAwesome name="arrow-right" size={18} color="black" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}