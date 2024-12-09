import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import GradientText from "@/constants/GradientText";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SignIn = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
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
        "https://localhost:3000/api/auth/login",
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

      const responseData = await response.json();

      if (responseData.success) {
        await AsyncStorage.setItem("token", responseData.token);
        await AsyncStorage.setItem("userEmail", form.email);
        await AsyncStorage.setItem("userName", responseData.user_name);

        const storedUserName = await AsyncStorage.getItem("userName");
        if (storedUserName !== responseData.user_name) {
          router.replace("/home");
        } else {
          router.replace("/(tabs)/home");
        }
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
            handleChangeText={(e: any) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />
          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e: any) => setForm({ ...form, password: e })}
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
