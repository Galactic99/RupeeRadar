import React, { useState } from 'react';
import { Text, View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Stack, Link } from "expo-router";
import Button from '../src/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import lightTheme, { darkTheme } from '../src/utils/theme';
import { useTheme } from '../src/context/ThemeContext';
import ThemedView from '../src/components/ui/ThemedView';

export default function HomeScreen() {
  // Animation for the logo
  const scale = useSharedValue(1);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  React.useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, { 
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh action
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <ThemedView>
      <Stack.Screen options={{ 
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }} />
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View 
          style={styles.header}
          entering={FadeInDown.duration(800).springify()}
        >
          <Text style={[styles.title, { color: theme.colors.primary }]}>RupeeRadar</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Track your expenses with SMS analysis</Text>
        </Animated.View>
        
        <Animated.View 
          style={[styles.imageContainer, logoStyle]}
          entering={FadeIn.delay(300).duration(1000)}
        >
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.logoText}>₹</Text>
            <Animated.View style={[styles.logoGlow, { borderColor: `${theme.colors.primary}40` }]} />
          </View>
        </Animated.View>
        
        <Animated.View 
          style={styles.buttonsContainer}
          entering={FadeInDown.delay(500).duration(800)}
        >
          <Link href="/sms-input" asChild>
            <Button 
              title="Analyze SMS" 
              onPress={() => {}} 
              style={styles.button}
              icon={<Ionicons name="scan-outline" size={20} color="white" style={styles.buttonIcon} />}
            />
          </Link>
          
          <Link href="/dashboard" asChild>
            <Button 
              title="Go to Dashboard" 
              onPress={() => {}} 
              variant="outlined"
              style={styles.button}
              icon={<Ionicons name="grid-outline" size={20} color={theme.colors.primary} style={styles.buttonIcon} />}
            />
          </Link>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 60,
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative',
    overflow: 'visible',
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'transparent',
    borderWidth: 2,
    zIndex: -1,
  },
  logoText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonsContainer: {
    marginTop: 'auto',
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 4,
  },
});
