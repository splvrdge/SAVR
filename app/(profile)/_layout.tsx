import { Stack } from "expo-router";
import React from "react";

const TabsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default TabsLayout;
