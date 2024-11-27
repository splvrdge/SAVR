import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import TermLink from "@/components/TermLink";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Header_Max_Height = 60;
const Header_Min_Height = 60;
const Scroll_Distance = Header_Max_Height - Header_Min_Height;

const BookmarkedSystemScreen = () => {
  const router = useRouter();
  const route = useRoute();
  const { title } = route.params;

  const DynamicHeader = ({ value, title }) => {
    const animatedHeaderHeight = value.interpolate({
      inputRange: [0, Scroll_Distance],
      outputRange: [Header_Max_Height, Header_Min_Height],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.header,
          {
            height: animatedHeaderHeight,
            backgroundColor: "#fff",
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image
              source={require("@/assets/icons/back.png")}
              style={{ width: 26, height: 26, tintColor: "#1B42CE" }}
            />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ flex: 1 }}></View>
        </View>
      </Animated.View>
    );
  };

  const decodedTitle = decodeURIComponent(title);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollOffsetY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchBookmarkedTerms();
    }, [decodedTitle])
  );

  const fetchBookmarkedTerms = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please check your network settings."
      );
      setLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Login Required",
          "You must be logged in to view bookmarks."
        );
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `https://localhost:3000/api/bookmark/${decodedTitle
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTerms(response.data.bookmarks);
      } else {
        console.error(
          "Failed to fetch bookmarked terms:",
          response.data.message
        );
      }
    } catch (error) {
      console.error("Error fetching bookmarked terms:", error);
      Alert.alert("Error", "Failed to fetch bookmarked terms.");
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (termId) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Login Required",
          "You must be logged in to bookmark terms."
        );
        return;
      }

      setBookmarkLoading(true);
      const url = `https://localhost:3000/api/bookmark/${decodedTitle
        .toLowerCase()
        .replace(/\s+/g, "-")}/remove`;

      await axios.post(
        url,
        { term_id: termId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTerms((prevTerms) => prevTerms.filter((term) => term.id !== termId));
    } catch (error) {
      Alert.alert("Error", "Failed to remove bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleVolumePress = () => {
    router.push({
      pathname: "/(systems)/[title]",
      params: { title: decodedTitle },
    });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookmarkedTerms();
    setRefreshing(false);
  }, [fetchBookmarkedTerms]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top"]}>
      <StatusBar style="dark" />
      <DynamicHeader value={scrollOffsetY} title={decodedTitle} />
      <ScrollView
        scrollEventThrottle={5}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
          { useNativeDriver: false }
        )}
        style={{ backgroundColor: "white" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={{ paddingHorizontal: 8, flex: 1 }}>
          {loading ? (
            <View style={{ flex: 1 }}>
              <ActivityIndicator size="large" color="#1B42CE" />
            </View>
          ) : terms.length > 0 ? (
            <View
              style={{ marginTop: 2, paddingBottom: 11, marginHorizontal: 20 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  textAlign: "left",
                  fontWeight: "bold",
                  color: "gray",
                  marginBottom: 10,
                }}
              >
                LIST OF TERMS
              </Text>
              {terms.map((term) => (
                <TermLink
                  key={term.id}
                  title={term.term}
                  onPress={() => {
                    router.push({
                      pathname: `/(term)/term`,
                      params: {
                        id: term.id,
                        system: decodedTitle.toLowerCase().replace(/\s+/g, "-"),
                      },
                    });
                  }}
                  isBookmarked={true}
                  onBookmarkToggle={() => toggleBookmark(term.id)}
                  bookmarkLoading={bookmarkLoading}
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                padding: 16,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={require("@/assets/icons/open-book.png")}
                style={{
                  marginTop: 200,
                  width: 100,
                  height: 100,
                  tintColor: "gray",
                }}
              />
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "gray",
                  marginTop: 8,
                }}
              >
                No bookmarks yet
              </Text>
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    color: "gray",
                    paddingHorizontal: 22,
                    paddingTop: 10,
                  }}
                >
                  Keep track of terms in {decodedTitle} you're interested in by
                  clicking the bookmark icon.
                </Text>
                <TouchableOpacity
                  onPress={handleVolumePress}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Go to {decodedTitle}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  title: {
    fontSize: 18,
    color: "#1B42CE",
    fontWeight: "bold",
    paddingLeft: 10,
  },
  button: {
    marginTop: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderColor: "#4B5563",
    borderWidth: 2,
  },
  buttonText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default BookmarkedSystemScreen;
