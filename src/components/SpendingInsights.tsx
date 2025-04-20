import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme, IconButton, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { generateSpendingInsights, SpendingInsight } from '../services/geminiService';
import { Transaction } from '../types/transaction';
import GeminiKeyMissing from './GeminiKeyMissing';
import { GEMINI_API_KEY } from '@env';

interface SpendingInsightsProps {
  transactions: Transaction[];
  timeframe: 'week' | 'month' | 'year';
  onRefresh?: () => void;
}

const SpendingInsights: React.FC<SpendingInsightsProps> = ({ 
  transactions, 
  timeframe,
  onRefresh 
}) => {
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    fetchInsights();
  }, [transactions, timeframe]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsApiKeyMissing(false);
      
      // Check if API key is configured
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
        setIsApiKeyMissing(true);
        setLoading(false);
        return;
      }
      
      // Only proceed if we have transactions
      if (transactions && transactions.length > 0) {
        const newInsights = await generateSpendingInsights(transactions, timeframe);
        setInsights(newInsights);
      } else {
        setInsights([
          {
            title: 'No transactions',
            description: 'Add transactions to get personalized insights.',
            type: 'neutral'
          }
        ]);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('API key not configured')) {
        setIsApiKeyMissing(true);
      } else {
        setError('Failed to generate insights');
        console.error('Error fetching insights:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: SpendingInsight['type']) => {
    switch(type) {
      case 'positive':
        return { name: 'trending-up', color: theme.colors.primary };
      case 'negative':
        return { name: 'trending-down', color: theme.colors.error };
      case 'warning':
        return { name: 'alert-circle', color: theme.colors.warning };
      case 'neutral':
      default:
        return { name: 'information-circle', color: theme.colors.secondary };
    }
  };

  const renderInsightCard = (insight: SpendingInsight, index: number) => {
    const icon = getInsightIcon(insight.type);

    return (
      <Card key={index} style={styles.insightCard}>
        <Card.Content>
          <View style={styles.titleContainer}>
            <Ionicons name={icon.name} size={24} color={icon.color} style={styles.icon} />
            <Text variant="titleMedium" style={styles.title}>{insight.title}</Text>
          </View>
          <Text variant="bodyMedium" style={styles.description}>{insight.description}</Text>
          
          {insight.actionItem && (
            <View style={styles.actionContainer}>
              <Text variant="bodySmall" style={styles.actionLabel}>Suggestion:</Text>
              <Text variant="bodyMedium" style={styles.actionText}>{insight.actionItem}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (isApiKeyMissing) {
    return <GeminiKeyMissing feature="insights" />;
  }

  if (loading) {
    return (
      <Card style={styles.container}>
        <Card.Title title="AI Insights" />
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing your spending...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.container}>
        <Card.Title 
          title="AI Insights"
          right={() => (
            <IconButton
              icon="refresh"
              onPress={fetchInsights}
              iconColor={theme.colors.primary}
            />
          )}
        />
        <Card.Content style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={theme.colors.error} />
          <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchInsights} style={styles.retryButton}>
            <Text style={{ color: theme.colors.primary }}>Try Again</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Title 
        title="AI Insights" 
        subtitle={`Based on your ${timeframe} spending`}
        right={() => (
          <IconButton
            icon="refresh"
            onPress={onRefresh || fetchInsights}
            iconColor={theme.colors.primary}
          />
        )}
      />
      <Card.Content>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {insights.map((insight, index) => (
            <React.Fragment key={index}>
              {renderInsightCard(insight, index)}
              {index < insights.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    elevation: 2,
    borderRadius: 8,
  },
  scrollView: {
    maxHeight: 340,
  },
  scrollViewContent: {
    paddingVertical: 4,
  },
  insightCard: {
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  description: {
    marginBottom: 8,
  },
  actionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  actionLabel: {
    fontWeight: '700',
    marginBottom: 2,
  },
  actionText: {
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  divider: {
    height: 8,
  },
})

export default SpendingInsights; 