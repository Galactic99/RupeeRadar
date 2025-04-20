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
import theme from '../src/utils/theme';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';

export default function SMSInputScreen() {
  const [smsText, setSmsText] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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
        const category = await categorizeTransaction(parsedTransaction.description);
        
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
    <>
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
        style={styles.container} 
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
          <Text style={styles.label}>Paste your bank transaction SMS below</Text>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
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
              style={styles.errorText}
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
            icon={!isLoading ? <Ionicons name="analytics-outline" size={20} color="white" style={styles.buttonIcon} /> : undefined}
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
              icon={!isSaving ? <Ionicons name="save-outline" size={20} color="white" style={styles.buttonIcon} /> : undefined}
            />
          </Animated.View>
        )}

        <View style={styles.examples}>
          <Text style={styles.examplesTitle}>Example SMS Formats</Text>
          
          <Animated.View 
            style={styles.exampleCard}
            entering={FadeInUp.duration(400).delay(400)}
          >
            <Text style={styles.exampleLabel}>HDFC Bank</Text>
            <Text style={styles.exampleText}>
              HDFC Bank: INR 1,499.00 debited from a/c XX1234 on 12-04-23 AMAZON. Avl bal: INR 24,599.35
            </Text>
          </Animated.View>
          
          <Animated.View 
            style={styles.exampleCard}
            entering={FadeInUp.duration(400).delay(500)}
          >
            <Text style={styles.exampleLabel}>ICICI Bank</Text>
            <Text style={styles.exampleText}>
              Rs.850.00 debited from a/c XX3456 on 13-Apr-23 towards UPI-SWIGGY RefNo 123456789012.
            </Text>
          </Animated.View>
          
          <Animated.View 
            style={styles.exampleCard}
            entering={FadeInUp.duration(400).delay(600)}
          >
            <Text style={styles.exampleLabel}>SBI</Text>
            <Text style={styles.exampleText}>
              Your A/c X4321 is debited with Rs.2,500.00 on 10/04/2023 (UPI Ref No 123456789) and A/c bal is Rs 52,425.75
            </Text>
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    flexGrow: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
  textInputContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    paddingRight: 50,
    minHeight: 120,
    fontSize: 15,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.small,
  },
  inputActions: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    flexDirection: 'row',
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  pasteButton: {
    padding: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
  previewContainer: {
    marginBottom: theme.spacing.xl,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
  examples: {
    marginTop: theme.spacing.lg,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  exampleCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  exampleText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  buttonIcon: {
    marginRight: theme.spacing.xs,
  },
}); 