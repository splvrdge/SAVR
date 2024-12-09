import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const FAQs = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="px-4 pt-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Image
            source={require("../../assets/icons/back.png")}
            className="w-6 h-6"
          />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-customGreen ml-3">
          Frequently Asked Questions (FAQs)
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default FAQs;
