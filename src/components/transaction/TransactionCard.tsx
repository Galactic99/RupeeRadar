import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../types/transaction';
import { getCategoryColor } from '../../utils/categoryEngine';
import { formatDateForDisplay, getRelativeTimeString } from '../../utils/dateUtils';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  transaction, 
  onPress 
}) => {
  const isDebit = transaction.type === 'debit';
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Get category color
  const categoryColor = transaction.category 
    ? getCategoryColor(transaction.category) 
    : '#ddd';
  
  // Get category icon
  const getCategoryIcon = (category?: string) => {
    if (!category) return 'help-circle-outline';
    
    switch (category) {
      case 'Groceries':
        return 'basket-outline';
      case 'Food & Dining':
        return 'restaurant-outline';
      case 'Transport':
        return 'car-outline';
      case 'Shopping':
        return 'cart-outline';
      case 'Entertainment':
        return 'film-outline';
      case 'Bills & Utilities':
        return 'receipt-outline';
      case 'Health':
        return 'medical-outline';
      case 'Education':
        return 'school-outline';
      case 'Personal Care':
        return 'person-outline';
      case 'Home':
        return 'home-outline';
      case 'Travel':
        return 'airplane-outline';
      case 'Investment':
        return 'trending-up-outline';
      default:
        return 'help-circle-outline';
    }
  };
  
  const handlePress = () => {
    if (onPress) {
      onPress(transaction);
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
          <Ionicons 
            name={getCategoryIcon(transaction.category)} 
            size={18} 
            color="#fff" 
          />
        </View>
      </View>
      
      <View style={styles.middleSection}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        
        <View style={styles.detailsRow}>
          {transaction.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>
                {transaction.category}
              </Text>
            </View>
          )}
          
          <Text style={styles.dateText}>
            {getRelativeTimeString(transaction.date)}
          </Text>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text 
          style={[
            styles.amount, 
            isDebit ? styles.debitAmount : styles.creditAmount
          ]}
        >
          {isDebit ? '-' : '+'}{formatCurrency(transaction.amount)}
        </Text>
        
        {transaction.bank && (
          <Text style={styles.bankText}>{transaction.bank}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: {
    marginRight: 12,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  debitAmount: {
    color: '#f44336',
  },
  creditAmount: {
    color: '#4caf50',
  },
  bankText: {
    fontSize: 12,
    color: '#999',
  },
});

export default TransactionCard; 