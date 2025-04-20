import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { Transaction } from '../types/transaction';
import { 
  checkSMSPermissions, 
  requestSMSPermissions, 
  startSMSListener, 
  checkSMSModuleAvailability 
} from '../services/smsService';

interface SMSContextProps {
  hasPermissions: boolean | null;
  isListening: boolean;
  requestPermissions: () => Promise<boolean>;
  lastTransaction: Transaction | null;
  isAvailable: boolean;
  startListening: () => void;
  stopListening: () => void;
  recentTransactions: Transaction[];
}

interface SMSProviderProps {
  children: ReactNode;
}

const SMSContext = createContext<SMSContextProps>({
  hasPermissions: null,
  isListening: false,
  requestPermissions: async () => false,
  lastTransaction: null,
  isAvailable: false,
  startListening: () => {},
  stopListening: () => {},
  recentTransactions: []
});

export const useSMS = () => useContext(SMSContext);

export const SMSProvider: React.FC<SMSProviderProps> = ({ children }) => {
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [stopListenerCallback, setStopListenerCallback] = useState<(() => void) | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Check if SMS module is available on mount
  useEffect(() => {
    const checkAvailability = () => {
      if (Platform.OS !== 'android') {
        setIsAvailable(false);
        return;
      }
      
      const availability = checkSMSModuleAvailability();
      setIsAvailable(availability.available);
    };
    
    checkAvailability();
  }, []);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissionStatus = async () => {
      if (!isAvailable) return;
      
      try {
        const permissions = await checkSMSPermissions();
        if (permissions && typeof permissions === 'object') {
          setHasPermissions(
            permissions.hasReadSmsPermission && 
            permissions.hasReceiveSmsPermission
          );
        } else {
          setHasPermissions(false);
        }
      } catch (error) {
        console.error('Error checking SMS permissions:', error);
        setHasPermissions(false);
      }
    };
    
    checkPermissionStatus();
  }, [isAvailable]);

  // Start listening when permissions are granted
  useEffect(() => {
    if (hasPermissions && isAvailable && !isListening && !stopListenerCallback) {
      startListening();
    }
    
    return () => {
      if (stopListenerCallback) {
        stopListenerCallback();
      }
    };
  }, [hasPermissions, isAvailable]);

  // Handle new transactions
  const handleNewTransaction = (transaction: Transaction) => {
    setLastTransaction(transaction);
    
    // Add to recent transactions (keeping most recent 5)
    setRecentTransactions(prev => {
      const newList = [transaction, ...prev].slice(0, 5);
      return newList;
    });
    
    // Show a toast notification on Android
    if (Platform.OS === 'android') {
      const amount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(transaction.amount);
      
      const message = `${transaction.type === 'debit' ? 'Spent' : 'Received'} ${amount} - ${transaction.description.substring(0, 30)}${transaction.description.length > 30 ? '...' : ''}`;
      
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.LONG,
        ToastAndroid.TOP
      );
    }
  };

  const requestPermissions = async () => {
    if (!isAvailable) return false;
    
    try {
      const granted = await requestSMSPermissions();
      setHasPermissions(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting SMS permissions:', error);
      return false;
    }
  };

  const startListening = () => {
    if (!isAvailable || !hasPermissions || isListening) return;
    
    const stopListener = startSMSListener(
      handleNewTransaction,
      (error) => {
        console.error('SMS listener error:', error);
      }
    );
    
    setStopListenerCallback(() => stopListener);
    setIsListening(true);
  };

  const stopListening = () => {
    if (stopListenerCallback) {
      stopListenerCallback();
      setStopListenerCallback(null);
      setIsListening(false);
    }
  };

  return (
    <SMSContext.Provider
      value={{
        hasPermissions,
        isListening,
        requestPermissions,
        lastTransaction,
        isAvailable,
        startListening,
        stopListening,
        recentTransactions
      }}
    >
      {children}
    </SMSContext.Provider>
  );
}; 