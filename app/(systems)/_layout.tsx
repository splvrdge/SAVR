import { View, Text } from "react-native";
import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";

const SystemsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="[title]" options={{ headerShown: false }} />
        <Stack.Screen
          name="bookmarks/[title]"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
};

export default SystemsLayout;
