import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    // Fondo negro y centrado
    <View className="flex-1 items-center justify-center bg-lajambre-black">
      
      {/* Texto grande, blanco y en negrita */}
      <Text className="text-4xl font-bold text-lajambre-white">
        🍔 Lajambre Burgers
      </Text>
      
      <Text className="text-lg text-gray-400 mt-4">
        Fase 2: Motor Visual Iniciado
      </Text>

    </View>
  );
}