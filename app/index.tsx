import React from 'react';
import { Text, View, StyleSheet, Image } from "react-native";
import { Stack, Link } from "expo-router";
import Button from '../src/components/ui/Button';

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>RupeeRadar</Text>
          <Text style={styles.subtitle}>Track your expenses with SMS analysis</Text>
        </View>
        
        <View style={styles.imageContainer}>
          {/* Add an image or logo here if you have one */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>₹</Text>
          </View>
        </View>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Analyze bank SMS messages</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Auto-categorize transactions</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Visual spending breakdowns</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Get spending alerts and insights</Text>
          </View>
        </View>
        
        <View style={styles.buttonsContainer}>
          <Link href="/sms-input" asChild>
            <Button 
              title="Analyze SMS" 
              onPress={() => {}} 
              style={styles.button}
            />
          </Link>
          
          <Link href="/dashboard" asChild>
            <Button 
              title="Go to Dashboard" 
              onPress={() => {}} 
              variant="outlined"
              style={styles.button}
            />
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginRight: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#444',
  },
  buttonsContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  button: {
    marginBottom: 12,
  },
  link: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#2196F3",
    borderRadius: 5,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
