// File: src/shared/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado base de autenticación que vive entre reinicios.
      token: null,
      user: null,
      role: 'USER_ROLE',
      isAuthenticated: false,
      _hasHydrated: false,
      // Guarda sesión y refresco para reusar el token sin perder contexto.
      login: async (accessToken, user, refreshToken) => {
        const { default: useRestaurantStore } = await import('./restaurantStore.js');
        useRestaurantStore.getState().clearRestaurant();
        set({ token: accessToken, user, role: user?.role || 'USER_ROLE', isAuthenticated: true });
        if (refreshToken) {
          await SecureStore.setItemAsync('refreshToken', refreshToken);
        }
      },
      // Limpia la sesión local y elimina el refresh token persistido.
      logout: async () => {
        set({ token: null, user: null, role: 'USER_ROLE', isAuthenticated: false });
        try {
          await SecureStore.deleteItemAsync('refreshToken');
        } catch (e) {
          // ignore
        }
        const { default: useRestaurantStore } = await import('./restaurantStore.js');
        useRestaurantStore.getState().clearRestaurant();
      },
      // Actualiza solo el access token cuando el interceptor lo renueva.
      setAccessToken: (token) => set({ token, isAuthenticated: !!token }),
      // Reemplaza el usuario actual con la respuesta del perfil.
      updateUser: (user) => set({ user, role: user?.role || 'USER_ROLE' }),
      // Helper corto para decisiones de UI orientadas a admin.
      isAdmin: () => get().role === 'ADMIN_ROLE',
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Marca la store como hidratada cuando Zustand termina de cargarla.
      onRehydrateStorage: () => (hydratedState, error) => {
        if (!error && hydratedState) {
          useAuthStore.setState({ _hasHydrated: true });
        }
      },
    }
  )
);

const getRefreshToken = () => SecureStore.getItemAsync('refreshToken');

export { getRefreshToken, useAuthStore };
export default useAuthStore;
