import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, TextInput as RNTextInput } from 'react-native';
import { Text, Surface, Button, TextInput, Avatar, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { getFilteredTransactions } from '../src/services/storageService';
import { Transaction } from '../src/types/transaction';
import { Ionicons } from '@expo/vector-icons';
import GeminiKeyMissing from '../src/components/GeminiKeyMissing';
import { GEMINI_API_KEY } from '@env';
import { callGeminiAPI, generateFinancialAdvice, FinancialAdvice } from '../src/services/geminiService';
import { useTheme } from '../src/context/ThemeContext';
import lightTheme, { darkTheme } from '../src/utils/theme';
import ThemedView from '../src/components/ui/ThemedView';

type MessageType = 'user' | 'bot' | 'thinking' | 'advice';

interface Message {
  id: string;
  text: string;
  type: MessageType;
  timestamp: Date;
  adviceData?: FinancialAdvice;
}

export default function AdvisorScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const flatListRef = useRef<FlatList>(null);

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "👋 Hi there! I'm your financial advisor. Ask me anything about your finances, budgeting, or ways to save money based on your spending patterns.",
      type: 'bot',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    loadTransactions();
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Check if API key is configured
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
        setIsApiKeyMissing(true);
        setLoading(false);
        return;
      }
      
      // Get transactions from the past 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const filtered = await getFilteredTransactions({
        startDate: threeMonthsAgo,
      });
      
      setTransactions(filtered);

      // If we have transactions, add a message with initial financial advice
      if (filtered.length > 0) {
        handleInitialAdvice(filtered);
      } else {
        addMessage({
          id: Date.now().toString(),
          text: "I don't see any transactions yet. Add some transactions so I can provide personalized financial advice!",
          type: 'bot',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      addMessage({
        id: Date.now().toString(),
        text: "Sorry, I had trouble loading your transactions. Please try again later.",
        type: 'bot',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitialAdvice = async (transactions: Transaction[]) => {
    try {
      // Add a thinking message
      const thinkingId = Date.now().toString();
      addMessage({
        id: thinkingId,
        text: "Analyzing your finances...",
        type: 'thinking',
        timestamp: new Date()
      });
      
      // Get financial advice
      const advice = await generateFinancialAdvice(transactions);
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingId));
      
      // Add advice message
      if (advice && advice.length > 0) {
        const topAdvice = advice[0];
        addMessage({
          id: Date.now().toString(),
          text: "Based on your transaction history, here's my top advice:",
          type: 'bot',
          timestamp: new Date()
        });
        
        setTimeout(() => {
          addMessage({
            id: Date.now().toString(),
            text: topAdvice.title,
            type: 'advice',
            timestamp: new Date(),
            adviceData: topAdvice
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error generating initial advice:', error);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const handleSend = async () => {
    if (input.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      type: 'user',
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    setInput('');
    
    // Add thinking message
    setIsThinking(true);
    const thinkingId = (Date.now() + 1).toString();
    addMessage({
      id: thinkingId,
      text: "Thinking...",
      type: 'thinking',
      timestamp: new Date()
    });
    
    try {
      // Prepare transaction data for context
      const categoryTotals: Record<string, number> = {};
      let totalSpent = 0;
      
      transactions
        .filter(tx => tx.type === 'debit')
        .forEach(transaction => {
          const category = transaction.category || 'Others';
          categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
          totalSpent += transaction.amount;
        });
      
      const totalIncome = transactions
        .filter(tx => tx.type === 'credit')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const categoryData = Object.entries(categoryTotals)
        .map(([category, amount]) => `${category}: ₹${amount.toFixed(2)} (${((amount/totalSpent)*100).toFixed(1)}%)`)
        .join('\n');
      
      const savingRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
      
      // Create prompt with user question and transaction context
      const prompt = `
        You are a helpful and friendly financial advisor chatbot that gives personalized advice based on the user's transaction data.
        
        User's financial data:
        - Total spending: ₹${totalSpent.toFixed(2)}
        - Total income: ₹${totalIncome.toFixed(2)}
        - Saving rate: ${savingRate.toFixed(1)}%
        - Spending by category:
        ${categoryData}
        
        The user asks: "${input.trim()}"
        
        Please provide a helpful, friendly, and personalized response based on their transaction data.
        Keep your answer concise (2-3 short paragraphs maximum) and relevant to their financial situation.
        Include specific numbers from their data when relevant.
        If you can't answer based on the data provided, suggest what additional information would be helpful.
      `;
      
      // Get response from Gemini
      const response = await callGeminiAPI(prompt);
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingId));
      
      // Add bot response
      addMessage({
        id: Date.now().toString(),
        text: response,
        type: 'bot',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingId));
      
      // Add error message
      addMessage({
        id: Date.now().toString(),
        text: "Sorry, I couldn't process your question. Please try again.",
        type: 'bot',
        timestamp: new Date()
      });
    } finally {
      setIsThinking(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.type === 'user';
    
    if (item.type === 'thinking') {
      return (
        <View style={[styles.botMessageContainer]}>
          <Surface style={[styles.thinkingBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.thinkingIndicator} />
            <Text style={[styles.messageText, { color: theme.colors.textSecondary }]}>{item.text}</Text>
          </Surface>
        </View>
      );
    }
    
    if (item.type === 'advice' && item.adviceData) {
      return (
        <View style={styles.botMessageContainer}>
          <Surface style={[styles.adviceBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.adviceHeader}>
              <Ionicons name="bulb" size={20} color={theme.colors.primary} />
              <Text style={[styles.adviceTitle, { color: theme.colors.textPrimary }]}>{item.adviceData.title}</Text>
            </View>
            <Text style={[styles.messageText, { color: theme.colors.textPrimary }]}>{item.adviceData.description}</Text>
          </Surface>
        </View>
      );
    }
    
    return (
      <View style={isUser ? styles.userMessageContainer : styles.botMessageContainer}>
        {!isUser && (
          <Avatar.Icon 
            size={36} 
            icon="robot" 
            style={[styles.botAvatar, { backgroundColor: theme.colors.primary }]} 
          />
        )}
        <Surface style={[
          isUser ? styles.userBubble : styles.botBubble,
          { backgroundColor: isUser ? theme.colors.primary : theme.colors.surfaceVariant }
        ]}>
          <Text style={[
            styles.messageText, 
            { color: isUser ? theme.colors.textLight : theme.colors.textPrimary }
          ]}>
            {item.text}
          </Text>
        </Surface>
      </View>
    );
  };

  if (isApiKeyMissing) {
    return <GeminiKeyMissing />;
  }

  if (loading && messages.length <= 1) {
    return (
      <ThemedView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>Setting up your advisor...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
          />
          
          <Surface style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask me something about your finances..."
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon 
                  icon="send" 
                  onPress={handleSend} 
                  disabled={input.trim() === '' || isThinking}
                  color={theme.colors.primary}
                />
              }
            />
          </Surface>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 80,
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  botMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  userBubble: {
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
    elevation: 1,
  },
  botBubble: {
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
    elevation: 1,
  },
  thinkingBubble: {
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adviceBubble: {
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '85%',
    elevation: 1,
  },
  botAvatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  thinkingIndicator: {
    marginRight: 8,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputContainer: {
    padding: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 4,
  },
  input: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
}); 