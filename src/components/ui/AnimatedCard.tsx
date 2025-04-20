import React, { ReactNode } from 'react';
import { StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import lightTheme, { darkTheme } from '../../utils/theme';
import { useTheme } from '../../context/ThemeContext';

interface AnimatedCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  entering?: boolean;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  elevation = 'medium',
  entering = true,
  delay = 0,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.98]
    );
    
    // Add slight elevation increase on press
    const shadowOpacity = interpolate(
      pressed.value,
      [0, 1],
      [theme.shadows[elevation].shadowOpacity, theme.shadows[elevation].shadowOpacity * 1.2]
    );
    
    const elevationValue = interpolate(
      pressed.value,
      [0, 1],
      [theme.shadows[elevation].elevation, theme.shadows[elevation].elevation + 1]
    );

    return {
      transform: [{ scale }],
      shadowOpacity,
      elevation: elevationValue,
    };
  });

  const handlePressIn = () => {
    pressed.value = withTiming(1, { 
      duration: 100,
      easing: Easing.inOut(Easing.quad),
    });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { 
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: 16,
          marginVertical: 8,
          overflow: 'hidden',
        },
        theme.shadows[elevation],
        style,
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={entering ? FadeIn.duration(400).delay(delay).easing(Easing.out(Easing.quad)) : undefined}
      exiting={FadeOut.duration(300).easing(Easing.in(Easing.quad))}
    >
      {children}
    </AnimatedPressable>
  );
};

export default AnimatedCard; 