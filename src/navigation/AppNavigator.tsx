import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../app/hooks';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../miniApps/profile/ProfileScreen';
import DashboardScreen from '../miniApps/dashboard/DashboardScreen';
import { MapViewScreen } from '../miniApps/geomatics';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MiniAppTabs() {
  const userRole = useAppSelector((state) => state.auth.user?.role);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3333CC',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'android' ? 12 : 5,
          height: Platform.OS === 'android' ? 68 : 55,
        },
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
      {userRole !== 'user' && (
        <Tab.Screen
          name="Maps"
          component={MapViewScreen}
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
      )}
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
