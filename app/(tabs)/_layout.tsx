import React from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TabIcon = ({ name, color, focused }) => {
  return (
    <View className="flex items-center justify-center">
      <MaterialCommunityIcons name={name} size={32} color={color} />
      <Text
        className={`${focused ? "font-semibold" : "font-normal"} text-2xl`}
        style={{ color }}
      ></Text>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2E8B57",
        tabBarInactiveTintColor: "#8E8E8E",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 110,
          paddingTop: 20,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: "Income",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cash-multiple" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="wallet-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="target" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
