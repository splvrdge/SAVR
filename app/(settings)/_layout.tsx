import { View, Text } from "react-native";
import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";

const TabsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="contact-the-developers"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="frequently-asked-questions"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="terms-of-service"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

<StatusBar style="light" />;

export default TabsLayout;
