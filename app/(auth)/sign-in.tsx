import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { API_ENDPOINTS } from "@/constants/API";
import axiosInstance from "@/utils/axiosConfig";
import tokenManager from "@/utils/tokenManager";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
        user_email: email.trim().toLowerCase(),
        user_password: password,
      });

      const { data } = response;

      if (data.success) {
        const { accessToken, refreshToken, user } = data;

        // Store tokens and user info using TokenManager
        await Promise.all([
          tokenManager.setTokens(accessToken, refreshToken),
          tokenManager.setUserInfo(user.user_id.toString(), user.user_name),
        ]);

        // Reset the form
        setEmail("");
        setPassword("");

        // Navigate to home
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Error", data.message || "Failed to sign in");
      }
    } catch (error: any) {
      let errorMessage = "Failed to sign in. Please try again.";

      if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === "Network Error") {
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert("Coming Soon", "Google Sign In will be available soon!");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gradient-to-b from-primary-light/10 to-primary/10"
    >
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-10">
            <Text className="text-4xl font-bold text-gray-900 text-center mb-3">
              Welcome Back
            </Text>
            <Text className="text-base text-gray-600 text-center">
              Track your finances with ease
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-5 bg-white p-6 rounded-3xl shadow-sm border border-primary/10">
            <View>
              <Text className="text-gray-700 mb-2 text-base font-medium">
                Email
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                <MaterialCommunityIcons name="email-outline" size={20} color="#2563eb" />
                <TextInput
                  className="flex-1 px-3 py-3.5 text-base text-gray-800"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View>
              <Text className="text-gray-700 mb-2 text-base font-medium">
                Password
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                <MaterialCommunityIcons name="lock-outline" size={20} color="#2563eb" />
                <TextInput
                  className="flex-1 px-3 py-3.5 text-base text-gray-800"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-2"
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#2563eb"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className={`bg-primary mt-4 py-4 rounded-xl shadow-sm ${
                isLoading ? "opacity-70" : ""
              }`}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center text-base font-semibold">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Social Sign In */}
          <View className="mt-8">
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-gray-400 font-medium">or continue with</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            <TouchableOpacity
              className="bg-white border border-gray-200 py-3.5 rounded-xl flex-row justify-center items-center shadow-sm"
              onPress={handleGoogleSignIn}
            >
              <Image
                source={require("../../assets/icons/google.png")}
                style={{ width: 20, height: 20, marginRight: 10 }}
                resizeMode="contain"
              />
              <Text className="text-gray-700 text-base font-medium">
                Sign in with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-8 mb-6 flex-row justify-center items-center">
            <Text className="text-gray-600 text-base">
              Don't have an account?{" "}
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold text-base">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
