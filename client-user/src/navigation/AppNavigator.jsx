// File: src/navigation/AppNavigator.jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack.jsx';
import MainTabs from './MainTabs.jsx';
import useAuthStore from '../shared/store/authStore.js';
import { LoadingSpinner } from '../shared/components/common/Common.jsx';

export default function AppNavigator() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
