import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence,
  Easing,
  withSpring
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import lightTheme, { darkTheme } from '../../utils/theme';
import { useTheme } from '../../context/ThemeContext';

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
  color?: string;
  size?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  style,
  label,
  color,
  size = 56
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Use provided color or default from theme
  const buttonColor = color || theme.colors.primary;

  // Animation values
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Handle press animation
  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  // Handle onPress with animation
  const handlePress = () => {
    // Rotate animation
    rotate.value = withSequence(
      withTiming(15, { duration: 100 }),
      withTiming(-15, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
    
    // Execute the actual onPress callback
    onPress();
  };

  // Create animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` }
      ]
    };
  });

  return (
    <AnimatedTouchable
      style={[
        styles.container,
        { 
          backgroundColor: buttonColor,
          width: size,
          height: size,
          borderRadius: size / 2,
          bottom: theme.spacing.xl,
          right: theme.spacing.lg,
          ...theme.shadows.large
        },
        style,
        animatedStyle
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Ionicons name={icon as any} size={size/2} color={theme.colors.textLight} />
      {label && (
        <Text style={[
          styles.label,
          { color: theme.colors.textLight }
        ]}>
          {label}
        </Text>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 100,
  },
  label: {
    position: 'absolute',
    right: 64,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'center',
  }
});

export default FloatingActionButton; 