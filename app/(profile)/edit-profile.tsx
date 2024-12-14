import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import GradientText from "@/constants/GradientText";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";

const EditProfile = () => {
  const router = useRouter();
  const [user, setUser] = useState({ name: "", email: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);
        }

        const userName = await AsyncStorage.getItem("userName");
        const userEmail = await AsyncStorage.getItem("userEmail");
        if (userName && userEmail) {
          setUser({ name: userName, email: userEmail });
          setName(userName);
          setEmail(userEmail);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        "https://savr-backend.onrender.com/api/user/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name,
            email: email,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
      }

      if (responseData.success) {
        await AsyncStorage.setItem("userName", name);
        
        if (responseData.requireRelogin) {
          // Store new tokens before redirecting
          if (responseData.accessToken && responseData.refreshToken) {
            await AsyncStorage.multiSet([
              ["token", responseData.accessToken],
              ["refreshToken", responseData.refreshToken],
              ["userName", name],
              ["userEmail", email],
              ["userId", responseData.user_id.toString()]
            ]);
          }

          Alert.alert(
            "Email Updated",
            "Your email has been updated successfully. You'll be redirected to the home screen.",
            [
              {
                text: "OK",
                onPress: () => {
                  router.replace("/(tabs)/home");
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Success",
            "Profile updated successfully!",
            [
              {
                text: "OK",
                onPress: () => {
                  router.push("/(profile)/profile");
                },
              },
            ]
          );
        }
      } else {
        Alert.alert(
          "Error",
          responseData.message || "Failed to update profile."
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.message.includes("Email already in use")) {
        Alert.alert("Error", "This email is already registered with another account.");
      } else if (
        error.message.includes("Unauthorized") ||
        error.message.includes("401")
      ) {
        Alert.alert("Session Expired", "Please log in again.");
        await AsyncStorage.multiRemove(["token", "refreshToken", "userName", "userEmail", "userId"]);
        router.push("/(auth)/sign-in");
      } else {
        Alert.alert(
          "Error",
          error.message || "An unexpected error occurred. Please try again later."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete =
    name !== "" && email !== "" && (name !== user.name || email !== user.email);

  if (!user.name && !user.email) {
    return (
      <View className="flex justify-center items-center flex-1">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="bg-white flex-1">
      <ScrollView>
        <View className="px-8 py-20">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-0 left-0 p-5"
          >
            <Image
              source={require("../../assets/icons/back.png")}
              style={{ width: 26, height: 26 }}
            />
          </TouchableOpacity>
          <GradientText text="Edit Profile" />
          <FormField
            title="Name"
            value={name}
            handleChangeText={setName}
            otherStyles="mt-7"
          />
          <FormField
            title="Email"
            value={email}
            handleChangeText={setEmail}
            otherStyles="mt-7"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <CustomButton
            title="Update Profile"
            handlePress={handleUpdateProfile}
            containerStyles="mt-7"
            isLoading={isLoading}
            disabled={!isFormComplete || isLoading}
          />
        </View>
        <StatusBar style="dark" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;
