import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import GradientText from "@/constants/GradientText";
import * as SecureStore from "expo-secure-store";

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user_name?: string;
}

const SignIn: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (token) {
        router.replace("/(tabs)/home");
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const submit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "https://savr-backend.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_mail: form.email,
            user_password: form.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData: LoginResponse = await response.json();

      if (responseData.success) {
        await SecureStore.setItemAsync("accessToken", responseData.token!);
        await SecureStore.setItemAsync("userEmail", form.email);
        await SecureStore.setItemAsync("userName", responseData.user_name!);
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Error", responseData.message);
      }

      setForm({ email: "", password: "" });
    } catch (error) {
      console.error("Error logging in:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = form.email !== "" && form.password !== "";

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView>
        <View className="w-full h-full justify-center px-8 my-5 min-h-[70vh]">
          <GradientText text="Login" />
          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e: string) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />
          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e: string) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
          />
          <Text className="mt-4 text-gray-600">Forgot Password?</Text>
          <CustomButton
            title="Sign in"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
            disabled={!isFormComplete}
          />
          <View className="justify-center flex-row gap-1 mt-10 pt-10">
            <Text className="text-gray-600">Don't have an account?</Text>
            <Link href="sign-up" className="text-customGreen">
              Sign up
            </Link>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default SignIn;
