import React, { forwardRef } from 'react';
import { 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  Pressable
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import lightTheme, { darkTheme } from '../../utils/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outlined';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Button = forwardRef<any, ButtonProps>((props, ref) => {
  const {
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
    ...rest
  } = props;

  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Animation values
  const pressed = useSharedValue(0);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.97]
    );
    
    return {
      transform: [{ scale }],
    };
  });

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [
          styles.button, 
          { 
            backgroundColor: isDarkMode ? theme.colors.surfaceVariant : '#e0e0e0',
          }, 
          style
        ];
      case 'outlined':
        return [
          styles.button, 
          { 
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
            elevation: 0,
            shadowOpacity: 0,
          }, 
          style
        ];
      case 'primary':
      default:
        return [
          styles.button, 
          { backgroundColor: theme.colors.primary }, 
          style
        ];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return [
          styles.buttonText, 
          { color: isDarkMode ? theme.colors.textPrimary : '#333333' }, 
          textStyle
        ];
      case 'outlined':
        return [
          styles.buttonText, 
          { color: theme.colors.primary }, 
          textStyle
        ];
      case 'primary':
      default:
        return [
          styles.buttonText, 
          { color: '#ffffff' }, 
          textStyle
        ];
    }
  };

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 200 });
  };

  const rippleColor = variant === 'primary' 
    ? 'rgba(255, 255, 255, 0.2)' 
    : `${theme.colors.primary}20`;

  return (
    <AnimatedPressable
      ref={ref}
      onPress={onPress}
      style={[getButtonStyle(), animatedStyle]}
      disabled={disabled || loading}
      android_ripple={{ 
        color: rippleColor,
        borderless: false 
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#ffffff' : theme.colors.primary} 
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
});

export default Button; 