import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, Alert } from 'react-native';
import { 
  checkSMSModuleAvailability, 
  requestSMSPermissions, 
  checkSMSPermissions, 
  startSMSListener 
} from '../services/smsService';
import { Transaction } from '../types/transaction';

const SMSReaderExample: React.FC = () => {
  const [moduleAvailable, setModuleAvailable] = useState<boolean>(false);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [stopListener, setStopListener] = useState<(() => void) | null>(null);

  // Check if SMS module is available on component mount
  useEffect(() => {
    const checkAvailability = () => {
      const availability = checkSMSModuleAvailability();
      setModuleAvailable(availability.available);
      
      if (!availability.available) {
        Alert.alert('SMS Module Not Available', availability.reason || 'Unknown error');
      }
    };
    
    checkAvailability();
  }, []);

  // Check for existing permissions
  useEffect(() => {
    const checkPermission = async () => {
      const permissions = await checkSMSPermissions();
      if (permissions && typeof permissions === 'object') {
        setHasPermissions(permissions.hasReadSmsPermission && permissions.hasReceiveSmsPermission);
      }
    };
    
    if (moduleAvailable) {
      checkPermission();
    }
  }, [moduleAvailable]);

  // Request permissions
  const handleRequestPermissions = async () => {
    try {
      const granted = await requestSMSPermissions();
      setHasPermissions(granted);
      
      if (!granted) {
        Alert.alert('Permission Denied', 'SMS permissions are required to detect transactions');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request SMS permissions');
    }
  };

  // Start SMS listener
  const handleStartListener = () => {
    if (!moduleAvailable || !hasPermissions) {
      Alert.alert('Cannot Start', 'SMS module is not available or permissions are not granted');
      return;
    }
    
    const stop = startSMSListener(
      // onNewTransaction callback
      (transaction) => {
        setTransactions(prev => [transaction, ...prev]);
      },
      // onError callback
      (error) => {
        console.error('SMS listener error:', error);
        Alert.alert('SMS Error', 'An error occurred while reading SMS messages');
      }
    );
    
    setStopListener(() => stop);
    setIsListening(true);
  };

  // Stop SMS listener
  const handleStopListener = () => {
    if (stopListener) {
      stopListener();
      setStopListener(null);
      setIsListening(false);
    }
  };

  // Render each transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    return (
      <View style={styles.transactionItem}>
        <Text style={styles.transactionTitle}>{item.description}</Text>
        <View style={styles.transactionDetails}>
          <Text style={styles.amount}>
            ₹{item.amount.toFixed(2)} ({item.type})
          </Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SMS Transaction Reader</Text>
      
      <View style={styles.statusContainer}>
        <Text>Module Available: {moduleAvailable ? '✅' : '❌'}</Text>
        <Text>Has Permissions: {hasPermissions ? '✅' : '❌'}</Text>
        <Text>Listener Status: {isListening ? '🔄 Running' : '⏹️ Stopped'}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {!hasPermissions && (
          <Button 
            title="Request Permissions" 
            onPress={handleRequestPermissions} 
            disabled={!moduleAvailable}
          />
        )}
        
        {!isListening ? (
          <Button 
            title="Start SMS Listener" 
            onPress={handleStartListener} 
            disabled={!moduleAvailable || !hasPermissions}
          />
        ) : (
          <Button 
            title="Stop SMS Listener" 
            onPress={handleStopListener}
            color="red"
          />
        )}
      </View>
      
      <Text style={styles.listTitle}>
        Detected Transactions ({transactions.length})
      </Text>
      
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyList}>
            No transactions detected yet. SMS containing banking transactions will appear here.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
    fontStyle: 'italic',
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amount: {
    fontWeight: '500',
  },
  category: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
});

export default SMSReaderExample; 