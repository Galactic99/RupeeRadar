import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, TextInput as RNTextInput } from 'react-native';
import { Text, useTheme, Surface, Button, TextInput, Avatar, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { getFilteredTransactions } from '../src/services/storageService';
import { Transaction } from '../src/types/transaction';
import { Ionicons } from '@expo/vector-icons';
import GeminiKeyMissing from '../src/components/GeminiKeyMissing';
import { GEMINI_API_KEY } from '@env';
import { callGeminiAPI, generateFinancialAdvice, FinancialAdvice } from '../src/services/geminiService';

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
  const theme = useTheme();
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
    if (item.type === 'thinking') {
      return (
        <View style={[styles.messageContainer, styles.botMessageContainer]}>
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.thinkingIndicator} />
          <Text style={styles.thinkingText}>{item.text}</Text>
        </View>
      );
    }
    
    if (item.type === 'advice' && item.adviceData) {
      const { title, content, tags, priority } = item.adviceData;
      const priorityColor = priority === 'high' ? theme.colors.error : 
                           priority === 'medium' ? '#FFC107' : 
                           theme.colors.primary;
      
      return (
        <Surface style={[styles.adviceCard, { borderLeftColor: priorityColor }]}>
          <Text style={styles.adviceTitle}>{title}</Text>
          <Text style={styles.adviceContent}>{content}</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </Surface>
      );
    }
    
    return (
      <View style={[
        styles.messageContainer, 
        item.type === 'user' ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        {item.type === 'bot' && (
          <Avatar.Icon 
            size={32} 
            icon="robot" 
            style={styles.botAvatar} 
            color="white"
          />
        )}
        <Surface 
          style={[
            styles.messageBubble,
            item.type === 'user' ? styles.userBubble : styles.botBubble
          ]}
        >
          <Text style={item.type === 'user' ? styles.userMessageText : styles.botMessageText}>
            {item.text}
          </Text>
        </Surface>
      </View>
    );
  };

  if (isApiKeyMissing) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <GeminiKeyMissing feature="advisor" />
      </View>
    );
  }

  if (loading && messages.length <= 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Setting up your financial advisor...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <StatusBar style="auto" />
        
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Financial Advisor</Text>
        </View>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your finances..."
            style={styles.input}
            right={
              <TextInput.Icon 
                icon="send" 
                onPress={handleSend} 
                disabled={isThinking || !input.trim()} 
                color={input.trim() ? theme.colors.primary : '#ccc'}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  title: {
    fontWeight: 'bold',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    backgroundColor: '#6200ee',
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#6200ee',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderTopLeftRadius: 4,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#333',
  },
  inputContainer: {
    padding: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  thinkingIndicator: {
    marginRight: 8,
  },
  thinkingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  adviceCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    backgroundColor: 'white',
    elevation: 2,
    alignSelf: 'stretch',
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adviceContent: {
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
  },
}); 