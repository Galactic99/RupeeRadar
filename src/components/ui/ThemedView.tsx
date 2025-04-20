import React from 'react';
import { View, ViewProps, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import lightTheme, { darkTheme } from '../../utils/theme';

interface ThemedViewProps extends ViewProps {
  children: React.ReactNode;
  useSafeArea?: boolean;
}

const ThemedView: React.FC<ThemedViewProps> = ({ children, style, ...props }) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
      />
      <View 
        style={[
          { backgroundColor: theme.colors.background },
          styles.container,
          style
        ]} 
        {...props}
      >
        {children}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ThemedView; 