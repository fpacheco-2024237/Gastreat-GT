// File: src/features/auth/hooks/useAuth.js
import { useState } from 'react';
import authClient from '../../../shared/api/authClient.js';
import useAuthStore from '../../../shared/store/authStore.js';

export default function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const store = useAuthStore();

  const normalizeLoginResponse = (data) => {
    // tolerar { accessToken, refreshToken, userDetails } o { token, user }
    const accessToken = data.accessToken || data.token || data.access_token || null;
    const refreshToken = data.refreshToken || data.refresh_token || null;
    const user = data.userDetails || data.user || data.user_details || null;
    return { accessToken, refreshToken, user };
  };

  const handleLogin = async ({ emailOrUsername, password }) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authClient.post('/login', { emailOrUsername, password });
      const data = resp.data || {};
      const { accessToken, refreshToken, user } = normalizeLoginResponse(data);
      if (!accessToken) throw new Error('Respuesta inválida del servidor');
      await store.login(accessToken, user, refreshToken);
      setLoading(false);
      return { ok: true };
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Error en autenticación');
      setLoading(false);
      return { ok: false, error: e };
    }
  };

  const handleRegister = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      // No exponer rol; el backend asigna USER_ROLE
      const resp = await authClient.post('/register', payload);
      setLoading(false);
      return { ok: true, data: resp.data };
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Error en registro');
      setLoading(false);
      return { ok: false, error: e };
    }
  };

  const logout = async () => {
    await store.logout();
  };

  return { handleLogin, handleRegister, loading, error, logout };
}
