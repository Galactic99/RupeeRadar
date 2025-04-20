import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Keyboard,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { parseTransactionSMS } from '../src/utils/smsParser';
import { categorizeTransaction } from '../src/utils/categoryEngine';
import TransactionPreview from '../src/components/transaction/TransactionPreview';
import Button from '../src/components/ui/Button';
import LoadingIndicator from '../src/components/ui/LoadingIndicator';
import { Transaction } from '../src/types/transaction';
import { saveTransaction as saveTransactionToStorage } from '../src/services/storageService';
import lightTheme, { darkTheme } from '../src/utils/theme';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import ThemedView from '../src/components/ui/ThemedView';

export default function SMSInputScreen() {
  const [smsText, setSmsText] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Clear transaction preview when SMS text changes
  useEffect(() => {
    if (smsText.trim() === '' && transaction) {
      setTransaction(null);
    }
    
    // Clear error when text changes
    if (error && smsText.trim() !== '') {
      setError(null);
    }
  }, [smsText]);

  // Function to paste text from clipboard
  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setSmsText(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Alert.alert('Clipboard Empty', 'There is no text in the clipboard to paste.');
    }
  };

  // Function to analyze SMS text
  const analyzeSMS = async () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!smsText.trim()) {
      setError('Please enter SMS text to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Parse the SMS to get transaction details
      const parsedTransaction = parseTransactionSMS(smsText);
      
      if (parsedTransaction) {
        // Add category to the transaction - use await to resolve the promise
        const category = await categorizeTransaction(
          parsedTransaction.description,
          parsedTransaction.amount
        );
        
        const transactionWithCategory = {
          ...parsedTransaction,
          category
        };
        
        setTransaction(transactionWithCategory);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError('Could not identify transaction details from the SMS. Please check the format.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      console.error('Error parsing SMS:', err);
      setError('An error occurred while analyzing the SMS.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save the transaction
  const saveTransaction = async () => {
    if (!transaction) return;
    
    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Save to AsyncStorage using our service
      await saveTransactionToStorage(transaction);
      
      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Success message
      Alert.alert(
        'Transaction Saved', 
        'Transaction has been successfully saved.',
        [
          { text: 'OK', onPress: () => router.push("/dashboard/expenses" as any) }
        ]
      );
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to clear the input
  const clearInput = () => {
    setSmsText('');
    setTransaction(null);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Function to refresh screen
  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Clear data
    setSmsText('');
    setTransaction(null);
    setError(null);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <ThemedView>
      <Stack.Screen 
        options={{ 
          title: 'SMS Analysis',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.primary,
          headerShadowVisible: false,
        }} 
      />
      <Animated.ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        entering={FadeIn.duration(300)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View 
          style={styles.inputContainer}
          entering={FadeInUp.duration(500).springify()}
        >
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
            Paste your bank transaction SMS below
          </Text>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.textInput, 
                { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.divider,
                }
              ]}
              multiline
              value={smsText}
              onChangeText={setSmsText}
              placeholder="Paste your SMS here..."
              placeholderTextColor={theme.colors.textHint}
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
            />
            
            <View style={styles.inputActions}>
              {smsText ? (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={clearInput}
                >
                  <Ionicons name="close-circle" size={24} color={theme.colors.textHint} />
                </TouchableOpacity>
              ) : null}
              
              <TouchableOpacity 
                style={styles.pasteButton} 
                onPress={pasteFromClipboard}
              >
                <Ionicons name="clipboard-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {error ? (
            <Animated.Text 
              style={[styles.errorText, { color: theme.colors.error }]}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              {error}
            </Animated.Text>
          ) : null}
          
          <Button
            title="Analyze SMS"
            onPress={analyzeSMS}
            loading={isLoading}
            disabled={!smsText.trim()}
            style={styles.button}
            icon={!isLoading ? <Ionicons name="analytics-outline" size={20} color={isDarkMode ? "#FFFFFF" : "white"} style={styles.buttonIcon} /> : undefined}
          />
        </Animated.View>

        {isLoading && (
          <LoadingIndicator text="Analyzing SMS message..." />
        )}

        {transaction && !isLoading && (
          <Animated.View 
            style={styles.previewContainer}
            entering={FadeInUp.duration(500).delay(200)}
          >
            <TransactionPreview transaction={transaction} />
            
            <Button
              title="Save Transaction"
              onPress={saveTransaction}
              loading={isSaving}
              variant="primary"
              style={styles.saveButton}
              icon={!isSaving ? <Ionicons name="save-outline" size={20} color={isDarkMode ? "#FFFFFF" : "white"} style={styles.buttonIcon} /> : undefined}
            />
          </Animated.View>
        )}

        <View style={styles.examples}>
          <Text style={[styles.examplesTitle, { color: theme.colors.textPrimary }]}>Example SMS Formats</Text>
          
          <Animated.View 
            style={[styles.exampleCard, { backgroundColor: theme.colors.surfaceVariant }]}
            entering={FadeInUp.duration(400).delay(400)}
          >
            <Text style={[styles.exampleLabel, { color: theme.colors.primary }]}>HDFC Bank</Text>
            <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
              HDFC Bank: INR 1,499.00 debited from a/c XX1234 on 12-04-23 AMAZON. Avl bal: INR 24,599.35
            </Text>
          </Animated.View>
          
          <Animated.View 
            style={[styles.exampleCard, { backgroundColor: theme.colors.surfaceVariant }]}
            entering={FadeInUp.duration(400).delay(500)}
          >
            <Text style={[styles.exampleLabel, { color: theme.colors.primary }]}>ICICI Bank</Text>
            <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
              Rs.850.00 debited from a/c XX3456 on 13-Apr-23 towards UPI-SWIGGY RefNo 123456789012.
            </Text>
          </Animated.View>
          
          <Animated.View 
            style={[styles.exampleCard, { backgroundColor: theme.colors.surfaceVariant }]}
            entering={FadeInUp.duration(400).delay(600)}
          >
            <Text style={[styles.exampleLabel, { color: theme.colors.primary }]}>SBI</Text>
            <Text style={[styles.exampleText, { color: theme.colors.textSecondary }]}>
              Your A/c X4321 is debited with Rs.2,500.00 on 10/04/2023 (UPI Ref No 123456789) and A/c bal is Rs 52,425.75
            </Text>
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
    flexGrow: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    minHeight: 120,
    fontSize: 15,
    borderWidth: 1,
  },
  inputActions: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  pasteButton: {
    padding: 4,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    marginTop: 8,
  },
  previewContainer: {
    marginBottom: 32,
  },
  saveButton: {
    marginTop: 16,
  },
  examples: {
    marginTop: 24,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  exampleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonIcon: {
    marginRight: 4,
  },
}); 