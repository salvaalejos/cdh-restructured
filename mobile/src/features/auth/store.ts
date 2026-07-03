import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  user: any | null; // Tipar mejor posteriormente
  isLoading: boolean;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  login: async (token, user) => {
    await SecureStore.setItemAsync('jwt_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    set({ token, user, isLoading: false });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ token: null, user: null, isLoading: false });
  },
  checkSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      const userStr = await SecureStore.getItemAsync('user_data');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ token: null, user: null, isLoading: false });
      }
    } catch (e) {
      set({ token: null, user: null, isLoading: false });
    }
  }
}));
