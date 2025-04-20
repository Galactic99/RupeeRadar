import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, SegmentedButtons, useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { Transaction } from '../src/types/transaction';
import SpendingInsights from '../src/components/SpendingInsights';
import SavingGoals from '../src/components/SavingGoals';
import { detectAnomalousTransaction } from '../src/services/geminiService';
import { getCategoryColor } from '../src/utils/categoryEngine';
import { GEMINI_API_KEY } from '@env';
import GeminiKeyMissing from '../src/components/GeminiKeyMissing';
import { getFilteredTransactions } from '../src/services/storageService';
import { getStartDateForTimeframe } from '../src/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function InsightsScreen() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [anomalousTransactions, setAnomalousTransactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Load transactions
    loadTransactions();
  }, [timeframe]);

  useEffect(() => {
    // Detect anomalous transactions
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_api_key_here' && transactions.length > 0) {
      detectAnomalousTransactions();
    }
  }, [transactions]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const startDate = getStartDateForTimeframe(timeframe);
      
      const filteredTransactions = await getFilteredTransactions({
        startDate,
        endDate: new Date()
      });
      
      setTransactions(filteredTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectAnomalousTransactions = async () => {
    const anomalousIds: string[] = [];

    for (const transaction of transactions) {
      try {
        const isAnomalous = await detectAnomalousTransaction(
          transaction,
          transactions.filter(t => t.id !== transaction.id)
        );

        if (isAnomalous) {
          anomalousIds.push(transaction.id);
        }
      } catch (error) {
        console.error('Error detecting anomalous transaction:', error);
      }
    }

    setAnomalousTransactions(anomalousIds);
  };

  const filterTransactionsByTime = (transactions: Transaction[], timeframe: string) => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= startDate && txDate <= now;
    });
  };

  const filteredTransactions = filterTransactionsByTime(transactions, timeframe);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.timeframeContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Time Period</Text>
          <SegmentedButtons
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as 'week' | 'month' | 'year')}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Analyzing your spending...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              Add some transactions to get AI-powered insights
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/sms-input')}
            >
              <Text style={styles.addButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SpendingInsights 
              transactions={transactions}
              timeframe={timeframe}
              onRefresh={onRefresh}
            />
            
            <SavingGoals
              transactions={transactions}
              onRefresh={onRefresh}
            />
          </>
        )}
        
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>AI-Powered Features</Text>
          <Text variant="bodyMedium" style={styles.sectionDescription}>
            RupeeRadar uses artificial intelligence to help you understand your spending patterns
            and provide personalized financial advice.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.featureIconText}>🤖</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleSmall">Smart Categorization</Text>
                <Text variant="bodySmall">
                  Automatically categorizes your transactions using advanced AI that learns from your spending patterns.
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.secondary }]}>
                <Text style={styles.featureIconText}>📊</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleSmall">Spending Analysis</Text>
                <Text variant="bodySmall">
                  Get personalized insights about your spending habits and actionable recommendations.
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.tertiary }]}>
                <Text style={styles.featureIconText}>⚠️</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleSmall">Anomaly Detection</Text>
                <Text variant="bodySmall">
                  Identifies unusual spending patterns and potentially fraudulent transactions.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  timeframeContainer: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  section: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconText: {
    fontSize: 18,
    color: 'white',
  },
  featureContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  addButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
}); 