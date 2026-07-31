export const ENDPOINTS = {
  AUTH: process.env.EXPO_PUBLIC_AUTH_URL || 'http://localhost:3026/api/v1/auth',
  API: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3022/gastreatGT/Admin/v1',
  USER: process.env.EXPO_PUBLIC_USER_URL || 'http://localhost:3024/gastreatGT/User/v1'
};
