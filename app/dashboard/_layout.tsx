import React from 'react';
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import lightTheme, { darkTheme } from '../../src/utils/theme';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabsLayout() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textHint,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.divider,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="advisor"
        options={{
          title: 'Advisor',
          tabBarIcon: ({ color }) => (
            <Ionicons name="bulb-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: 'Transaction',
          tabBarButton: () => null, // Hide this tab from tab bar
          headerShown: true,
          headerTitle: 'Transaction Details',
        }}
      />
    </Tabs>
  );
}