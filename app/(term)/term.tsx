import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  PixelRatio,
  RefreshControl,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

import TermBullets from "@/components/TermBullets";
import BriefDefinition from "@/components/BriefDefinition";
import RelevantTerms from "@/components/RelevantTerms";
import Roots from "@/components/Roots";
import TermMorphology from "@/components/TermMorphology";
import CompoundList from "@/components/CompoundList";

const Header_Max_Height = 90;
const Header_Min_Height = 90;
const Scroll_Distance = Header_Max_Height - Header_Min_Height;

const TermScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, system } = route.params;

  const [termDetails, setTermDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const scrollOffsetY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTermDetails();
    fetchBookmarkStatus();
  }, [id, system]);

  const fetchTermDetails = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please check your network settings."
      );
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `https://savr-backend.onrender.com/api/volume/${system}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const termData = await response.json();
      setTermDetails(termData);
    } catch (error) {
      console.error("Error fetching term details:", error);
      Alert.alert(
        "Term Fetch Failed",
        error.message || "An unexpected error occurred. Please try again later."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBookmarkStatus = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please check your network settings."
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch(
        `https://savr-backend.onrender.com/api/bookmark/${system}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setIsBookmarked(data.isBookmarked);
      } else {
        Alert.alert("Error", "Failed to fetch bookmark status");
      }
    } catch (error) {
      console.error("Error fetching bookmark status:", error);
      Alert.alert("Error", "Failed to fetch bookmark status");
    }
  };

  const toggleBookmark = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Login Required", "You must be logged in to bookmark terms.");
      return;
    }

    // Optimistically update the UI before the API call
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);

    try {
      const url = newBookmarkState
        ? `https://savr-backend.onrender.com/api/bookmark/${system}/add`
        : `https://savr-backend.onrender.com/api/bookmark/${system}/remove`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ term_id: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bookmark status.");
      }

      // Optionally cache the new state in AsyncStorage for quick access
      const bookmarksCacheKey = `bookmarks_${system}`;
      const cachedBookmarks = await AsyncStorage.getItem(bookmarksCacheKey);
      const updatedBookmarks = cachedBookmarks
        ? JSON.parse(cachedBookmarks)
        : {};

      if (newBookmarkState) {
        updatedBookmarks[id] = true;
      } else {
        delete updatedBookmarks[id];
      }

      await AsyncStorage.setItem(
        bookmarksCacheKey,
        JSON.stringify(updatedBookmarks)
      );
    } catch (error) {
      // Revert the optimistic update if the request fails
      setIsBookmarked(!newBookmarkState);
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to toggle bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
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

    fetchTermDetails();
    fetchBookmarkStatus();
  }, [id, system]);

  const screenWidth = Dimensions.get("window").width;
  const scaleFactor = screenWidth / 320;

  const responsiveFontSize = (size) => {
    const newSize = size * scaleFactor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      /Support for defaultProps will be removed from memo components/.test(
        args[0]
      ) ||
      /Support for defaultProps will be removed from function components/.test(
        args[0]
      )
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  const DynamicHeader = ({ value }) => {
    const [headerWidth, setHeaderWidth] = useState(0);
    const [textWidth, setTextWidth] = useState(0);
    const [availableWidth, setAvailableWidth] = useState(0);

    const animatedHeaderHeight = value.interpolate({
      inputRange: [0, Scroll_Distance],
      outputRange: [Header_Max_Height, Header_Min_Height],
      extrapolate: "clamp",
    });

    const animatedHeaderColor = value.interpolate({
      inputRange: [0, Scroll_Distance],
      outputRange: ["#1B42CE", "#1B42CE"],
      extrapolate: "clamp",
    });

    const handleHeaderLayout = (event) => {
      const { width } = event.nativeEvent.layout;
      setHeaderWidth(width);
    };

    const handleTextLayout = (event) => {
      const { width } = event.nativeEvent.layout;
      setTextWidth(width);
    };

    useEffect(() => {
      if (headerWidth) {
        setAvailableWidth(headerWidth - 40);
      }
    }, [headerWidth]);

    return (
      <Animated.View
        style={[
          styles.header,
          {
            height: animatedHeaderHeight,
            backgroundColor: animatedHeaderColor,
          },
        ]}
        onLayout={handleHeaderLayout}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require("../../assets/icons/back.png")}
              style={{ width: 26, height: 26, tintColor: "white" }}
            />
          </TouchableOpacity>
          <View style={{ paddingLeft: 5, flex: 1 }}>
            <Text
              style={{
                color: "white",
                fontSize: responsiveFontSize(8),
              }}
            >
              {system
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </Text>
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: responsiveFontSize(10),
                maxWidth: availableWidth,
              }}
              numberOfLines={1}
              onLayout={handleTextLayout}
              ellipsizeMode="tail"
            >
              {termDetails?.term}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", paddingRight: 23 }}>
            <TouchableOpacity
              onPress={toggleBookmark}
              disabled={bookmarkLoading}
            >
              <Image
                source={
                  isBookmarked
                    ? require("../../assets/icons/ribbon-filled.png")
                    : require("../../assets/icons/ribbon.png")
                }
                style={{ width: 30, height: 30, tintColor: "white" }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  const hasTermDetails =
    termDetails?.opposite_term ||
    termDetails?.actual_term ||
    termDetails?.focus;

  return (
    <SafeAreaView className="flex-1 bg-customGreen" edges={["top"]}>
      <DynamicHeader value={scrollOffsetY} />
      <StatusBar style="light" />
      <ScrollView
        scrollEventThrottle={5}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
          {
            useNativeDriver: false,
          }
        )}
        className="h-full bg-white pb-11"
        style={{ paddingHorizontal: responsiveFontSize(20) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="pb-[80px]">
          <View>
            {hasTermDetails && <TermBullets termDetails={termDetails} />}
          </View>
          <View className="mb-10">
            {termDetails?.relevant_term && (
              <RelevantTerms
                title="RELEVANT WORDS IN TERM"
                htmlContent={termDetails.relevant_term}
              />
            )}
          </View>
          <View className="mb-10">
            {termDetails?.brief_definition && (
              <BriefDefinition
                title="BRIEF DEFINITION"
                htmlContent={termDetails.brief_definition}
              />
            )}
          </View>
          <View className="mb-10">
            {termDetails?.root && (
              <Roots title="ROOTS" htmlContent={termDetails.root} />
            )}
          </View>
          <View className="mb-10">
            {termDetails?.term_morphology && (
              <TermMorphology
                title="TERM MORPHOLOGY"
                htmlContent={termDetails.term_morphology}
              />
            )}
            {termDetails?.compound_list && (
              <CompoundList htmlContent={termDetails.compound_list} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    justifyContent: "center",
    paddingLeft: 18,
    paddingBottom: 7,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default TermScreen;
