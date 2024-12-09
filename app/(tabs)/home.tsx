import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";

const Home = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="mt-4">
        <Text className="text-3xl font-bold text-blue-600">Welcome!</Text>
        <Text className="text-base text-gray-600 mt-2">
          Manage your finances effectively with quick access to your income,
          expenses, and goals.
        </Text>
      </View>

      <View className="flex-1 mt-6">
        <View className="gap-4">
          <TouchableOpacity
            className="p-4 bg-blue-100 rounded-lg"
            onPress={() => navigation.navigate("income")}
          >
            <Text className="text-lg font-semibold text-blue-600">Income</Text>
            <Text className="text-sm text-gray-600">
              Track your income sources.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 bg-red-100 rounded-lg"
            onPress={() => navigation.navigate("expenses")}
          >
            <Text className="text-lg font-semibold text-red-600">Expenses</Text>
            <Text className="text-sm text-gray-600">
              Monitor your spending habits.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 bg-green-100 rounded-lg"
            onPress={() => navigation.navigate("goals")}
          >
            <Text className="text-lg font-semibold text-green-600">Goals</Text>
            <Text className="text-sm text-gray-600">
              Set and achieve your financial goals.
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Home;
