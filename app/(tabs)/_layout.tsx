import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

const TabIcon = ({ name, color, size }) => {
  return (
    <View className="flex items-center justify-center">
      <MaterialCommunityIcons name={name} size={size} color={color} />
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
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F5F5F5',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Income',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="cash-plus" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="cash-minus" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="flag" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chart-line" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
