import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import lightTheme, { darkTheme } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Animation values
  const opacity = useSharedValue(0.5);
  const rotation = useSharedValue(0);
  const scale1 = useSharedValue(0);
  const scale2 = useSharedValue(0);
  const scale3 = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for opacity
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Rotation animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Scale animations with delays
    scale1.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
    
    scale2.value = withRepeat(
      withDelay(
        200,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
      ),
      -1,
      true
    );
    
    scale3.value = withRepeat(
      withDelay(
        400,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
      opacity: opacity.value,
    };
  });

  const dot1Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale1.value }],
      opacity: interpolate(scale1.value, [0, 1], [0.3, 1]),
    };
  });

  const dot2Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale2.value }],
      opacity: interpolate(scale2.value, [0, 1], [0.3, 1]),
    };
  });

  const dot3Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale3.value }],
      opacity: interpolate(scale3.value, [0, 1], [0.3, 1]),
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Ionicons name="analytics" size={40} color={theme.colors.primary} />
      </Animated.View>
      
      <Text style={[styles.message, { color: theme.colors.textPrimary }]}>{message}</Text>
      
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }, dot1Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }, dot2Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary }, dot3Style]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 300,
  },
  iconContainer: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default PageLoader; 