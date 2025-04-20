import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Transaction } from '../../types/transaction';
import { formatDate, getDayName } from '../../utils/dateUtils';
import { getCategoryColor } from '../../utils/categoryEngine';
import { Ionicons } from '@expo/vector-icons';
import AnimatedCard from '../ui/AnimatedCard';
import lightTheme, { darkTheme } from '../../utils/theme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

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
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

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
            <Text style={[styles.description, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {truncateText(description)}
            </Text>
            
            <View style={styles.detailsRow}>
              <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>{displayDate}</Text>
              <Text style={[styles.dotSeparator, { color: theme.colors.textHint }]}>•</Text>
              <Text style={[styles.dayText, { color: theme.colors.textSecondary }]}>{dayName}</Text>
              
              {category && (
                <>
                  <Text style={[styles.dotSeparator, { color: theme.colors.textHint }]}>•</Text>
                  <View style={styles.categoryContainer}>
                    <View 
                      style={[
                        styles.categoryDot, 
                        { 
                          backgroundColor: categoryColor,
                          borderWidth: isDarkMode ? 0.5 : 0,
                          borderColor: 'rgba(255,255,255,0.3)'
                        }
                      ]} 
                    />
                    <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>{category}</Text>
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
              isDebit ? { color: theme.colors.debit } : { color: theme.colors.credit }
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
    marginVertical: 4,
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
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  } as ViewStyle,
  textContainer: {
    flex: 1,
  } as ViewStyle,
  description: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  } as TextStyle,
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  dateText: {
    fontSize: 12,
  } as TextStyle,
  dotSeparator: {
    fontSize: 12,
    marginHorizontal: 4,
  } as TextStyle,
  dayText: {
    fontSize: 12,
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
  } as TextStyle,
  amount: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
});

export default TransactionCard; 