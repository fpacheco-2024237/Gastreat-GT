// File: src/navigation/MainTabs.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import useAuthStore from '../shared/store/authStore.js';
import { COLORS, SPACING, FONT_SIZE } from '../shared/constants/theme.js';
import MenuScreen from '../features/menu/MenuScreen.jsx';
import DishDetailScreen from '../features/menu/DishDetailScreen.jsx';
import PedidosScreen from '../features/orders/PedidosScreen.jsx';
import NewOrderScreen from '../features/orders/NewOrderScreen.jsx';
import OrderDetailScreen from '../features/orders/OrderDetailScreen.jsx';
import MyReservationsListScreen from '../features/reservations/MyReservationsListScreen.jsx';
import CreateReservationScreen from '../features/reservations/CreateReservationScreen.jsx';
import ReservationDetailScreen from '../features/reservations/ReservationDetailScreen.jsx';
import TablesStatusScreen from '../features/reservations/TablesStatusScreen.jsx';
import HistorialScreen from '../features/history/HistorialScreen.jsx';
import ProfileScreen from '../features/profile/ProfileScreen.jsx';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* Menu Stack */
function MenuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MenuList">
      <Stack.Screen name="MenuList" component={MenuScreen} />
      <Stack.Screen name="DishDetail" component={DishDetailScreen} />
    </Stack.Navigator>
  );
}

/* Pedidos Stack */
function PedidosStack() {
  const { role } = useAuthStore();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={role === 'USER_ROLE' ? "MyOrdersList" : "AllOrdersList"}>
      {role === 'USER_ROLE' ? (
        <>
          <Stack.Screen name="MyOrdersList" component={PedidosScreen} />
          <Stack.Screen name="NewOrder" component={NewOrderScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="AllOrdersList" component={PedidosScreen} />
        </>
      )}
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

/* Reservas Stack */
function ReservasStack() {
  const { role } = useAuthStore();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={role === 'USER_ROLE' ? "MyReservationsList" : "TablesStatus"}>
      {role === 'USER_ROLE' ? (
        <>
          <Stack.Screen name="MyReservationsList" component={MyReservationsListScreen} />
          <Stack.Screen name="CreateReservation" component={CreateReservationScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="TablesStatus" component={TablesStatusScreen} />
        </>
      )}
      <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
    </Stack.Navigator>
  );
}

/* Historial Stack */
function HistorialStack() {
  const { role } = useAuthStore();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === 'USER_ROLE' ? (
        <>
          <Stack.Screen name="OrderHistory" component={HistorialScreen} />
          <Stack.Screen name="ReservationHistory" component={HistorialScreen} />
        </>
      ) : (
        <Stack.Screen name="BillingHistory" component={HistorialScreen} />
      )}
    </Stack.Navigator>
  );
}

/* Profile Screen */

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarStyle: { backgroundColor: COLORS.surface, height: 60, borderTopColor: COLORS.border },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'restaurant-menu';
          if (route.name === 'Pedidos') iconName = 'receipt-long';
          if (route.name === 'Reservas') iconName = 'event-seat';
          if (route.name === 'Historial') iconName = 'history';
          if (route.name === 'Perfil') iconName = 'person';
          return <MaterialIcons name={iconName} size={24} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Menú" component={MenuStack} />
      <Tab.Screen name="Pedidos" component={PedidosStack} />
      <Tab.Screen name="Reservas" component={ReservasStack} />
      <Tab.Screen name="Historial" component={HistorialStack} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ headerShown: true }} />
    </Tab.Navigator>
  );
}
