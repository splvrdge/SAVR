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
import Joi from "joi";

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

  const signUpSchema = Joi.object({
    name: Joi.string().min(3).max(30).required().messages({
      "string.base": "Name must be a string.",
      "string.min": "Name must be at least 3 characters.",
      "string.max": "Name cannot exceed 30 characters.",
      "any.required": "Name is required.",
    }),
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
      "string.email": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
    password: Joi.string()
      .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must be at least 8 characters long, include a number, an uppercase letter, and a lowercase letter.",
        "any.required": "Password is required.",
      }),
  });

  const validateSignUp = (form: {
    name: string;
    email: string;
    password: string;
  }) => {
    const { error } = signUpSchema.validate(form);
    return error ? error.details[0].message : null;
  };

  const submit = async () => {
    const validationError = validateSignUp(form);

    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const checkEmailResponse = await fetch(
        `https://savr-backend.onrender.com/api/auth/checkEmail`,
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
        "https://savr-backend.onrender.com/api/auth/signup",
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

      setForm({ name: "", email: "", password: "" });
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

  const isFormComplete =
    form.name !== "" && form.email !== "" && form.password !== "" && isChecked;

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
