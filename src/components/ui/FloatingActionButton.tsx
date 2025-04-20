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
import theme from '../../utils/theme';

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
  color = theme.colors.primary,
  size = 56
}) => {
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
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
        animatedStyle
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Ionicons name={icon as any} size={size/2} color="white" />
      {label && <Text style={styles.label}>{label}</Text>}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.large,
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    zIndex: 100,
  },
  label: {
    position: 'absolute',
    right: 64,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
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