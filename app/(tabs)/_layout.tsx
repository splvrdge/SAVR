import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        router.replace("/(auth)/sign-in");
      }
    };
    checkAuth();
  }, []);

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
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chart-line" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
