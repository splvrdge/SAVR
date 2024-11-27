import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Button,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import SystemLink from "@/components/SystemLink";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [volumes, setVolumes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        Alert.alert(
          "No Internet Connection",
          "Please check your network settings."
        );
        setIsLoading(false);
        return;
      }

      try {
        const token = await getToken();

        const response = await fetch(
          "https://rtm-aiven-backend.onrender.com/api/volume/volumes",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();

        if (responseData.success) {
          setVolumes(responseData.volumes);
        } else {
          throw new Error(responseData.message || "Unable to fetch volumes.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert(
          "Data Fetch Failed",
          error.message ||
            "An unexpected error occurred. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return token;
    } catch (error) {
      console.error("Error retrieving token from AsyncStorage:", error);
      return null;
    }
  };

  const handleResetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem("hasOnboarded");
      router.push("/");
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  };

  const handleVolumePress = (title) => {
    router.push({ pathname: "/(systems)/[title]", params: { title } });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please check your network settings."
      );
      setRefreshing(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(
        "https://rtm-aiven-backend.onrender.com/api/volume/volumes",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success) {
        setVolumes(responseData.volumes);
      } else {
        throw new Error(responseData.message || "Unable to fetch volumes.");
      }
    } catch (error) {
      console.error("Error fetching data during refresh:", error);
      Alert.alert(
        "Data Fetch Failed",
        error.message || "An unexpected error occurred. Please try again later."
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  const screenWidth = Dimensions.get("window").width;
  const scaleFactor = screenWidth / 320;

  const responsiveFontSize = (size) => {
    const newSize = size * scaleFactor;
    return Math.round(newSize);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        className="h-full bg-white"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View>
          <View className="px-8 pt-10 flex-row justify-between">
            <View className="flex-row">
              <Image
                source={require("../../assets/icons/R-outline.png")}
                style={{
                  width: 40,
                  height: 40,
                  tintColor: "#1B42CE",
                }}
              />
              <Text className="text-2xl font-bold text-customBlue mt-0.5 ml-2">
                Home
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <Image
                source={require("../../assets/images/profile-user.png")}
                style={{ width: 35, height: 35, tintColor: "#1B42CE" }}
              />
            </TouchableOpacity>
          </View>
          <View className="w-full px-8 justify-center">
            <Text className="text-[13px] text-left pt-7 font-semibold text-gray-500 mb-2">
              CHAPTERS
            </Text>
            {volumes.map((volume, index) => (
              <SystemLink
                key={index}
                title={volume.title}
                status={volume.status}
                onPress={() => handleVolumePress(volume.title)}
              />
            ))}
            {/* <View className="pt-10">
              <Button
                title="Reset Onboarding"
                onPress={handleResetOnboarding}
              />
            </View> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Home;
