import { Stack } from "expo-router";

export default function RootLayout() {
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
