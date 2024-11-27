import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FormField from "@/components/FormField";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const router = useRouter();

  const handleChangePassword = async () => {
    if (newPassword !== retypePassword) {
      Alert.alert("Error", "New password and retyped password do not match");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const userMail = await AsyncStorage.getItem("user_mail");

      const response = await axios.post(
        "https://rtm-aiven-backend.onrender.com/api/auth/changePassword",
        {
          user_mail: userMail,
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Password changed successfully");
        router.back();
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Password change error:", error);
      Alert.alert("Error", "Failed to change password");
    }
  };

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
        <Text className="text-2xl font-bold text-customBlue ml-3">
          Change Password
        </Text>
      </View>
      <View className="px-8">
        <FormField
          title="Current Password"
          value={currentPassword}
          handleChangeText={setCurrentPassword}
          otherStyles="mt-7"
          secureTextEntry
        />
        <FormField
          title="New Password"
          value={newPassword}
          handleChangeText={setNewPassword}
          otherStyles="mt-4"
          secureTextEntry
        />
        <FormField
          title="Retype Password"
          value={retypePassword}
          handleChangeText={setRetypePassword}
          otherStyles="mt-4"
          secureTextEntry
        />
        <TouchableOpacity
          className="mt-8 bg-customBlue py-3 rounded-lg"
          onPress={handleChangePassword}
        >
          <Text className="text-white text-center font-bold">
            Change Password
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChangePassword;
