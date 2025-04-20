import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, Chip, SegmentedButtons, useTheme, Divider, Button, Banner } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { getAllTransactions, addSampleTransactions, clearAllTransactions } from '../../src/services/storageService';
import { Transaction } from '../../src/types/transaction';
import { getStartDateForTimeframe } from '../../src/utils/dateUtils';
import TransactionCard from '../../src/components/transaction/TransactionCard';
import { useRouter } from 'expo-router';

export default function Expenses() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [showTestControls, setShowTestControls] = useState(false);
  const theme = useTheme();
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
    await loadTransactions();
    setRefreshing(false);
  };

  const addTransaction = () => {
    router.push('/sms-input');
  };

  const addSampleData = async () => {
    try {
      setLoading(true);
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
              Alert.alert('Success', 'All transactions cleared successfully');
            } catch (error) {
              console.error('Error clearing data:', error);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>Expenses</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => setShowTestControls(!showTestControls)}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={addTransaction}
          >
            <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {showTestControls && (
        <Banner
          visible={true}
          actions={[
            {
              label: 'Add Sample Data',
              onPress: addSampleData,
              mode: 'contained',
            },
            {
              label: 'Clear All Data',
              onPress: clearData,
              mode: 'outlined',
            },
          ]}
          icon="beaker"
        >
          Testing controls: Add sample data or clear all data
        </Banner>
      )}

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, styles.expenseText]}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, styles.incomeText]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
          </View>
          <Divider style={styles.horizontalDivider} />
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={[
              styles.balanceValue,
              totalIncome - totalExpense >= 0 ? styles.positiveBalance : styles.negativeBalance
            ]}>
              {formatCurrency(totalIncome - totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <Text variant="titleMedium" style={styles.filterTitle}>Time Period</Text>
        <SegmentedButtons
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as 'week' | 'month' | 'year' | 'all')}
          buttons={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
            { value: 'all', label: 'All' }
          ]}
          style={styles.segmentedButtons}
        />
        
        <View style={styles.typeFilter}>
          <Text variant="titleMedium" style={styles.filterTitle}>Transaction Type</Text>
          <View style={styles.chipContainer}>
            <Chip 
              selected={filterType === 'all'} 
              onPress={() => setFilterType('all')}
              style={styles.chip}
            >
              All
            </Chip>
            <Chip 
              selected={filterType === 'expense'} 
              onPress={() => setFilterType('expense')}
              style={styles.chip}
            >
              Expenses
            </Chip>
            <Chip 
              selected={filterType === 'income'} 
              onPress={() => setFilterType('income')}
              style={styles.chip}
            >
              Income
            </Chip>
          </View>
        </View>
      </View>

      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            Add transactions by analyzing SMS or manually entering them
          </Text>
          <TouchableOpacity 
            style={styles.addTransactionButton}
            onPress={addTransaction}
          >
            <Text style={styles.addTransactionText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionCard 
              transaction={item}
              onPress={(tx) => console.log('Transaction pressed:', tx)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 4,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseText: {
    color: '#f44336',
  },
  incomeText: {
    color: '#4caf50',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  horizontalDivider: {
    marginVertical: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: '#4caf50',
  },
  negativeBalance: {
    color: '#f44336',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTitle: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  typeFilter: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addTransactionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addTransactionText: {
    color: 'white',
    fontWeight: '600',
  },
});