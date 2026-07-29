import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAlertStore, AlertButtonConfig } from '../store/alertStore';

// Modal de alerta/confirmación con la estética de Lajambre, montado una
// sola vez acá y disparado imperativamente desde cualquier pantalla con
// showAlert() (src/utils/alert.ts) — mismo patrón que <Toast />.
export default function AppAlertModal() {
  const { visible, title, message, buttons, hide } = useAlertStore();

  const isDestructive = buttons.some((b) => b.style === 'destructive');
  const iconName = isDestructive ? 'exclamation-triangle' : 'info-circle';
  const accentColor = isDestructive ? '#EF4444' : '#EAB308';
  const borderColorClass = isDestructive ? 'border-red-500' : 'border-yellow-500';

  const handlePress = (button: AlertButtonConfig) => {
    hide();
    // Pequeño delay para que el modal termine de cerrar antes de navegar
    // o disparar otro alert/toast desde el onPress.
    setTimeout(() => button.onPress?.(), 50);
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={hide}>
      <View className="flex-1 bg-black/80 justify-center items-center px-8">
        <View
          className={`bg-neutral-900 border-2 ${borderColorClass} rounded-3xl p-6 w-full shadow-2xl`}
          style={{ maxWidth: 380 }}
        >
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: accentColor }}
            >
              <FontAwesome name={iconName} size={28} color={isDestructive ? 'white' : 'black'} />
            </View>
            <Text
              className="text-center font-black text-xl uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              {title}
            </Text>
          </View>

          {!!message && (
            <Text className="text-neutral-200 text-center text-sm font-bold mt-2 mb-6 leading-5">
              {message}
            </Text>
          )}

          <View className={message ? '' : 'mt-2'}>
            {buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isButtonDestructive = button.style === 'destructive';

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePress(button)}
                  activeOpacity={0.85}
                  className={`p-4 rounded-xl items-center ${index > 0 ? 'mt-3' : ''} ${
                    isCancel
                      ? 'bg-white/5 border border-white/10'
                      : isButtonDestructive
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                  }`}
                >
                  <Text
                    className={`font-black uppercase text-sm ${
                      isCancel ? 'text-white' : isButtonDestructive ? 'text-white' : 'text-black'
                    }`}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
