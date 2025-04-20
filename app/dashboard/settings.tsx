import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '../../src/components/ui/ThemedView';
import { useTheme, ThemeMode } from '../../src/context/ThemeContext';
import lightTheme, { darkTheme } from '../../src/utils/theme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function SettingsScreen() {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleThemeChange = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  return (
    <ThemedView>
      <Animated.View 
        style={styles.container}
        entering={FadeIn.duration(300)}
      >
        <ScrollView>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Appearance
            </Text>
            
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                Theme
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.option,
                  themeMode === 'light' && [styles.selectedOption, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons 
                    name="sunny-outline" 
                    size={24} 
                    color={themeMode === 'light' ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
                    Light
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    Light background with dark text
                  </Text>
                </View>
                {themeMode === 'light' && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={theme.colors.primary} 
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.option,
                  themeMode === 'dark' && [styles.selectedOption, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons 
                    name="moon-outline" 
                    size={24} 
                    color={themeMode === 'dark' ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
                    Dark
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    Dark background with light text
                  </Text>
                </View>
                {themeMode === 'dark' && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={theme.colors.primary} 
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.option,
                  themeMode === 'system' && [styles.selectedOption, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => handleThemeChange('system')}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons 
                    name="phone-portrait-outline" 
                    size={24} 
                    color={themeMode === 'system' ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
                    System
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    Follow system settings
                  </Text>
                </View>
                {themeMode === 'system' && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={theme.colors.primary} 
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: 12,
  },
}); 