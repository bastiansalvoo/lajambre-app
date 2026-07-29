import { create } from 'zustand';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButtonConfig {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButtonConfig[];
  show: (title: string, message?: string, buttons?: AlertButtonConfig[]) => void;
  hide: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
  show: (title, message, buttons) =>
    set({
      visible: true,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
    }),
  hide: () => set({ visible: false }),
}));
