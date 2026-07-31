// File: src/navigation/AuthStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../features/auth/screens/LoginScreen.jsx';
import RegisterScreen from '../features/auth/screens/RegisterScreen.jsx';
import VerifyEmailScreen from '../features/auth/screens/VerifyEmailScreen.jsx';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    // Flujo de autenticacion: login, registro y verificación de correo.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  );
}
