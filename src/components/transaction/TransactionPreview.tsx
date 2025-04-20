import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../../types/transaction';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { getCategoryColor } from '../../utils/categoryEngine';

interface TransactionPreviewProps {
  transaction: Transaction;
}

const TransactionPreview: React.FC<TransactionPreviewProps> = ({ transaction }) => {
  // Format currency amount with Indian Rupee symbol
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Determine if it's a debit (expense) or credit (income)
  const isDebit = transaction.type === 'debit';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction Details</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Amount</Text>
        <Text style={[
          styles.value, 
          isDebit ? styles.debitAmount : styles.creditAmount
        ]}>
          {formatCurrency(transaction.amount)}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{formatDateForDisplay(transaction.date)}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{transaction.description}</Text>
      </View>

      {transaction.category && (
        <View style={styles.detailRow}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            <View 
              style={[
                styles.categoryIndicator, 
                { backgroundColor: getCategoryColor(transaction.category) }
              ]} 
            />
            <Text style={styles.value}>{transaction.category}</Text>
          </View>
        </View>
      )}

      {transaction.bank && (
        <View style={styles.detailRow}>
          <Text style={styles.label}>Bank</Text>
          <Text style={styles.value}>{transaction.bank}</Text>
        </View>
      )}

      {transaction.balance !== null && transaction.balance !== undefined && (
        <View style={styles.detailRow}>
          <Text style={styles.label}>Balance</Text>
          <Text style={styles.value}>{formatCurrency(transaction.balance)}</Text>
        </View>
      )}

      <View style={styles.typeContainer}>
        <View style={[
          styles.typeIndicator, 
          isDebit ? styles.debitIndicator : styles.creditIndicator
        ]}>
          <Text style={styles.typeText}>
            {isDebit ? 'EXPENSE' : 'INCOME'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  debitAmount: {
    color: '#f44336',
  },
  creditAmount: {
    color: '#4caf50',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  typeContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debitIndicator: {
    backgroundColor: '#ffebee',
  },
  creditIndicator: {
    backgroundColor: '#e8f5e9',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
});

export default TransactionPreview; 