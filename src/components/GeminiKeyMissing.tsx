import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface GeminiKeyMissingProps {
  feature: string;
}

const GeminiKeyMissing: React.FC<GeminiKeyMissingProps> = ({ feature }) => {
  const theme = useTheme();

  const openSetupGuide = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <Ionicons name="key-outline" size={48} color={theme.colors.primary} style={styles.icon} />
        
        <Text variant="titleLarge" style={styles.title}>API Key Required</Text>
        
        <Text style={styles.description}>
          The {feature} feature requires a Google Gemini API key to function.
        </Text>
        
        <View style={styles.steps}>
          <Text variant="bodyMedium" style={styles.stepsTitle}>Setup Steps:</Text>
          
          <Text style={styles.step}>
            1. Get a free Gemini API key from Google AI Studio
          </Text>
          <Text style={styles.step}>
            2. Add the key to your .env file as GEMINI_API_KEY=your_key_here
          </Text>
          <Text style={styles.step}>
            3. Restart the app to enable AI-powered features
          </Text>
        </View>
        
        <Button 
          mode="contained" 
          onPress={openSetupGuide}
          style={styles.button}
        >
          Get API Key
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 8,
  },
  content: {
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  steps: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  stepsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  step: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
});

export default GeminiKeyMissing; 