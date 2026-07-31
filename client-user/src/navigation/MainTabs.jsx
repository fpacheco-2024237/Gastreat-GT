// File: src/navigation/MainTabs.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import useAuthStore from '../shared/store/authStore.js';
import { COLORS } from '../shared/constants/theme.js';
import MenuScreen from '../features/menu/screens/MenuScreen.jsx';
import DishDetailScreen from '../features/menu/screens/DishDetailScreen.jsx';
import PedidosScreen from '../features/orders/screens/PedidosScreen.jsx';
import NewOrderScreen from '../features/orders/screens/NewOrderScreen.jsx';
import OrderDetailScreen from '../features/orders/screens/OrderDetailScreen.jsx';
import MyReservationsListScreen from '../features/reservations/screens/MyReservationsListScreen.jsx';
import CreateReservationScreen from '../features/reservations/screens/CreateReservationScreen.jsx';
import ReservationDetailScreen from '../features/reservations/screens/ReservationDetailScreen.jsx';
import TablesStatusScreen from '../features/reservations/screens/TablesStatusScreen.jsx';
import HistorialScreen from '../features/history/screens/HistorialScreen.jsx';
import ProfileScreen from '../features/profile/ProfileScreen.jsx';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack principal del menú: navegación de platillos y detalle.
function MenuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MenuList">
      <Stack.Screen name="MenuList" component={MenuScreen} />
      <Stack.Screen name="DishDetail" component={DishDetailScreen} />
    </Stack.Navigator>
  );
}

// Stack de pedidos: cambia la experiencia según el rol activo.
function PedidosStack() {
  const { role } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={role === 'USER_ROLE' ? 'MyOrdersList' : 'AllOrdersList'}
    >
      {role === 'USER_ROLE' ? (
        <>
          <Stack.Screen name="MyOrdersList" component={PedidosScreen} />
          <Stack.Screen name="NewOrder" component={NewOrderScreen} />
        </>
      ) : (
        <Stack.Screen name="AllOrdersList" component={PedidosScreen} />
      )}
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

// Stack de reservas: usuario ve sus reservas; admin gestiona mesas.
function ReservasStack() {
  const { role } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={role === 'USER_ROLE' ? 'MyReservationsList' : 'TablesStatus'}
    >
      {role === 'USER_ROLE' ? (
        <>
          <Stack.Screen name="MyReservationsList" component={MyReservationsListScreen} />
          <Stack.Screen name="CreateReservation" component={CreateReservationScreen} />
        </>
      ) : (
        <Stack.Screen name="TablesStatus" component={TablesStatusScreen} />
      )}
      <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
    </Stack.Navigator>
  );
}

// Stack de historial: usa el mismo componente con datos distintos por rol.
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

export default function MainTabs() {
  return (
    // Barra inferior compartida para las cinco áreas principales.
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          height: 60,
          borderTopColor: COLORS.border,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'restaurant-menu';
          if (route.name === 'Pedidos') iconName = 'receipt-long';
          if (route.name === 'Reservas') iconName = 'event-seat';
          if (route.name === 'Historial') iconName = 'history';
          if (route.name === 'Perfil') iconName = 'person';
          return <MaterialIcons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Menu" component={MenuStack} options={{ title: 'Menú' }} />
      <Tab.Screen name="Pedidos" component={PedidosStack} />
      <Tab.Screen name="Reservas" component={ReservasStack} />
      <Tab.Screen name="Historial" component={HistorialStack} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ headerShown: true }} />
    </Tab.Navigator>
  );
}
