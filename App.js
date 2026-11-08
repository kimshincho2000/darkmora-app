import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';

import { AuthProvider } from './src/context/AuthContext';
import { BookmarkProvider } from './src/context/BookmarkContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgSurface,
    text: colors.text,
    border: colors.cardBorder,
    primary: colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BookmarkProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" backgroundColor={colors.bg} />
            <RootNavigator />
          </NavigationContainer>
        </BookmarkProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
