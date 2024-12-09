import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const Settings = () => {
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
        <Text className="text-2xl font-bold text-customGreen ml-3">
          Settings
        </Text>
      </View>
      <View className="mt-4 px-6">
        <TouchableOpacity
          className="py-4 border-b border-gray-200"
          onPress={() => router.push("/change-password")}
        >
          <Text className="text-lg">Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="py-4 border-b border-gray-200"
          onPress={() => router.push("/contact-the-developers")}
        >
          <Text className="text-lg">Contact the Developers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="py-4 border-b border-gray-200"
          onPress={() => router.push("/profile")}
        >
          <Text className="text-lg">Profile Information</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="py-4 border-b border-gray-200"
          onPress={() => router.push("/frequently-asked-questions")}
        >
          <Text className="text-lg">Frequently Asked Questions (FAQs)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="py-4 border-b border-gray-200"
          onPress={() => router.push("/terms-of-service")}
        >
          <Text className="text-lg">Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="py-4 border-b border-gray-200"
          onPress={() => router.push("/privacy-policy")}
        >
          <Text className="text-lg">Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
