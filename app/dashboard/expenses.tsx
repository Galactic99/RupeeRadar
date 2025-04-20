import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Chip, SegmentedButtons, Divider, Banner } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { getAllTransactions, addSampleTransactions, clearAllTransactions } from '../../src/services/storageService';
import { Transaction } from '../../src/types/transaction';
import { getStartDateForTimeframe } from '../../src/utils/dateUtils';
import TransactionCard from '../../src/components/transaction/TransactionCard';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, FadeInDown, Layout } from 'react-native-reanimated';
import lightTheme, { darkTheme } from '../../src/utils/theme';
import PageLoader from '../../src/components/ui/PageLoader';
import FloatingActionButton from '../../src/components/ui/FloatingActionButton';
import AnimatedCard from '../../src/components/ui/AnimatedCard';
import { Skeleton } from '../../src/components/ui/Skeleton';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import ThemedView from '../../src/components/ui/ThemedView';

export default function Expenses() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [showTestControls, setShowTestControls] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, timeframe, filterType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const allTransactions = await getAllTransactions();
      setTransactions(allTransactions);
      
      if (initialLoad) {
        setInitialLoad(false);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Apply time filter
    if (timeframe !== 'all') {
      const startDate = getStartDateForTimeframe(timeframe);
      filtered = filtered.filter(tx => new Date(tx.date) >= startDate);
    }

    // Apply type filter
    if (filterType === 'expense') {
      filtered = filtered.filter(tx => tx.type === 'debit');
    } else if (filterType === 'income') {
      filtered = filtered.filter(tx => tx.type === 'credit');
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadTransactions();
    setRefreshing(false);
  };

  const addTransaction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/sms-input');
  };

  const addSampleData = async () => {
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addSampleTransactions();
      await loadTransactions();
      Alert.alert('Success', 'Sample transactions added successfully');
    } catch (error) {
      console.error('Error adding sample data:', error);
      Alert.alert('Error', 'Failed to add sample transactions');
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear All Transactions',
      'Are you sure you want to delete all transactions? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await clearAllTransactions();
              await loadTransactions();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'All transactions cleared successfully');
            } catch (error) {
              console.error('Error clearing data:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to clear transactions');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Calculate total, expenses, and income
  const totalExpense = filteredTransactions
    .filter(tx => tx.type === 'debit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalIncome = filteredTransactions
    .filter(tx => tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const viewTransaction = (transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/dashboard/transaction?id=${transaction.id}`);
  };

  if (initialLoad) {
    return <PageLoader message="Loading your transactions..." />;
  }

  const renderTransactionItem = ({ item, index }: { item: Transaction, index: number }) => (
    <TransactionCard 
      transaction={item} 
      onPress={() => viewTransaction(item)}
      delay={index * 50} // Staggered animation delay
    />
  );

  const renderEmptyList = () => (
    <Animated.View 
      style={styles.emptyContainer}
      entering={FadeIn.delay(300)}
    >
      <Ionicons name="wallet-outline" size={64} color={theme.colors.textHint} />
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No transactions found</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {filterType !== 'all' || timeframe !== 'all' 
          ? 'Try changing your filters to see more transactions' 
          : 'Add your first transaction to get started'}
      </Text>
    </Animated.View>
  );

  return (
    <ThemedView>
      <View style={styles.container}>
        <Animated.View 
          style={styles.header}
          entering={FadeInDown.duration(500).springify()}
        >
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Expenses</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => {
                setShowTestControls(!showTestControls);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {showTestControls && (
          <Banner
            visible={true}
            icon="tools"
            actions={[
              { label: 'Add Sample', onPress: addSampleData },
              { label: 'Clear All', onPress: clearData }
            ]}
          >
            Test controls for development
          </Banner>
        )}

        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={timeframe}
            onValueChange={(value) => {
              setTimeframe(value as any);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
              { value: 'all', label: 'All' },
            ]}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.chipContainer}>
            <Chip 
              selected={filterType === 'all'} 
              onPress={() => {
                setFilterType('all');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.chip, filterType === 'all' && styles.selectedChip]}
            >
              All
            </Chip>
            <Chip 
              selected={filterType === 'expense'} 
              onPress={() => {
                setFilterType('expense');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.chip, filterType === 'expense' && styles.selectedChip]}
            >
              Expenses
            </Chip>
            <Chip 
              selected={filterType === 'income'} 
              onPress={() => {
                setFilterType('income');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.chip, filterType === 'income' && styles.selectedChip]}
            >
              Income
            </Chip>
          </View>
        </View>

        <Animated.View 
          style={[styles.summaryContainer, { backgroundColor: theme.colors.surface }]}
          entering={FadeInDown.delay(150).duration(500).springify()}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.debit }]}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.credit }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Net Balance</Text>
            <Text style={[
              styles.balanceValue, 
              { color: netBalance >= 0 ? theme.colors.credit : theme.colors.debit }
            ]}>
              {formatCurrency(netBalance)}
            </Text>
          </View>
        </Animated.View>
        
        <Animated.View 
          style={styles.listContainer}
          entering={FadeInDown.delay(300).duration(500).springify()}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {filteredTransactions.length} 
            {filterType === 'expense' ? ' Expenses' : filterType === 'income' ? ' Income' : ' Transactions'}
          </Text>
          
          {loading && !refreshing ? (
            <View style={styles.skeletonContainer}>
              <AnimatedCard>
                <View style={styles.skeletonDetail}>
                  <Skeleton style={{ height: 20, width: '40%' }} />
                </View>
                <View style={styles.skeletonDetail}>
                  <Skeleton style={{ height: 24, width: '70%', marginTop: 8 }} />
                </View>
                <View style={styles.skeletonDetail}>
                  <Skeleton style={{ height: 16, width: '30%' }} />
                  <Skeleton style={{ height: 16, width: '30%' }} />
                </View>
              </AnimatedCard>
              <AnimatedCard>
                <View style={styles.skeletonDetail}>
                  <Skeleton style={{ height: 20, width: '40%' }} />
                </View>
                <View style={styles.skeletonDetail}>
                  <Skeleton style={{ height: 24, width: '70%', marginTop: 8 }} />
                </View>
                <View style={styles.skeletonDetail}>
                  <Skeleton style={{ height: 16, width: '30%' }} />
                  <Skeleton style={{ height: 16, width: '30%' }} />
                </View>
              </AnimatedCard>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyList}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
            />
          )}
        </Animated.View>
        
        <FloatingActionButton 
          onPress={addTransaction}
          icon="add-outline"
          color={theme.colors.primary}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerIconButton: {
    padding: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: 'rgba(33, 150, 243, 0.12)',
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  separator: {
    height: 8,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});