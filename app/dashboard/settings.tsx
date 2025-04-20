import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '../../src/components/ui/ThemedView';
import { useTheme, ThemeMode } from '../../src/context/ThemeContext';
import { useSMS } from '../../src/context/SMSContext';
import lightTheme, { darkTheme } from '../../src/utils/theme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { checkSMSModuleAvailability } from '../../src/services/smsService';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();
  const { hasPermissions, requestPermissions, isListening, isAvailable, startListening, stopListening } = useSMS();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const router = useRouter();

  const handleThemeChange = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  const handleRequestSMSPermissions = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPermissionError(null);
    
    // Check module availability first
    if (!isAvailable) {
      setPermissionError(`SMS module is not available on this device`);
      Alert.alert(
        'SMS Module Not Available',
        `Cannot request permissions: SMS detection is not available on this device`,
        [
          { text: 'OK' }
        ]
      );
      return;
    }
    
    console.log('Requesting SMS permissions...');
    try {
      const granted = await requestPermissions();
      console.log('Permission request result:', granted);
      
      if (granted) {
        console.log('Permissions were granted');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Permissions Granted',
          'RupeeRadar can now automatically process your transaction SMS messages.'
        );
      } else {
        console.log('Permissions were denied');
        setPermissionError('Permissions were denied by the user');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Permissions Denied',
          'Without SMS permissions, RupeeRadar cannot automatically track your expenses. You can still manually add transactions.',
          [
            { text: 'OK' },
            { 
              text: 'Try Again', 
              onPress: handleRequestSMSPermissions 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionError(`Error: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert(
        'Permission Error',
        'An error occurred while requesting permissions. Please try again.'
      );
    }
  };

  const toggleSMSListener = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isListening) {
      stopListening();
      Alert.alert('SMS Listener Stopped', 'Transaction SMS detection has been stopped.');
    } else {
      startListening();
      Alert.alert('SMS Listener Started', 'RupeeRadar will now automatically detect transaction SMS messages.');
    }
  };

  // Check module status
  const checkModuleStatus = () => {
    const status = checkSMSModuleAvailability();
    
    Alert.alert(
      'SMS Module Status',
      status.available 
        ? 'SMS module is available and properly configured.' 
        : `SMS module is not available: ${status.reason || 'Unknown reason'}`
    );
  };

  // Try fallback method using Android Intent for SMS permissions
  const requestSMSPermissionsManually = () => {
    if (Platform.OS !== 'android') return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Manual Permissions',
        'Would you like to manually open Android SMS permissions? This will take you to the app settings where you can enable permissions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: async () => {
              try {
                console.log('Opening app settings...');
                await Linking.openSettings();
              } catch (error) {
                console.error('Error opening settings:', error);
                Alert.alert('Error', 'Could not open app settings.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in manual permissions:', error);
    }
  };

  const navigateToManualInput = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/sms-input');
  };

  return (
    <ThemedView>
      <Animated.View 
        style={styles.container}
        entering={FadeIn.duration(300)}
      >
        <ScrollView>
          {/* SMS Auto-Detection Section */}
          {Platform.OS === 'android' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                SMS Auto-Detection
              </Text>
              
              <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Transaction SMS Detection
                </Text>
                
                {isAvailable ? (
                  <>
                    <View style={styles.permissionStatus}>
                      <Ionicons 
                        name={hasPermissions ? "checkmark-circle" : "close-circle"} 
                        size={24} 
                        color={hasPermissions ? theme.colors.success : theme.colors.error} 
                      />
                      <Text style={[
                        styles.statusText, 
                        { color: hasPermissions ? theme.colors.success : theme.colors.error }
                      ]}>
                        {hasPermissions ? 'Permissions Granted' : 'Permissions Required'}
                      </Text>
                    </View>
                    
                    {!hasPermissions ? (
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.primary }]}
                        onPress={handleRequestSMSPermissions}
                      >
                        <Text style={styles.buttonText}>Request SMS Permissions</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.button, 
                          { 
                            backgroundColor: isListening 
                              ? theme.colors.error 
                              : theme.colors.primary 
                          }
                        ]}
                        onPress={toggleSMSListener}
                      >
                        <Text style={styles.buttonText}>
                          {isListening ? 'Stop SMS Detection' : 'Start SMS Detection'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {permissionError && (
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {permissionError}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.infoContainer}>
                      <Ionicons 
                        name="information-circle" 
                        size={24} 
                        color={theme.colors.info} 
                      />
                      <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                        SMS detection is not available on this device or the SMS library is not properly configured.
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: theme.colors.primary }]}
                      onPress={navigateToManualInput}
                    >
                      <Text style={styles.buttonText}>Enter Transaction Manually</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

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
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
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
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
}); 