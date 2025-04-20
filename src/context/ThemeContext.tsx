import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Theme type
export type ThemeMode = 'light' | 'dark' | 'system';

// Context type
type ThemeContextType = {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  isDarkMode: false,
  setThemeMode: () => {},
});

// Storage key for the theme
const THEME_MODE_KEY = '@rupee_radar_theme_mode';

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceTheme === 'dark');

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (savedTheme) {
          setThemeMode(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Update isDarkMode when themeMode or device theme changes
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(deviceTheme === 'dark');
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode, deviceTheme]);

  // Save theme to storage when it changes
  const handleSetThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDarkMode,
        setThemeMode: handleSetThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext); 