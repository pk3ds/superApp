import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../app/hooks';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../miniApps/profile/ProfileScreen';
import DashboardScreen from '../miniApps/dashboard/DashboardScreen';
import { MapViewScreen, GPSToolsScreen, DataCollectionScreen, WorkLocationsScreen } from '../miniApps/geomatics';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GeomaticsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#3333CC' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="MapView"
        component={MapViewScreen}
        options={{ title: 'Map' }}
      />
      <Stack.Screen
        name="GPSTools"
        component={GPSToolsScreen}
        options={{ title: 'GPS Tools' }}
      />
      <Stack.Screen
        name="DataCollection"
        component={DataCollectionScreen}
        options={{ title: 'Data Collection' }}
      />
      <Stack.Screen
        name="WorkLocations"
        component={WorkLocationsScreen}
        options={{ title: 'Company Locations' }}
      />
    </Stack.Navigator>
  );
}

function MiniAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3333CC',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { paddingBottom: 5, height: 55 },
        headerStyle: { backgroundColor: '#3333CC' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Geomatics"
        component={GeomaticsStack}
        options={{
          title: 'Geomatics',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MiniAppTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
