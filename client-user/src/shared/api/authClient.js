// File: src/shared/api/authClient.js
import axios from 'axios';
import { ENDPOINTS } from '../constants/endpoints.js';
import * as SecureStore from 'expo-secure-store';
import useAuthStore from '../store/authStore.js';

const authBase = axios.create({ baseURL: ENDPOINTS.AUTH, headers: { 'Content-Type': 'application/json' } });

const excludedPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/resend-verification'];

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

authBase.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authBase.interceptors.response.use((res) => res, async (err) => {
  const originalRequest = err.config;
  if (!originalRequest || !err.response) return Promise.reject(err);
  if (err.response.status === 401 && !originalRequest._retry) {
    // No refrescar en paths excluidos
    const path = originalRequest.url || '';
    if (excludedPaths.some(p => path.endsWith(p))) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return authBase.request(originalRequest);
      }).catch(e => Promise.reject(e));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${ENDPOINTS.AUTH}/refresh`, { refreshToken });
      const { accessToken } = response.data || {};
      if (accessToken) {
        useAuthStore.getState().setAccessToken(accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return authBase.request(originalRequest);
      }
      throw new Error('No accessToken in refresh response');
    } catch (refreshError) {
      processQueue(refreshError, null);
      await useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
  return Promise.reject(err);
});

export default authBase;
