import { useState } from 'react';
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
  Image
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '@/constants/API';
import axiosInstance from '@/utils/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
        user_email: email.trim().toLowerCase(),
        user_password: password
      });

      const { data } = response;
      
      if (data.success) {
        const { accessToken, refreshToken, user_name, user_id } = data;
        
        // Store the tokens
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
          ['userId', user_id.toString()],
          ['userName', user_name]
        ]);

        // Reset the form
        setEmail('');
        setPassword('');
        setIsLoading(false);

        // Navigate to the main app
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Failed to sign in');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              Welcome back!
            </Text>
            <Text className="text-gray-600 text-lg">
              Sign in to continue tracking your finances
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-8">
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 text-base font-medium">Email</Text>
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

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 text-base font-medium">Password</Text>
              <View className="relative">
                <TextInput
                  className="bg-gray-50 px-5 py-4 rounded-2xl text-base pr-12"
                  placeholder="Enter your password"
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
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-6">
              <TouchableOpacity
                className={`bg-customGreen py-4 rounded-2xl ${
                  isLoading ? 'opacity-70' : ''
                }`}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center text-lg font-semibold">
                    Sign In
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
              onPress={handleGoogleSignIn}
            >
              <Image 
                source={require('../../assets/icons/google.png')} 
                style={{ width: 24, height: 24, marginRight: 12 }}
                resizeMode="contain"
              />
              <Text className="text-gray-700 text-base font-medium">
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-12 flex-row justify-center">
            <Text className="text-gray-600 text-base">Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-customGreen font-semibold text-base">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}