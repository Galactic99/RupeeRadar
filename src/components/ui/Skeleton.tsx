import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import lightTheme, { darkTheme } from '../../utils/theme';
import { useTheme } from '../../context/ThemeContext';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 800, easing: Easing.ease }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { 
          width, 
          height, 
          borderRadius,
          backgroundColor: theme.colors.shimmer
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const SkeletonRow: React.FC<{
  items: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ items = 1, height = 20, style }) => {
  return (
    <View style={[styles.row, style]}>
      {Array(items)
        .fill(0)
        .map((_, index) => (
          <Skeleton 
            key={index} 
            height={height} 
            width={`${100 / items - 4}%`} 
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    // backgroundColor will be set dynamically
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 8,
  },
});

export { Skeleton, SkeletonRow };
export default Skeleton; 