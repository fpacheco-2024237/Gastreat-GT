// File: src/shared/constants/endpoints.js
export const ENDPOINTS = {
  AUTH: process.env.EXPO_PUBLIC_AUTH_URL || 'http://localhost:3000/gastreatGT/auth/v1',
  API: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/gastreatGT/Admin/v1'
};
