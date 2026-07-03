import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// La URL se configura en el archivo .env del proyecto.
// Desarrollo: http://10.0.2.2:3000/api (alias del emulador Android a localhost)
// Producción: http://<IP_VPS>:3000/api (cambiar en .env)
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://10.0.2.2:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para inyectar automáticamente el JWT Token en cada petición
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error al recuperar el token del SecureStore', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extraer el mensaje de error del backend si existe
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error de conexión con el servidor';
    return Promise.reject(new Error(errorMessage));
  }
);
