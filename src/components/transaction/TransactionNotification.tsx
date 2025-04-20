import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import lightTheme, { darkTheme } from '../../utils/theme';
import { Transaction } from '../../types/transaction';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface TransactionNotificationProps {
  transaction: Transaction;
  onDismiss: () => void;
  onViewDetails: (transaction: Transaction) => void;
}

const TransactionNotification: React.FC<TransactionNotificationProps> = ({
  transaction,
  onDismiss,
  onViewDetails
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    // Provide haptic feedback when notification appears
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: transaction.type === 'debit' ? theme.colors.error : theme.colors.success,
        }
      ]}
      entering={FadeInDown.duration(500).springify()}
      exiting={FadeOutUp.duration(300)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={transaction.type === 'debit' ? "arrow-down-circle" : "arrow-up-circle"} 
          size={32} 
          color={transaction.type === 'debit' ? theme.colors.error : theme.colors.success} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          New Transaction Detected
        </Text>
        
        <Text style={[styles.amount, { 
          color: transaction.type === 'debit' ? theme.colors.error : theme.colors.success 
        }]}>
          {formatCurrency(transaction.amount)}
        </Text>
        
        <Text 
          style={[styles.description, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {transaction.description}
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onViewDetails(transaction);
            }}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDismiss();
            }}
          >
            <Text style={[styles.buttonText, { color: theme.colors.textPrimary }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    zIndex: 1000,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default TransactionNotification; 