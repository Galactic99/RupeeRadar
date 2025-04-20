import { Stack } from "expo-router";
import { ThemeProvider } from "../src/context/ThemeContext";
import { SMSProvider, useSMS } from "../src/context/SMSContext";
import { useEffect } from "react";

function RootLayoutContent() {
  const { hasPermissions, startListening } = useSMS();

  // Start SMS listener if permissions are granted
  useEffect(() => {
    if (hasPermissions) {
      startListening();
    }
  }, [hasPermissions]);

  return (
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
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SMSProvider>
        <RootLayoutContent />
      </SMSProvider>
    </ThemeProvider>
  );
}
