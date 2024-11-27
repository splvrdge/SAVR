import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { CheckBox } from "react-native-elements";
import GradientText from "@/constants/GradientText";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SignUp = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
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
    if (!validateEmail(form.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!isPasswordValid(form.password)) {
      Alert.alert(
        "Invalid Password",
        "Your password must be at least 8 characters long, include a number, an uppercase letter, and a lowercase letter."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const checkEmailResponse = await fetch(
        `https://localhost:3000/api/auth/checkEmail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_mail: form.email,
          }),
        }
      );

      const checkEmailData = await checkEmailResponse.json();

      if (!checkEmailResponse.ok) {
        throw new Error(`HTTP error! Status: ${checkEmailResponse.status}`);
      }

      if (!checkEmailData.available) {
        Alert.alert(
          "Email Exists",
          "This email address is already in use. Please use a different email."
        );
        return;
      }

      const signupResponse = await fetch(
        "https://localhost:3000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_name: form.name,
            user_mail: form.email,
            user_password: form.password,
          }),
        }
      );

      if (!signupResponse.ok) {
        throw new Error(`HTTP error! Status: ${signupResponse.status}`);
      }

      const responseData = await signupResponse.json();

      if (responseData.success) {
        await AsyncStorage.setItem("token", responseData.token);
        await AsyncStorage.setItem("userEmail", form.email);
        await AsyncStorage.setItem("userName", form.name);
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Error", responseData.message || "Signup failed.");
      }

      setForm({ name: "", email: "", password: "" }); // Clear form fields
    } catch (error) {
      console.error("Error signing up:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmail = (email) => {
    // Regular expression for basic email validation
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const isFormComplete =
    form.name !== "" && form.email !== "" && form.password !== "" && isChecked;

  const isPasswordValid = (password) => {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return regex.test(password);
  };

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
        <View className="w-full h-full justify-center px-8 my-5 min-h-[85vh]">
          <GradientText text="Create Account" />
          <FormField
            title="Full Name"
            value={form.name}
            handleChangeText={(e) => setForm({ ...form, name: e })}
            otherStyles="mt-7"
          />
          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />
          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
          />
          <Text className="text-xs mt-2 text-gray-600">
            Your password must be at least 8 characters long, include a number,
            an uppercase letter, and a lowercase letter
          </Text>

          <View className="flex-row gap-1 mt-5">
            <CheckBox
              checked={isChecked}
              onPress={() => setIsChecked(!isChecked)}
              containerStyle={{
                backgroundColor: "white",
                borderWidth: 0,
                padding: 0,
              }}
              textStyle={{
                color: "gray",
                fontWeight: "normal",
                fontSize: 13,
              }}
            />
            <Text className="mt-2 text-gray-600 pr-11">
              By signing up, you accept the Terms of Service and Privacy Policy
            </Text>
          </View>
          <CustomButton
            title="Sign up"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
            disabled={!isFormComplete}
          />
          <View className="justify-center flex-row gap-1 mt-10 pt-10">
            <Text className="text-gray-600">Already have an account?</Text>
            <Link href="sign-in" className="text-customGreen">
              Sign in
            </Link>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default SignUp;
