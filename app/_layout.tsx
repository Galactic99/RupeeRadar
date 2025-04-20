import { Stack } from "expo-router";
import { ThemeProvider } from "../src/context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen 
          name="insights" 
          options={{ 
            title: 'AI Insights',
            headerTitleAlign: 'center',
          }} 
        />
        <Stack.Screen name="advisor" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
