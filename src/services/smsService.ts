import { Platform, PermissionsAndroid } from 'react-native';
import { Transaction } from '../types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { parseTransactionSMS, isTransactionSMS } from '../utils/smsParser';
import { saveTransaction } from './storageService';
import { categorizeTransaction } from '../utils/categoryEngine';
import { verifyTransactionSMS } from './geminiService';
import SmsAndroid from 'react-native-get-sms-android';

/**
 * SMS message interface from the library
 */
export interface SMSMessage {
  _id: string;
  address: string; // The phone number
  body: string;    // The SMS text
  date: string;    // Timestamp
  read: 0 | 1;     // 0 for unread, 1 for read
  seen: 0 | 1;
  status: number;
  type: number;
  thread_id: string;
}

// Cache to store recently processed SMS IDs to avoid duplicates
const recentlyProcessedSMS = new Set<string>();
const MAX_CACHE_SIZE = 100;

// Known bank and financial service sender IDs
const FINANCIAL_SENDERS = [
  'HDFCBK', 'SBIINB', 'ICICIB', 'AXISBK', 'KOTAK', 'YESBNK', 'BOIIND', 
  'PNBSMS', 'CANBNK', 'CENTBK', 'INDBNK', 'UNIONB', 'PAYTM', 'PYTM', 
  'AMAZONPAY', 'PHONPE', 'GPAY', 'UPIBNK'
];

/**
 * Check if the SMS module is available
 */
export const checkSMSModuleAvailability = () => {
  if (Platform.OS !== 'android') {
    return {
      available: false,
      reason: 'SMS reading is only available on Android devices'
    };
  }

  if (typeof SmsAndroid === 'undefined' || !SmsAndroid) {
    return {
      available: false,
      reason: 'SMS module is not properly installed'
    };
  }

  return {
    available: true
  };
};

/**
 * Check if app has required SMS permissions
 */
export const checkSMSPermissions = async () => {
  if (Platform.OS !== 'android') {
    console.log('Not on Android platform, skipping permission check');
    return false;
  }
  
  try {
    const readSmsPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    
    const receiveSmsPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
    );
    
    return {
      hasReadSmsPermission: readSmsPermission,
      hasReceiveSmsPermission: receiveSmsPermission
    };
  } catch (error) {
    console.error('Error checking SMS permissions:', error);
    return false;
  }
};

/**
 * Request SMS read and receive permissions
 */
export const requestSMSPermissions = async () => {
  if (Platform.OS !== 'android') {
    console.log('Not on Android platform, skipping permissions');
    return false;
  }
  
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
    ]);
    
    return (
      granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error('Error requesting SMS permissions:', error);
    return false;
  }
};

/**
 * Check if the sender is likely a financial institution
 */
const isFinancialSender = (address: string): boolean => {
  const senderUpperCase = address.toUpperCase();
  
  // Check if it's in our known list
  if (FINANCIAL_SENDERS.some(sender => senderUpperCase.includes(sender))) {
    return true;
  }
  
  // Check for typical patterns in sender IDs
  if (
    senderUpperCase.includes('BANK') || 
    senderUpperCase.includes('CARD') || 
    senderUpperCase.includes('PAY') || 
    senderUpperCase.includes('UPI') ||
    senderUpperCase.includes('ALERT') ||
    /[A-Z]{2}-[A-Z]{5,6}/.test(senderUpperCase) // Pattern like "VM-HDFCBK"
  ) {
    return true;
  }
  
  return false;
};

/**
 * Add SMS to recently processed cache
 */
const addToProcessedCache = (smsId: string) => {
  // If cache is full, remove oldest entries
  if (recentlyProcessedSMS.size >= MAX_CACHE_SIZE) {
    const idsToRemove = Array.from(recentlyProcessedSMS).slice(0, MAX_CACHE_SIZE / 4);
    idsToRemove.forEach(id => recentlyProcessedSMS.delete(id));
  }
  
  // Add new ID to cache
  recentlyProcessedSMS.add(smsId);
};

/**
 * Process transaction SMS with AI verification
 */
