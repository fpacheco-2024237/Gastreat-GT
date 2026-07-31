import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack.jsx';
import MainTabs from './MainTabs.jsx';
import RestaurantsScreen from '../features/restaurants/screens/RestaurantsScreen.jsx';
import useAuthStore from '../shared/store/authStore.js';
import useRestaurantStore from '../shared/store/restaurantStore.js';
import { LoadingSpinner } from '../shared/components/common/Common.jsx';

const RootStack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { restaurantId } = useRestaurantStore();

  if (!_hasHydrated) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : !restaurantId ? (
          <RootStack.Screen name="RestaurantsSelect" component={RestaurantsScreen} />
        ) : (
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
