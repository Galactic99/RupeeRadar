import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
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
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInRight } from 'react-native-reanimated';
import theme from '../src/utils/theme';
import PageLoader from '../src/components/ui/PageLoader';
import { Skeleton, SkeletonRow } from '../src/components/ui/Skeleton';
import AnimatedCard from '../src/components/ui/AnimatedCard';

export default function InsightsScreen() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [anomalousTransactions, setAnomalousTransactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const paperTheme = useTheme();
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
      
      // Set initial load to false after first successful load
      if (initialLoad) {
        setInitialLoad(false);
      }
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

  if (initialLoad) {
    return <PageLoader message="Loading your financial insights..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        entering={FadeIn.duration(400)}
      >
        <Animated.View 
          style={styles.timeframeContainer}
          entering={FadeInDown.duration(500).springify()}
        >
          <Text variant="titleMedium" style={styles.sectionTitle}>Time Period</Text>
          <SegmentedButtons
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as 'week' | 'month' | 'year')}
            buttons={[
              { 
                value: 'week', 
                label: 'Week',
                icon: 'calendar-week',
                style: timeframe === 'week' ? styles.activeSegment : null
              },
              { 
                value: 'month', 
                label: 'Month',
                icon: 'calendar-month',
                style: timeframe === 'month' ? styles.activeSegment : null
              },
              { 
                value: 'year', 
                label: 'Year',
                icon: 'calendar',
                style: timeframe === 'year' ? styles.activeSegment : null
              },
            ]}
            style={styles.segmentedButtons}
          />
        </Animated.View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingTitle}>Analyzing your spending...</Text>
            <View style={styles.skeletonContainer}>
              <Skeleton height={30} width="80%" style={styles.skeleton} />
              <SkeletonRow items={2} height={100} style={styles.skeleton} />
              <Skeleton height={200} style={styles.skeleton} />
              <SkeletonRow items={3} height={40} style={styles.skeleton} />
              <Skeleton height={30} width="60%" style={styles.skeleton} />
              <SkeletonRow items={1} height={80} style={styles.skeleton} />
            </View>
          </View>
        ) : transactions.length === 0 ? (
          <Animated.View 
            style={styles.emptyContainer}
            entering={FadeIn.delay(200)}
          >
            <Ionicons name="analytics-outline" size={64} color={theme.colors.textHint} />
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
          </Animated.View>
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
        
        <AnimatedCard style={styles.section} elevation="small" entering={SlideInRight.duration(500).delay(300)}>
          <Text variant="titleMedium" style={styles.sectionTitle}>AI-Powered Features</Text>
          <Text variant="bodyMedium" style={styles.sectionDescription}>
            RupeeRadar uses artificial intelligence to help you understand your spending patterns
            and provide personalized financial advice.
          </Text>
          
          <View style={styles.featureList}>
            <Animated.View 
              style={styles.featureItem}
              entering={FadeIn.delay(400)}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Ionicons name="chatbubble-ellipses" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleSmall" style={styles.featureTitle}>Smart Categorization</Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Automatically categorizes your transactions using advanced AI that learns from your spending patterns.
                </Text>
              </View>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={FadeIn.delay(500)}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                <Ionicons name="bar-chart" size={24} color={theme.colors.secondary} />
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleSmall" style={styles.featureTitle}>Spending Analysis</Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Get personalized insights about your spending habits and actionable recommendations.
                </Text>
              </View>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={FadeIn.delay(600)}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                <Ionicons name="alert-circle" size={24} color={theme.colors.warning} />
              </View>
              <View style={styles.featureContent}>
                <Text variant="titleSmall" style={styles.featureTitle}>Anomaly Detection</Text>
                <Text variant="bodySmall" style={styles.featureDesc}>
                  Identifies unusual spending patterns and potentially fraudulent transactions to keep your finances safe.
                </Text>
              </View>
            </Animated.View>
          </View>
        </AnimatedCard>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  timeframeContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },
  activeSegment: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  skeletonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  skeleton: {
    marginBottom: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing.lg,
    ...theme.shadows.small,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    color: theme.colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionDescription: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  featureList: {
    marginTop: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
}); 