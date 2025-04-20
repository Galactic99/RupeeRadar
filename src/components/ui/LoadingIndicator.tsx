import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type LoadingIndicatorProps = {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  color = '#2196F3',
  text,
  fullScreen = false,
}) => {
  return (
    <Animated.View 
      style={[
        styles.container,
        fullScreen && styles.fullScreen
      ]}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 999,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
});

export default LoadingIndicator; 