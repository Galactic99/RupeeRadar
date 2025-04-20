import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Transaction } from '../../types/transaction';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { getCategoryColor } from '../../utils/categoryEngine';
import AnimatedCard from '../ui/AnimatedCard';
import lightTheme, { darkTheme } from '../../utils/theme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface TransactionPreviewProps {
  transaction: Transaction;
  onPress?: () => void;
}

const TransactionPreview: React.FC<TransactionPreviewProps> = ({ transaction, onPress }) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

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
    <AnimatedCard style={styles.container} onPress={onPress}>
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Transaction Details</Text>
      </View>

      <View style={styles.row}>
        <Animated.View 
          style={styles.amountContainer}
          entering={FadeIn.delay(100).duration(400)}
        >
          <Text style={[
            styles.amountLabel, 
            { color: isDebit ? theme.colors.debit : theme.colors.credit }
          ]}>
            {isDebit ? 'SPENT' : 'RECEIVED'}
          </Text>
          <Text style={[
            styles.amount, 
            { color: isDebit ? theme.colors.debit : theme.colors.credit }
          ]}>
            {formatCurrency(transaction.amount)}
          </Text>
        </Animated.View>
      </View>

      <View style={[styles.detailsContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Date</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
            {formatDateForDisplay(transaction.date)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
            {transaction.description}
          </Text>
        </View>

        {transaction.category && (
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Category</Text>
            <View style={styles.categoryContainer}>
              <View 
                style={[
                  styles.categoryIndicator, 
                  { backgroundColor: getCategoryColor(transaction.category) }
                ]} 
              />
              <Text style={[styles.categoryText, { color: theme.colors.textPrimary }]}>
                {transaction.category}
              </Text>
            </View>
          </View>
        )}

        {transaction.bank && (
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Bank</Text>
            <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
              {transaction.bank}
            </Text>
          </View>
        )}

        {transaction.balance !== null && transaction.balance !== undefined && (
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Balance</Text>
            <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
              {formatCurrency(transaction.balance)}
            </Text>
          </View>
        )}

        <View style={styles.typeContainer}>
          <View style={[
            styles.typeIndicator, 
            { backgroundColor: isDebit ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)' }
          ]}>
            <Text style={[styles.typeText, { color: theme.colors.textSecondary }]}>
              {isDebit ? 'EXPENSE' : 'INCOME'}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
    overflow: 'hidden',
  } as ViewStyle,
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  } as ViewStyle,
  title: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.15,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  } as ViewStyle,
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  } as ViewStyle,
  amountLabel: {
    fontSize: 12,
    letterSpacing: 0.4,
    fontWeight: '700',
    marginBottom: 4,
  } as TextStyle,
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
  } as TextStyle,
  detailsContainer: {
    padding: 16,
  } as ViewStyle,
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  } as ViewStyle,
  label: {
    fontSize: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  } as TextStyle,
  value: {
    fontSize: 14,
    fontWeight: 'normal' as TextStyle['fontWeight'],
    letterSpacing: 0.25,
    maxWidth: '60%',
    textAlign: 'right',
  } as TextStyle,
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 9999,
    marginRight: 8,
  } as ViewStyle,
  categoryText: {
    fontSize: 14,
    letterSpacing: 0.25,
    fontWeight: '500',
  } as TextStyle,
  typeContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  } as ViewStyle,
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  } as ViewStyle,
  typeText: {
    fontSize: 12,
    letterSpacing: 0.4,
    fontWeight: '700',
  } as TextStyle,
});

export default TransactionPreview; 