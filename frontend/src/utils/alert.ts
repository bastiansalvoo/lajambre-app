import { useAlertStore, AlertButtonConfig } from '../store/alertStore';

export type AlertButton = AlertButtonConfig;

// Reemplazo de Alert.alert con el diseño propio de Lajambre, consistente
// en todas las plataformas (Alert.alert de react-native-web es un no-op,
// y las alertas nativas del navegador/SO no pegan con el estilo de la app).
// El modal real se renderiza una sola vez en app/_layout.tsx (AppAlertModal).
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  useAlertStore.getState().show(title, message, buttons);
}
