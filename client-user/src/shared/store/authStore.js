// File: src/shared/store/authStore.js
import create from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const useAuthStore = create(persist((set, get) => ({
  token: null,
  user: null,
  role: 'USER_ROLE',
  isAuthenticated: false,
  _hasHydrated: false,
  login: async (accessToken, user, refreshToken) => {
    set({ token: accessToken, user, role: user?.role || 'USER_ROLE', isAuthenticated: true });
    if (refreshToken) {
      await SecureStore.setItemAsync('refreshToken', refreshToken);
    }
  },
  logout: async () => {
    set({ token: null, user: null, role: 'USER_ROLE', isAuthenticated: false });
    try {
      await SecureStore.deleteItemAsync('refreshToken');
    } catch (e) {
      // ignore
    }
  },
  setAccessToken: (token) => set({ token, isAuthenticated: !!token }),
  updateUser: (user) => set({ user, role: user?.role || 'USER_ROLE' }),
  isAdmin: () => get().role === 'ADMIN_ROLE'
}), {
  name: 'auth',
  storage: createJSONStorage(() => AsyncStorage),
  onRehydrateStorage: () => (state) => {
    // marca que la store fue rehidratada
    if (state) {
      setTimeout(() => {
        const set = getStateSetter();
        if (set) set({ _hasHydrated: true });
      }, 0);
    }
  }
}));

// Helper para acceder a set fuera del closure de persist
function getStateSetter() {
  try {
    const store = useAuthStore;
    return store.setState;
  } catch (e) {
    return null;
  }
}

export default useAuthStore;
