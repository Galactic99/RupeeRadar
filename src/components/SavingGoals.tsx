import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Text, useTheme, Divider, Button, ProgressBar } from 'react-native-paper';
import { Transaction } from '../types/transaction';
import { suggestSavingGoals } from '../services/geminiService';
import { Ionicons } from '@expo/vector-icons';
import { GEMINI_API_KEY } from '@env';
import GeminiKeyMissing from './GeminiKeyMissing';

interface SavingGoalsProps {
  transactions: Transaction[];
  onRefresh?: () => void;
}

interface SavingGoal {
  goal: string;
  amount: number;
  timeframe: string;
  reason: string;
}

const SavingGoals: React.FC<SavingGoalsProps> = ({ 
  transactions,
  onRefresh
}) => {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    fetchGoals();
  }, [transactions]);

  const fetchGoals = async () => {
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
        const savingGoals = await suggestSavingGoals(transactions);
        setGoals(savingGoals);
      } else {
        setGoals([
          {
            goal: "Start Saving",
            amount: 10000,
            timeframe: "3 months",
            reason: "Add transactions to get personalized saving goals."
          }
        ]);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('API key not configured')) {
        setIsApiKeyMissing(true);
      } else {
        setError('Failed to generate saving goals');
        console.error('Error fetching goals:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isApiKeyMissing) {
    return <GeminiKeyMissing feature="insights" />;
  }

  if (loading) {
    return (
      <Card style={styles.container}>
        <Card.Title title="AI Saving Goals" />
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
          title="AI Saving Goals"
          right={(props) => (
            <Button
              icon="refresh"
              onPress={fetchGoals}
              mode="text"
            >
              Retry
            </Button>
          )}
        />
        <Card.Content style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Title 
        title="AI Saving Goals" 
        subtitle="Personalized recommendations based on your spending"
        right={(props) => (
          <Button
            icon="refresh"
            onPress={onRefresh || fetchGoals}
            mode="text"
          >
            Refresh
          </Button>
        )}
      />
      <Card.Content>
        {goals.map((goal, index) => (
          <View key={index} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text variant="titleMedium" style={styles.goalTitle}>{goal.goal}</Text>
              <Text variant="titleLarge" style={styles.goalAmount}>{formatCurrency(goal.amount)}</Text>
            </View>
            
            <View style={styles.goalDetails}>
              <Text variant="bodyMedium" style={styles.goalTimeframe}>Timeframe: {goal.timeframe}</Text>
              <Text variant="bodyMedium" style={styles.goalReason}>{goal.reason}</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <Text variant="bodySmall" style={styles.progressText}>Progress: 0%</Text>
              <ProgressBar progress={0} color={theme.colors.primary} style={styles.progressBar} />
            </View>
            
            {index < goals.length - 1 && <Divider style={styles.divider} />}
          </View>
        ))}
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
  goalCard: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontWeight: 'bold',
  },
  goalAmount: {
    fontWeight: 'bold',
    color: '#4caf50',
  },
  goalDetails: {
    marginBottom: 12,
  },
  goalTimeframe: {
    marginBottom: 4,
    fontStyle: 'italic',
  },
  goalReason: {
    opacity: 0.8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  divider: {
    marginTop: 16,
  },
});

export default SavingGoals; 