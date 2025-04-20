import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Transaction } from '../../src/types/transaction';
import TransactionPreview from '../../src/components/transaction/TransactionPreview';
import { getAllTransactions } from '../../src/services/storageService';
import lightTheme, { darkTheme } from '../../src/utils/theme';
import Button from '../../src/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import PageLoader from '../../src/components/ui/PageLoader';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import ThemedView from '../../src/components/ui/ThemedView';
import { useTheme } from '../../src/context/ThemeContext';

export default function TransactionScreen() {
  const { id } = useLocalSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    if (!id) {
      router.back();
      return;
    }

    try {
      setLoading(true);
      const transactions = await getAllTransactions();
      const foundTransaction = transactions.find(tx => tx.id === id);
      
      if (foundTransaction) {
        setTransaction(foundTransaction);
      } else {
        // Transaction not found, go back
        router.back();
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadTransaction();
    setRefreshing(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  if (loading && !refreshing) {
    return <PageLoader message="Loading transaction details..." />;
  }

  if (!transaction) {
    return null;
  }

  return (
    <ThemedView>
      <Animated.View 
        style={styles.container}
        entering={FadeIn.duration(300)}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <TransactionPreview transaction={transaction} />
          
          <View style={styles.buttonContainer}>
            <Button
              title="Back to Expenses"
              onPress={handleBackPress}
              variant="outlined"
              icon={<Ionicons name="arrow-back" size={20} color={theme.colors.primary} style={styles.buttonIcon} />}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  buttonIcon: {
    marginRight: 4,
  },
}); 