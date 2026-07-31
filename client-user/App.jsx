// File: App.jsx
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/shared/constants/theme.js';
import AppNavigator from './src/navigation/AppNavigator.jsx';

export default function App() {
  return (
    // Root del cliente: provider de safe area, status bar y navegacion.
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
