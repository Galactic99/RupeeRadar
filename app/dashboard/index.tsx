import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
// ... your existing imports
import { useSMS } from '../../src/context/SMSContext';
import TransactionNotification from '../../src/components/transaction/TransactionNotification';
import { Transaction } from '../../src/types/transaction';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import lightTheme, { darkTheme } from '../../src/utils/theme';
import ThemedView from '../../src/components/ui/ThemedView';

export default function DashboardScreen() {
  // ... your existing state
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationTransaction, setNotificationTransaction] = useState<Transaction | null>(null);
  const { lastTransaction, recentTransactions } = useSMS();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Listen for new transactions from SMS
  useEffect(() => {
    if (lastTransaction) {
      // Show notification for the new transaction
      setNotificationTransaction(lastTransaction);
      setShowNotification(true);
    }
  }, [lastTransaction]);
  
  const handleDismissNotification = () => {
    setShowNotification(false);
    setNotificationTransaction(null);
  };
  
  const handleViewTransactionDetails = (transaction: Transaction) => {
    setShowNotification(false);
    setNotificationTransaction(null);
    // Navigate to expenses page with transaction ID parameter instead of non-existent transaction page
    router.push(`/dashboard/expenses?transactionId=${transaction.id}` as any);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <ThemedView>
      <ScrollView style={styles.container}>
        {/* Your existing dashboard content */}
        
        {/* Recent Transactions from SMS */}
        {recentTransactions.length > 0 && (
          <View style={[styles.recentTransactionsContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Recent Transactions
            </Text>
            
            {recentTransactions.map((transaction, index) => (
              <TouchableOpacity 
                key={transaction.id} 
                style={styles.transactionItem}
                onPress={() => handleViewTransactionDetails(transaction)}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons 
                    name={transaction.type === 'debit' ? "arrow-down" : "arrow-up"} 
                    size={18} 
                    color={transaction.type === 'debit' ? theme.colors.error : theme.colors.success} 
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDesc, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={[styles.transactionCategory, { color: theme.colors.textSecondary }]}>
                    {transaction.category || 'Uncategorized'}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text 
                    style={[
                      styles.amountText, 
                      { color: transaction.type === 'debit' ? theme.colors.error : theme.colors.success }
                    ]}
                  >
                    {transaction.type === 'debit' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={[styles.viewAllButton, { borderColor: theme.colors.primary }]}
              onPress={() => router.push('/dashboard/expenses' as any)}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                View All Transactions
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* Transaction notification */}
      {showNotification && notificationTransaction && (
        <TransactionNotification 
          transaction={notificationTransaction}
          onDismiss={handleDismissNotification}
          onViewDetails={handleViewTransactionDetails}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  recentTransactionsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 13,
  },
  transactionAmount: {
    marginLeft: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});