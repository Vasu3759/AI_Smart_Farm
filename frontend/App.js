import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FarmDataFormScreen from './src/screens/FarmDataFormScreen';
import MapScreen from './src/screens/MapScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Predict') iconName = 'activity';
          else if (route.name === 'History') iconName = 'clock';
          else if (route.name === 'Profile') iconName = 'user';
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#064E3B', // Dark Green
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: '#F9FAFB',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.05)',
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
        }
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Predict" component={FarmDataFormScreen} />
      <Tab.Screen name="History" component={HistoryScreen} /> 
      <Tab.Screen name="Profile" component={ProfileScreen} /> 
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Map" 
          component={MapScreen} 
          options={{ 
            title: 'Draw Boundary', 
            headerStyle: { backgroundColor: '#064E3B' }, 
            headerTintColor: '#FFF' 
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
