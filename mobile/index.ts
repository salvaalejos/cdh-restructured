import "./global.css";
import { registerRootComponent } from 'expo';
import notifee from '@notifee/react-native';

import App from './App';

// Registrar el servicio en segundo plano (Foreground Service)
// Esto es ESTRICTAMENTE necesario en Android si usamos asForegroundService: true,
// de lo contrario el hilo nativo colapsa y congela la UI.
notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    // Tarea infinita que mantiene el micrófono encendido
    // Solo se detiene cuando llamamos notifee.stopForegroundService()
  });
});

registerRootComponent(App);
