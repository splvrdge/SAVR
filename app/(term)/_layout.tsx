import { View, Text } from "react-native";
import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";

const TermLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="term" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default TermLayout;
