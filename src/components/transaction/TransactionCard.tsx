import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Transaction } from '../../types/transaction';
import { formatDate, getDayName } from '../../utils/dateUtils';
import { getCategoryColor } from '../../utils/categoryEngine';
import { Ionicons } from '@expo/vector-icons';
import AnimatedCard from '../ui/AnimatedCard';
import theme from '../../utils/theme';
import Animated, { FadeIn } from 'react-native-reanimated';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  delay?: number;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  transaction, 
  onPress,
  delay = 0
}) => {
  const { amount, description, date, type, category } = transaction;

  // Format currency amount
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Truncate description if too long
  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Determine transaction icon based on category
  const getTransactionIcon = () => {
    if (!category) return 'help-circle-outline';
    
    const categoryIconMap: Record<string, string> = {
      'Food': 'fast-food-outline',
      'Groceries': 'basket-outline',
      'Shopping': 'cart-outline',
      'Transport': 'car-outline',
      'Entertainment': 'film-outline',
      'Bills': 'receipt-outline',
      'Travel': 'airplane-outline',
      'Health': 'medical-outline',
      'Education': 'school-outline',
      'Salary': 'cash-outline',
      'Investment': 'trending-up-outline',
      'Rent': 'home-outline',
      'Other': 'grid-outline',
    };
    
    return categoryIconMap[category] || 'help-circle-outline';
  };

  const isDebit = type === 'debit';
  const iconName = getTransactionIcon();
  const transactionDate = new Date(date);
  const displayDate = formatDate(transactionDate);
  const dayName = getDayName(transactionDate);
  const categoryColor = category ? getCategoryColor(category) : '#9e9e9e';

  return (
    <AnimatedCard 
      onPress={onPress}
      style={styles.container}
      elevation="small"
      delay={delay}
    >
      <View style={styles.row}>
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}15` }]}>
            <Ionicons name={iconName} size={20} color={categoryColor} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.description} numberOfLines={1}>
              {truncateText(description)}
            </Text>
            
            <View style={styles.detailsRow}>
              <Text style={styles.dateText}>{displayDate}</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.dayText}>{dayName}</Text>
              
              {category && (
                <>
                  <Text style={styles.dotSeparator}>•</Text>
                  <View style={styles.categoryContainer}>
                    <View 
                      style={[styles.categoryDot, { backgroundColor: categoryColor }]} 
                    />
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
        
        <Animated.View entering={FadeIn.delay(delay + 300)}>
          <Text 
            style={[
              styles.amount, 
              isDebit ? styles.debitAmount : styles.creditAmount
            ]}
          >
            {isDebit ? '-' : '+'}{formatCurrency(amount)}
          </Text>
        </Animated.View>
      </View>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  } as ViewStyle,
  textContainer: {
    flex: 1,
  } as ViewStyle,
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  } as TextStyle,
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  } as TextStyle,
  dotSeparator: {
    fontSize: 12,
    color: theme.colors.textHint,
    marginHorizontal: 4,
  } as TextStyle,
  dayText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  } as TextStyle,
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  } as ViewStyle,
  categoryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  } as TextStyle,
  amount: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  debitAmount: {
    color: theme.colors.debit,
  } as TextStyle,
  creditAmount: {
    color: theme.colors.credit,
  } as TextStyle,
});

export default TransactionCard; 