import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

// react-native-web's Alert.alert() es un no-op (no muestra nada ni dispara
// los onPress de los botones). Este helper delega a Alert.alert en nativo,
// y en web usa window.confirm/alert como reemplazo funcional.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const list = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' } as AlertButton];
  const text = [title, message].filter(Boolean).join('\n\n');

  if (list.length <= 1) {
    window.alert(text);
    list[0]?.onPress?.();
    return;
  }

  const cancelButton = list.find((b) => b.style === 'cancel');
  const confirmButton = list.find((b) => b !== cancelButton) || list[list.length - 1];

  if (window.confirm(text)) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