export const processSMSMessage = async (sms: SMSMessage): Promise<Transaction | null> => {
  try {
    // Skip if already processed
    if (recentlyProcessedSMS.has(sms._id)) {
      return null;
    }
    
    // First use pattern matching - fast, but less accurate
    const isLikelyTransaction = isTransactionSMS(sms.body);
    
    // If not even looking like a transaction, skip quickly
    if (!isLikelyTransaction) {
      return null;
    }
    
    // For messages that look like transactions, try AI verification
    // Only use AI if the sender appears to be from a financial institution
    // This helps avoid unnecessary API calls
    let isConfirmedTransaction = true;
    if (isFinancialSender(sms.address)) {
      try {
        const aiVerification = await verifyTransactionSMS(sms.body);
        // Only consider it not a transaction if AI is very confident
        if (!aiVerification.isTransaction && aiVerification.confidence > 0.8) {
          isConfirmedTransaction = false;
        }
      } catch (aiError) {
        console.warn('AI verification failed, falling back to pattern matching', aiError);
        // Fall back to pattern matching if AI fails
      }
    }
    
    // Skip if AI confirmed it's not a transaction
    if (!isConfirmedTransaction) {
      return null;
    }
    
    // Parse the SMS to get transaction details
    const parsedTransaction = parseTransactionSMS(sms.body);
    
    if (parsedTransaction) {
      // Add to processed cache
      addToProcessedCache(sms._id);
      
      // Add category to the transaction
      const category = await categorizeTransaction(
        parsedTransaction.description,
        parsedTransaction.amount
      );
      
      const transactionWithCategory: Transaction = {
        ...parsedTransaction,
        category,
        originalSMS: sms.body,
        bank: parsedTransaction.bank || extractBankFromSender(sms.address),
        id: parsedTransaction.id || uuidv4()
      };
      
      // Save the transaction to storage
      await saveTransaction(transactionWithCategory);
      
      // Return the processed transaction
      return transactionWithCategory;
    }
    
    return null;
  } catch (error) {
    console.error('Error processing SMS message:', error);
    return null;
  }
};

/**
 * Extract bank name from sender ID
 */
const extractBankFromSender = (senderId: string): string | undefined => {
  const upperSender = senderId.toUpperCase();
  
  if (upperSender.includes('HDFCBK') || upperSender.includes('HDFC')) {
    return 'HDFC';
  } else if (upperSender.includes('SBIINB') || upperSender.includes('SBI')) {
    return 'SBI';
  } else if (upperSender.includes('ICICIB') || upperSender.includes('ICICI')) {
    return 'ICICI';
  } else if (upperSender.includes('AXISBK') || upperSender.includes('AXIS')) {
    return 'Axis';
  } else if (upperSender.includes('KOTAK')) {
    return 'Kotak';
  } else if (upperSender.includes('YESBNK') || upperSender.includes('YES')) {
    return 'Yes Bank';
  } else if (upperSender.includes('PAYTM') || upperSender.includes('PYTM')) {
    return 'Paytm';
  } else if (upperSender.includes('AMAZONPAY')) {
    return 'Amazon Pay';
  } else if (upperSender.includes('PHONPE')) {
    return 'PhonePe';
  } else if (upperSender.includes('GPAY')) {
    return 'Google Pay';
  }
  
  return undefined;
};

/**
 * Get SMS messages from inbox
 */
const readSMSMessages = (
  count: number = 20,
  onSuccess: (messages: SMSMessage[]) => void,
  onError: (error: string) => void
) => {
  try {
    SmsAndroid.list(
      JSON.stringify({
        box: 'inbox',
        maxCount: count
      }),
      onError,
      (fetchedCount: number, smsList: string) => {
        if (fetchedCount > 0) {
          const messages: SMSMessage[] = JSON.parse(smsList);
          onSuccess(messages);
        } else {
          onSuccess([]);
        }
      }
    );
  } catch (error) {
    console.error('Error reading SMS messages:', error);
    onError(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Start polling for SMS messages (since react-native-get-sms-android doesn't support listeners)
 */
export const startSMSListener = (
  onNewTransaction?: (transaction: Transaction) => void,
  onError?: (error: unknown) => void
) => {
  if (Platform.OS !== 'android') {
    return () => {};
  }
  
  // Keep track of the last read SMS ID to avoid duplicates
  let lastReadSmsId = '';
  let isProcessing = false;
  
  // Poll for new SMS messages every 5 seconds
  const intervalId = setInterval(() => {
    // Skip if we're still processing from the last interval
    if (isProcessing) return;
    
    isProcessing = true;
    
    readSMSMessages(
      20, // Read latest 20 messages
      async (messages) => {
        try {
          if (messages.length > 0) {
            // Only process messages we haven't seen before
            if (lastReadSmsId !== messages[0]._id) {
              lastReadSmsId = messages[0]._id;
              
              // Filter for likely transaction SMS messages
              const potentialTransactions = messages.filter(sms => 
                !recentlyProcessedSMS.has(sms._id) && 
                (isFinancialSender(sms.address) || isTransactionSMS(sms.body))
              );
              
              // Process each potential transaction
              for (const sms of potentialTransactions) {
                const transaction = await processSMSMessage(sms);
                if (transaction && onNewTransaction) {
                  onNewTransaction(transaction);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing SMS batch:', error);
          if (onError) onError(error);
        } finally {
          isProcessing = false;
        }
      },
      (error) => {
        console.error('Failed to read SMS:', error);
        if (onError) onError(error);
        isProcessing = false;
      }
    );
  }, 5000); // Poll every 5 seconds
  
  // Return a function to stop the polling
  return () => {
    clearInterval(intervalId);
  };
}; 