import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Layers, Bookmark, User } from 'lucide-react-native';

import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import MyListScreen from '../screens/MyListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AnimeDetailScreen from '../screens/AnimeDetailScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SearchScreen from '../screens/SearchScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primaryGlow,
        tabBarInactiveTintColor: colors.textDim,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Asosiy',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="CatalogTab"
        component={CatalogScreen}
        options={{
          tabBarLabel: 'Katalog',
          tabBarIcon: ({ color, size }) => <Layers size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyListTab"
        component={MyListScreen}
        options={{
          tabBarLabel: 'Ro\'yxatim',
          tabBarIcon: ({ color, size }) => <Bookmark size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AnimeDetail" component={AnimeDetailScreen} />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          animation: 'fade',
          orientation: 'all',
        }}
      />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(10, 11, 16, 0.95)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
