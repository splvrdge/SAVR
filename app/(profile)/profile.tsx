import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import NetInfo from "@react-native-community/netinfo";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

interface User {
  name: string | null;
  email: string | null;
}

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }

      const userName = await AsyncStorage.getItem("userName");
      if (userName) {
        setUser({ name: userName, email: "" });
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(["token", "refreshToken", "userName"]);
              setUser(null);
              router.replace("/(auth)/sign-in");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push("/(profile)/edit-profile");
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please check your network settings."
      );
    } else {
      await fetchUser();
    }
    setRefreshing(false);
  }, []);

  const SettingsItem = ({ icon, title, subtitle = "", onPress }) => (
    <TouchableOpacity 
      className="flex-row items-center bg-white my-1 mx-4 p-4 rounded-2xl shadow-sm"
      style={{ 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
      }}
      onPress={onPress}
    >
      <View className="w-12 h-12 rounded-full bg-[#2E8B57]/10 items-center justify-center">
        {icon}
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-base font-semibold text-gray-800">{title}</Text>
        {subtitle ? (
          <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={24} color="#2E8B57" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <MaterialCommunityIcons name="account-off" size={64} color="#666" />
        <Text className="text-xl font-semibold mt-4 mb-2 text-center">
          Not Logged In
        </Text>
        <Text className="text-gray-600 mb-8 text-center">
          Please sign in to access your profile
        </Text>
        <TouchableOpacity
          className="bg-[#2E8B57] py-3 px-8 rounded-full"
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#2E8B57', '#3da370']}
            className="pb-8 rounded-b-[40px] shadow-lg"
          >
            <SafeAreaView className="px-6">
              <View className="flex-row items-center justify-between mb-8">
                <TouchableOpacity 
                  className="bg-white/20 p-2 rounded-full"
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-2xl font-bold flex-1 text-center">Profile</Text>
                <TouchableOpacity 
                  className="bg-white/20 p-2 rounded-full"
                  onPress={handleEditProfile}
                >
                  <Feather name="edit-2" size={20} color="white" />
                </TouchableOpacity>
              </View>
            
              <View className="flex-row items-center">
                <View className="w-24 h-24 rounded-2xl bg-white shadow-md justify-center items-center">
                  <Text className="text-[#2E8B57] text-3xl font-bold">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
                <View className="ml-5">
                  <Text className="text-white text-xl font-bold mb-1">{user.name}</Text>
                  <View className="bg-white/20 px-4 py-1 rounded-full">
                    <Text className="text-white">Personal Account</Text>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View className="mt-6">
            <Text className="px-6 mb-3 text-base font-semibold text-gray-800">
              Account Settings
            </Text>
            
            <SettingsItem
              icon={<Ionicons name="person-outline" size={24} color="#2E8B57" />}
              title="Personal Information"
              subtitle="Update your profile details"
              onPress={handleEditProfile}
            />
            
            <SettingsItem
              icon={<Ionicons name="lock-closed-outline" size={24} color="#2E8B57" />}
              title="Security"
              subtitle="Change password and security settings"
              onPress={() => Alert.alert("Coming Soon", "This feature will be available soon!")}
            />
            
            <SettingsItem
              icon={<Ionicons name="shield-outline" size={24} color="#2E8B57" />}
              title="Privacy"
              subtitle="Manage your privacy settings"
              onPress={() => Alert.alert("Coming Soon", "This feature will be available soon!")}
            />
            
            <SettingsItem
              icon={<Ionicons name="help-circle-outline" size={24} color="#2E8B57" />}
              title="Help & Support"
              subtitle="Get help or contact support"
              onPress={() => Alert.alert("Coming Soon", "This feature will be available soon!")}
            />
          </View>

          <TouchableOpacity
            className="mx-4 my-8 p-4 rounded-2xl bg-red-50 flex-row items-center justify-center"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text className="text-red-500 font-semibold ml-2">Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Profile;
