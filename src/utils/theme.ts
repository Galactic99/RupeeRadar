// Theme colors and styles for consistent UI
// This can be extended as needed for different UI elements

// Light theme colors
export const lightColors = {
  // Primary palette
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#64B5F6',
  
  // Secondary palette
  secondary: '#4CAF50',
  secondaryDark: '#388E3C',
  secondaryLight: '#81C784',
  
  // Neutrals
  background: '#f5f7fa',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  
  // Text
  textPrimary: '#212121',
  textSecondary: '#616161',
  textHint: '#9E9E9E',
  textDisabled: '#BDBDBD',
  textLight: '#FFFFFF',
  
  // Status
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  
  // Transaction specific
  debit: '#F44336',
  credit: '#4CAF50',
  
  // Others
  divider: '#EEEEEE',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  shimmer: '#E0E0E0',
};

// Dark theme colors
export const darkColors = {
  // Primary palette
  primary: '#64B5F6',
  primaryDark: '#2196F3',
  primaryLight: '#90CAF9',
  
  // Secondary palette
  secondary: '#81C784',
  secondaryDark: '#4CAF50',
  secondaryLight: '#A5D6A7',
  
  // Neutrals
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#272727',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textHint: '#AAAAAA',
  textDisabled: '#868686',
  textLight: '#FFFFFF',
  
  // Status
  error: '#FF5252',
  warning: '#FFB74D',
  success: '#69F0AE',
  info: '#40C4FF',
  
  // Transaction specific
  debit: '#FF5252',
  credit: '#69F0AE',
  
  // Others
  divider: '#383838',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  shimmer: '#3D3D3D',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.25,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  subtitle1: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal',
    letterSpacing: 0.5,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal',
    letterSpacing: 0.25,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    letterSpacing: 0.4,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
};

export const animations = {
  fast: 200,
  medium: 300,
  slow: 500,
  pulse: {
    duration: 1500,
    repeat: -1,
  },
  fadeIn: {
    duration: 300,
  },
  fadeOut: {
    duration: 200,
  },
  slideUp: {
    duration: 300,
  },
  slideDown: {
    duration: 250,
  },
};

// Default light theme
const lightTheme = {
  colors: lightColors,
  spacing,
  borderRadius,
  shadows,
  typography,
  animations,
};

// Dark theme
export const darkTheme = {
  colors: darkColors,
  spacing,
  borderRadius,
  shadows,
  typography,
  animations,
};

// Export light theme as default
export default lightTheme; 