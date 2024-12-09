import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Button,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import WhiteHeader from "@/constants/WhiteHeader";
import { StatusBar } from "expo-status-bar";
import NetInfo from "@react-native-community/netinfo";

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const userName = await AsyncStorage.getItem("userName");
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (storedToken && userName && userEmail) {
        setUser({ name: userName, email: userEmail });
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userName");
      await AsyncStorage.removeItem("userEmail");
      setUser(null);
      router.push("/(auth)/sign-in");
    } catch (error) {
      console.error("Error logging out:", error);
    }
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
      fetchUser();
    }
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#1B42CE" />
      </View>
    );
  }

  if (user) {
    return (
      <View className="bg-white h-full">
        <StatusBar style="light" />
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="px-8 pt-8 bg-customGreen pb-11 rounded-b-[40px]">
            <View className="pt-[40px] flex-row justify-between">
              <TouchableOpacity onPress={() => router.back()}>
                <Image
                  source={require("../../assets/icons/back.png")}
                  className="w-[26px] h-[26px] tint-white"
                />
              </TouchableOpacity>
              <WhiteHeader text="Profile" />
              <TouchableOpacity onPress={handleEditProfile}>
                <Image
                  source={require("../../assets/icons/compose.png")}
                  className="w-[28px] h-[28px] tint-white"
                />
              </TouchableOpacity>
            </View>
            <View className="mt-7 justify-center items-center pt-11">
              <Image
                source={require("../../assets/images/profile-user.png")}
                className="w-[80px] h-[80px] mb-4"
              />
              <Text className="text-2xl font-bold text-white">{user.name}</Text>
              <Text className="font-normal text-white text-[15px] pt-1">
                {user.email}
              </Text>
            </View>
          </View>
          <View className="mt-10 w-full ml-10">
            <TouchableOpacity
              className="flex-row py-2 items-center"
              onPress={() => router.push("/bookmarks")}
            >
              <Image
                source={require("../../assets/icons/bookmark-outline.png")}
                className="w-[30px] h-[30px]"
              />
              <Text className="text-gray-600 text-[18px] ml-5">
                My Bookmarks
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row py-2 items-center"
              onPress={() => router.push("/settings")}
            >
              <Image
                source={require("../../assets/icons/settings.png")}
                className="w-[30px] h-[30px]"
              />
              <Text className="text-gray-600 text-[18px] ml-5">Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row py-2 items-center pt-10"
            >
              <Image
                source={require("../../assets/icons/logout.png")}
                className="w-[30px] h-[30px]"
              />
              <Text className="text-[#FF4343] text-[18px] ml-5">Sign out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-lg mb-2">You are not logged in</Text>
      <View className="w-4/5 space-y-4">
        <Button
          title="Sign Up"
          onPress={() => router.push("/(auth)/sign-up")}
        />
        <Button
          title="Sign In"
          onPress={() => router.push("/(auth)/sign-in")}
        />
      </View>
    </View>
  );
};

export default Profile;
