import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types/transaction';
import { v4 } from 'uuid';

// Storage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: 'rupeeradar_transactions',
};

/**
 * Save a transaction to AsyncStorage
 */
export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    // Get existing transactions
    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = existingData ? JSON.parse(existingData) : [];
    
    // Add new transaction
    transactions.push(transaction);
    
    // Save back to storage
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

/**
 * Get all transactions from AsyncStorage
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

/**
 * Get filtered transactions
 */
export const getFilteredTransactions = async (
  filters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    type?: 'credit' | 'debit';
  }
): Promise<Transaction[]> => {
  try {
    let transactions = await getAllTransactions();
    
    // Apply filters
    if (filters.startDate) {
      transactions = transactions.filter(tx => 
        new Date(tx.date) >= filters.startDate!
      );
    }
    
    if (filters.endDate) {
      transactions = transactions.filter(tx => 
        new Date(tx.date) <= filters.endDate!
      );
    }
    
    if (filters.category) {
      transactions = transactions.filter(tx => 
        tx.category === filters.category
      );
    }
    
    if (filters.minAmount !== undefined) {
      transactions = transactions.filter(tx => 
        tx.amount >= filters.minAmount!
      );
    }
    
    if (filters.maxAmount !== undefined) {
      transactions = transactions.filter(tx => 
        tx.amount <= filters.maxAmount!
      );
    }
    
    if (filters.type) {
      transactions = transactions.filter(tx => 
        tx.type === filters.type
      );
    }
    
    return transactions;
  } catch (error) {
    console.error('Error filtering transactions:', error);
    return [];
  }
};

/**
 * Clear all transactions (for testing purposes)
 */
export const clearAllTransactions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  } catch (error) {
    console.error('Error clearing transactions:', error);
  }
};

/**
 * Add sample transaction data for testing
 */
export const addSampleTransactions = async (): Promise<void> => {
  try {
    // Get existing transactions
    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    
    // If we already have data, don't add samples again
    if (existingData && JSON.parse(existingData).length > 0) {
      console.log('Sample data not added: transactions already exist');
      return;
    }
    
    // Sample transactions
    const sampleTransactions: Transaction[] = [
      {
        id: v4(),
        amount: 1499,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        description: 'Amazon.in - Books',
        category: 'Shopping',
        type: 'debit',
        bank: 'HDFC'
      },
      {
        id: v4(),
        amount: 1299,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        description: 'Swiggy Order - Food Delivery',
        category: 'Food & Dining',
        type: 'debit',
        bank: 'HDFC'
      },
      {
        id: v4(),
        amount: 2499,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        description: 'Mobile Bill - Airtel',
        category: 'Bills & Utilities',
        type: 'debit',
        bank: 'HDFC'
      },
      {
        id: v4(),
        amount: 5999,
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
        description: 'Rent Payment',
        category: 'Home',
        type: 'debit',
        bank: 'SBI'
      },
      {
        id: v4(),
        amount: 799,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        description: 'Netflix Subscription',
        category: 'Entertainment',
        type: 'debit',
        bank: 'ICICI'
      },
      {
        id: v4(),
        amount: 450,
        date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
        description: 'Uber Ride',
        category: 'Transport',
        type: 'debit',
        bank: 'HDFC'
      },
      {
        id: v4(),
        amount: 3500,
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        description: 'Doctor Visit - Apollo Hospital',
        category: 'Health',
        type: 'debit',
        bank: 'SBI'
      },
      {
        id: v4(),
        amount: 2199,
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
        description: 'Flipkart - Headphones',
        category: 'Shopping',
        type: 'debit',
        bank: 'ICICI'
      },
      {
        id: v4(),
        amount: 1800,
        date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days ago
        description: 'Restaurant - Birthday dinner',
        category: 'Food & Dining',
        type: 'debit',
        bank: 'HDFC'
      },
      {
        id: v4(),
        amount: 9800,
        date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(), // 29 days ago
        description: 'Flight Tickets - MakeMyTrip',
        category: 'Travel',
        type: 'debit',
        bank: 'SBI'
      },
      {
        id: v4(),
        amount: 45000,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        description: 'Salary Credit',
        category: 'Income',
        type: 'credit',
        bank: 'HDFC'
      },
      {
        id: v4(),
        amount: 5000,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        description: 'Freelance Payment',
        category: 'Income',
        type: 'credit',
        bank: 'ICICI'
      },
      {
        id: v4(),
        amount: 2500,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        description: 'Investment Dividend',
        category: 'Investment',
        type: 'credit',
        bank: 'SBI'
      },
      {
        id: v4(),
        amount: 899,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        description: 'Gym Membership',
        category: 'Health',
        type: 'debit',
        bank: 'HDFC'
      },
      {
        id: v4(),
        amount: 349,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        description: 'Spotify Premium',
        category: 'Entertainment',
        type: 'debit',
        bank: 'HDFC'
      }
    ];
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sampleTransactions));
    console.log('Added sample transactions for testing');
  } catch (error) {
    console.error('Error adding sample transactions:', error);
  }
}; 