import React from "react";
import { View, Text, SafeAreaView } from "react-native";

const Goals = () => {
  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="mt-4">
        <Text className="text-2xl font-bold text-blue-600">Goals</Text>
        <Text className="text-base text-gray-600 mt-2">
          Set and track your financial goals here.
        </Text>
      </View>
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400 text-lg">No goals set yet.</Text>
      </View>
    </SafeAreaView>
  );
};

export default Goals;
