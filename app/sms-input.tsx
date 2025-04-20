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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { parseTransactionSMS } from '../src/utils/smsParser';
import { categorizeTransaction } from '../src/utils/categoryEngine';
import TransactionPreview from '../src/components/transaction/TransactionPreview';
import Button from '../src/components/ui/Button';
import { Transaction } from '../src/types/transaction';
import { saveTransaction as saveTransactionToStorage } from '../src/services/storageService';

export default function SMSInputScreen() {
  const [smsText, setSmsText] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    } else {
      Alert.alert('Clipboard Empty', 'There is no text in the clipboard to paste.');
    }
  };

  // Function to analyze SMS text
  const analyzeSMS = async () => {
    Keyboard.dismiss();
    
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
      } else {
        setError('Could not identify transaction details from the SMS. Please check the format.');
      }
    } catch (err) {
      console.error('Error parsing SMS:', err);
      setError('An error occurred while analyzing the SMS.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save the transaction
  const saveTransaction = async () => {
    if (!transaction) return;
    
    try {
      setIsLoading(true);
      
      // Save to AsyncStorage using our service
      await saveTransactionToStorage(transaction);
      
      // Success message
      Alert.alert(
        'Transaction Saved', 
        'Transaction has been successfully saved.',
        [
          { text: 'OK', onPress: () => router.push('/dashboard') }
        ]
      );
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear the input
  const clearInput = () => {
    setSmsText('');
    setTransaction(null);
    setError(null);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'SMS Analysis',
          headerShown: true
        }} 
      />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Paste your bank transaction SMS below</Text>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              multiline
              value={smsText}
              onChangeText={setSmsText}
              placeholder="Paste your SMS here..."
              placeholderTextColor="#999"
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
                  <Ionicons name="close-circle" size={24} color="#888" />
                </TouchableOpacity>
              ) : null}
              
              <TouchableOpacity 
                style={styles.pasteButton} 
                onPress={pasteFromClipboard}
              >
                <Ionicons name="clipboard-outline" size={24} color="#2196F3" />
              </TouchableOpacity>
            </View>
          </View>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <Button
            title="Analyze SMS"
            onPress={analyzeSMS}
            loading={isLoading}
            disabled={!smsText.trim()}
            style={styles.button}
          />
        </View>

        {transaction ? (
          <View style={styles.previewContainer}>
            <TransactionPreview transaction={transaction} />
            
            <Button
              title="Save Transaction"
              onPress={saveTransaction}
              variant="primary"
              style={styles.saveButton}
            />
          </View>
        ) : null}

        <View style={styles.examples}>
          <Text style={styles.examplesTitle}>Example SMS Formats</Text>
          
          <Text style={styles.exampleText}>
            HDFC Bank: INR 1,499.00 debited from a/c XX1234 on 12-04-23 AMAZON. Avl bal: INR 24,599.35
          </Text>
          
          <Text style={styles.exampleText}>
            INR 699 debited from A/c no XX5678 on 15-04-23 UPI-ZOMATO. Bal: INR 18,432.56
          </Text>

          <Text style={styles.exampleText}>
            Dear UPI user A/C X4963 debited by 60.0 on date 18Feb25 trf to Jamal Store Refno 541567581752. If not u? call 1800111109. -SBI
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  textInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  textInput: {
    height: 120,
    padding: 12,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
  },
  inputActions: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  pasteButton: {
    padding: 4,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  errorText: {
    color: '#f44336',
    marginBottom: 10,
  },
  previewContainer: {
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 10,
    width: '100%',
  },
  examples: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  exampleText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#2196F3',
  },
}); 