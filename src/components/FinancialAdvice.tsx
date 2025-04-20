import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, useTheme, IconButton, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { generateFinancialAdvice, FinancialAdvice as FinancialAdviceType } from '../services/geminiService';
import { Transaction } from '../types/transaction';
import GeminiKeyMissing from './GeminiKeyMissing';
import { GEMINI_API_KEY } from '@env';

interface FinancialAdviceProps {
  transactions: Transaction[];
  onRefresh?: () => void;
}

const FinancialAdvice: React.FC<FinancialAdviceProps> = ({ 
  transactions, 
  onRefresh 
}) => {
  const [advice, setAdvice] = useState<FinancialAdviceType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    fetchAdvice();
  }, [transactions]);

  const fetchAdvice = async () => {
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
        const newAdvice = await generateFinancialAdvice(transactions);
        setAdvice(newAdvice);
      } else {
        setAdvice([
          {
            title: "Add Transactions",
            content: "Start by adding your financial transactions to get personalized advice.",
            tags: ["getting-started"],
            priority: "high"
          }
        ]);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('API key not configured')) {
        setIsApiKeyMissing(true);
      } else {
        setError('Failed to generate financial advice');
        console.error('Error fetching advice:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: FinancialAdviceType['priority']) => {
    switch(priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return '#FFC107';
      case 'low':
      default:
        return theme.colors.primary;
    }
  };

  const getPriorityIcon = (priority: FinancialAdviceType['priority']) => {
    switch(priority) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'information-circle';
      case 'low':
      default:
        return 'checkmark-circle';
    }
  };

  const renderAdviceCard = (advice: FinancialAdviceType, index: number) => {
    const priorityColor = getPriorityColor(advice.priority);
    const priorityIcon = getPriorityIcon(advice.priority);

    return (
      <Card key={index} style={styles.adviceCard}>
        <Card.Content>
          <View style={styles.titleContainer}>
            <Ionicons name={priorityIcon} size={24} color={priorityColor} style={styles.icon} />
            <Text variant="titleMedium" style={styles.title}>{advice.title}</Text>
          </View>

          <Text variant="bodyMedium" style={styles.content}>{advice.content}</Text>
          
          <View style={styles.tagsContainer}>
            {advice.tags.map((tag, tagIndex) => (
              <Chip 
                key={tagIndex} 
                style={styles.tag}
                textStyle={styles.tagText}
              >
                {tag}
              </Chip>
            ))}
          </View>

          <View style={styles.priorityContainer}>
            <Text variant="bodySmall" style={styles.priorityLabel}>
              Priority: 
              <Text style={{ color: priorityColor, fontWeight: 'bold' }}> {advice.priority.charAt(0).toUpperCase() + advice.priority.slice(1)}</Text>
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isApiKeyMissing) {
    return <GeminiKeyMissing feature="financial advice" />;
  }

  if (loading) {
    return (
      <Card style={styles.container}>
        <Card.Title title="Financial Advice" />
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing your finances...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.container}>
        <Card.Title 
          title="Financial Advice"
          right={() => (
            <IconButton
              icon="refresh"
              onPress={fetchAdvice}
              iconColor={theme.colors.primary}
            />
          )}
        />
        <Card.Content style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={theme.colors.error} />
          <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAdvice} style={styles.retryButton}>
            <Text style={{ color: theme.colors.primary }}>Try Again</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Title 
        title="AI Financial Advice" 
        subtitle="Personalized recommendations"
        right={() => (
          <IconButton
            icon="refresh"
            onPress={onRefresh || fetchAdvice}
            iconColor={theme.colors.primary}
          />
        )}
      />
      <Card.Content>
        <View style={styles.adviceList}>
          {advice.map((item, index) => (
            <React.Fragment key={index}>
              {renderAdviceCard(item, index)}
              {index < advice.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
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
  adviceList: {
    marginVertical: 4,
  },
  adviceCard: {
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
  content: {
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tagText: {
    fontSize: 12,
  },
  priorityContainer: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  priorityLabel: {
    fontSize: 12,
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
});

export default FinancialAdvice; 