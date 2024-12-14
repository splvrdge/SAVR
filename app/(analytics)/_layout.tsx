import { Stack } from 'expo-router';

export default function AnalyticsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Analytics',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
          },
        }}
      />
    </Stack>
  );
}