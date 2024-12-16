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

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // First check if email exists
      const checkEmailResponse = await axiosInstance.post(
        API_ENDPOINTS.AUTH.CHECK_EMAIL,
        {
          user_email: email,
        }
      );

      if (!checkEmailResponse.data.available) {
        Alert.alert("Error", "Email already exists");
        setIsLoading(false);
        return;
      }

      // Proceed with sign up
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.SIGNUP, {
        user_name: name,
        user_email: email,
        user_password: password,
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data;

        // Store tokens and user info using TokenManager
        await Promise.all([
          tokenManager.setTokens(accessToken, refreshToken),
          tokenManager.setUserInfo(user.user_id.toString(), user.user_name),
        ]);

        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to sign up. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Implement Google Sign Up
    Alert.alert("Coming Soon", "Google signup will be available soon!");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-8 pt-20">
          {/* Header */}
          <View className="mb-16">
            <Text className="text-4xl font-bold text-gray-900 mb-4">
              Create Account
            </Text>
            <Text className="text-gray-600 text-lg">
              Start your financial journey with us
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-8">
            <View className="mb-3">
              <Text className="text-gray-700 mb-2 text-base font-medium">
                Full Name
              </Text>
              <TextInput
                className="bg-gray-50 px-5 py-4 rounded-2xl text-base"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 mb-2 text-base font-medium">
                Email
              </Text>
              <TextInput
                className="bg-gray-50 px-5 py-4 rounded-2xl text-base"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 mb-2 text-base font-medium">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-gray-50 px-5 py-4 rounded-2xl text-base pr-12"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  className="absolute right-5 top-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 mb-2 text-base font-medium">
                Confirm Password
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-gray-50 px-5 py-4 rounded-2xl text-base pr-12"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  className="absolute right-5 top-4"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-6">
              <TouchableOpacity
                className={`bg-customGreen py-4 rounded-2xl ${
                  isLoading ? "opacity-70" : ""
                }`}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center text-lg font-semibold">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center my-8">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-gray-400 font-medium">or</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            <TouchableOpacity
              className="bg-white border border-gray-200 py-4 rounded-2xl flex-row justify-center items-center shadow-sm"
              onPress={handleGoogleSignUp}
            >
              <Image
                source={require("../../assets/icons/google.png")}
                style={{ width: 24, height: 24, marginRight: 12 }}
                resizeMode="contain"
              />
              <Text className="text-gray-700 text-base font-medium">
                Sign up with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-12 flex-row justify-center">
            <Text className="text-gray-600 text-base">
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-customGreen font-semibold text-base">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
