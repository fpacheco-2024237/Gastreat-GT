// File: src/shared/api/apiClient.js
import axios from 'axios';
import { ENDPOINTS } from '../constants/endpoints.js';
import * as SecureStore from 'expo-secure-store';
import useAuthStore from '../store/authStore.js';

const api = axios.create({ baseURL: ENDPOINTS.API, headers: { 'Content-Type': 'application/json' } });

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((res) => res, async (err) => {
  const originalRequest = err.config;
  if (!originalRequest || !err.response) return Promise.reject(err);

  if (err.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api.request(originalRequest);
      }).catch(e => Promise.reject(e));
    }

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
        return api.request(originalRequest);
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

export default api;
