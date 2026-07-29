import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// En web, WebBrowser.openBrowserAsync es un window.open(url) directo.
// Si se llama despues de awaits (llamadas a la API), los navegadores
// moviles (sobre todo Safari) lo tratan como popup no solicitado y lo
// bloquean en silencio, sin lanzar ningun error.
//
// Por eso hay que abrir la pestana en blanco de forma SINCRONICA, como
// primera linea del handler de onPress (antes de cualquier await), y
// navegarla despues una vez que ya tenemos la URL real del checkout.
export function openCheckoutWindow() {
  if (Platform.OS === 'web') {
    const popup = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    return {
      navigate: (url: string) => {
        if (popup && !popup.closed) {
          popup.location.href = url;
        } else {
          // Si igual lo bloquearon, probamos abrir directo (mismo
          // comportamiento que antes, por si el navegador lo permite).
          window.open(url, '_blank');
        }
      },
      // Por si terminamos sin URL para navegar (ej: pedido pagado 100%
      // con puntos), para no dejar una pestana en blanco huerfana.
      close: () => {
        if (popup && !popup.closed) popup.close();
      },
    };
  }

  return {
    navigate: (url: string) => {
      WebBrowser.openBrowserAsync(url);
    },
    close: () => {},
  };
}
