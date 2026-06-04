import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginRequest, register as registerRequest } from '../../../shared/api';
import { showError } from '../../../shared/utils/toast.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      loading: false,
      error: null,
      isLoadingAuth: true,
      isAuthenticated: false,
      //Verificar si hay sesión activa pero no es Admin, se limpia la sesión
      checkAuth: () => {
        const token = get().token;
        const role = get().user?.role;
        const isAdmin = role === 'ADMIN_ROLE';
        if (token && !isAdmin) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoadingAuth: false,
            error: 'Notienes permisos para acceder a esta aplicación',
          });
          return;
        }
        set({
          isLoadingAuth: false,
          isAuthenticated: Boolean(token) && isAdmin,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      login: async ({ emailOrUsername, password }) => {
        try {
          set({ loading: true, error: null });
          const { data } = await loginRequest({ emailOrUsername, password });
          const role = data?.user?.role;
          console.log(role);
          if (role !== 'ADMIN_ROLE') {
            const message = 'No tienes permisos para acceder a esta aplicación';
            set({
              user: null,
              token: null,
              refreshToken: null,
              expiresAt: null,
              isAuthenticated: false,
              isLoadingAuth: false,
              error: message,
            });
            showError(message);
            return { success: false, error: message };
          }

          set({
            user: data.user,
            token: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
            isAuthenticated: true,
            loading: false,
          });
          console.log(data.accessToken);
          console.log(data.expiresAt);
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Error al iniciar sesión';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      register: async (formData) => {
        try {
          set({ loading: true, error: null });
          const { data } = await registerRequest(formData);
          set({ loading: false });
          return {
            success: true,
            emailVerificationRequired: data?.emailVerificationRequired,
            data,
          };
        } catch (err) {
          const message = err.response?.data?.message || 'Error al registrar usuario';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },
    }),
    { name: 'auth-KS-IN6AV' }
  )
);
