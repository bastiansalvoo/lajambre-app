import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-neutral-950 px-6 pt-6" edges={['left', 'right', 'bottom']}>
      
      <Text className="text-white text-3xl font-black uppercase tracking-widest mb-2">
        Resumen
      </Text>
      <Text className="text-neutral-400 mb-8 text-base">
        ¿Qué te gustaría gestionar hoy en Lajambre?
      </Text>

      {/* 🍔 Botón hacia el Gestor de Menú (Operativo) */}
      <TouchableOpacity
        onPress={() => router.push('/(admin)/menu-manager')}
        className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex-row items-center mb-4 active:bg-neutral-800"
      >
        <View className="bg-yellow-500/10 p-4 rounded-xl mr-4">
          <FontAwesome name="cutlery" size={24} color="#EAB308" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg uppercase tracking-wider">
            Gestor de Menú
          </Text>
          <Text className="text-neutral-500 text-sm mt-1">
            Editar productos, precios y subir fotos
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color="#525252" />
      </TouchableOpacity>

      {/* 📋 Botón hacia Pedidos (Desactivado temporalmente) */}
      <TouchableOpacity
        activeOpacity={1}
        className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex-row items-center opacity-50"
      >
         <View className="bg-yellow-500/10 p-4 rounded-xl mr-4">
          <FontAwesome name="motorcycle" size={24} color="#EAB308" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg uppercase tracking-wider">
            Pedidos en Vivo
          </Text>
          <Text className="text-yellow-500/70 text-sm mt-1 font-bold">
            (Próximamente)
          </Text>
        </View>
      </TouchableOpacity>

    </SafeAreaView>
  );
}