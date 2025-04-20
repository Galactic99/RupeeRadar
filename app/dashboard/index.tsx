import { View, StyleSheet } from "react-native";
import { Text, Button, Card, useTheme } from "react-native-paper";
import { router } from "expo-router";

export default function DashboardOverview() {
  const theme = useTheme();

  const navigateToInsights = () => {
    router.push('/insights');
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Dashboard Overview</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">AI-Powered Insights</Text>
          <Text variant="bodyMedium" style={styles.cardDescription}>
            Get personalized financial insights powered by Gemini AI.
            Understand your spending patterns and receive tailored recommendations.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained"
            onPress={navigateToInsights}
            style={{ backgroundColor: theme.colors.primary }}
          >
            View Insights
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardDescription: {
    marginTop: 8,
    marginBottom: 8,
    opacity: 0.7,
  },
});