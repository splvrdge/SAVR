import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import TermLink from "@/components/TermLink";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useDebounce from "@/hooks/useDebounce";
import NetInfo from "@react-native-community/netinfo";

const Header_Max_Height = 60;
const Header_Min_Height = 60;
const Scroll_Distance = Header_Max_Height - Header_Min_Height;

const DynamicHeader = ({ value, title, onSearchPress }) => {
  const router = useRouter();
  const animatedHeaderHeight = value.interpolate({
    inputRange: [0, Scroll_Distance],
    outputRange: [Header_Max_Height, Header_Min_Height],
    extrapolate: "clamp",
  });

  const animatedHeaderColor = value.interpolate({
    inputRange: [0, Scroll_Distance],
    outputRange: ["#fff", "#fff"],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          height: animatedHeaderHeight,
          backgroundColor: animatedHeaderColor,
        },
      ]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Image
            source={require("../../assets/icons/back.png")}
            style={{ width: 26, height: 26, tintColor: "#2E8B57" }}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ flex: 1, alignItems: "flex-end", marginRight: 20 }}>
          <TouchableOpacity onPress={onSearchPress}>
            <Image
              source={require("../../assets/icons/search.png")}
              style={{
                width: 35,
                height: 35,
                tintColor: "#2E8B57",
              }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const SystemScreen = () => {
  const router = useRouter();
  const route = useRoute();
  const { title } = route.params;

  const decodedTitle = decodeURIComponent(title);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedTerms, setBookmarkedTerms] = useState({});
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filteredTerms, setFilteredTerms] = useState(terms);
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearchTerm = useDebounce(searchInput, 500);

  useFocusEffect(
    useCallback(() => {
      fetchTerms();
      fetchBookmarkedTerms();
    }, [decodedTitle])
  );

  useEffect(() => {
    if (debouncedSearchTerm) {
      setFilteredTerms(
        terms.filter((term) =>
          term.term.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredTerms(terms);
    }
  }, [debouncedSearchTerm, terms]);

  const fetchTerms = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "No Internet Connection",
        "Please check your network settings."
      );
      setLoading(false);
      return;
    }

    let url = "";

    switch (decodedTitle) {
      case "Sample Terms":
        url = "https://savr-backend.onrender.com/api/volume/sample-terms";
        break;
      case "Skeletal System":
        url = "https://savr-backend.onrender.com/api/volume/skeletal-terms";
        break;
      case "Cardiovascular System":
        url =
          "https://savr-backend.onrender.com/api/volume/cardiovascular-terms";
        break;
      case "Integumentary System":
        url =
          "https://savr-backend.onrender.com/api/volume/integumentary-terms";
        break;
      case "Nervous System":
        url = "https://savr-backend.onrender.com/api/volume/nervous-terms";
        break;
      case "Reproductive System":
        url = "https://savr-backend.onrender.com/api/volume/reproductive-terms";
        break;
      case "Respiratory System":
        url = "https://savr-backend.onrender.com/api/volume/respiratory-terms";
        break;
      case "Urinary System":
        url = "https://savr-backend.onrender.com/api/volume/urinary-terms";
        break;
      case "Digestive System":
        url = "https://savr-backend.onrender.com/api/volume/digestive-terms";
        break;
      case "Immune System":
        url = "https://savr-backend.onrender.com/api/volume/immune-terms";
        break;
      case "Joint and Directional Terms":
        url =
          "https://savr-backend.onrender.com/api/volume/joint-and-directional-terms";
        break;
      case "Latin Muscle Names in English":
        url =
          "https://savr-backend.onrender.com/api/volume/latin-muscle-names-in-english";
        break;
      case "Muscular System Physiology":
        url =
          "https://savr-backend.onrender.com/api/volume/muscular-system-physiology";
        break;
      case "Plane and Directional Terms":
        url =
          "https://savr-backend.onrender.com/api/volume/plane-and-directional-terms";
        break;
      default:
        console.error("Unknown title:", decodedTitle);
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const json = await response.json();
      setTerms(json.terms);
    } catch (error) {
      console.error("Error fetching terms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkedTerms = async () => {
    try {
      const cachedBookmarks = await AsyncStorage.getItem(
        `bookmarks_${decodedTitle.toLowerCase().replace(/\s+/g, "-")}`
      );

      // If cached bookmarks exist, load them immediately
      if (cachedBookmarks) {
        setBookmarkedTerms(JSON.parse(cachedBookmarks));
        return;
      }

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        console.error("No token found.");
        return;
      }

      const response = await axios.get(
        `https://savr-backend.onrender.com/api/bookmark/${decodedTitle
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const bookmarks = response.data.bookmarks.reduce((acc, term) => {
          acc[term.id] = true;
          return acc;
        }, {});

        // Cache bookmarks to AsyncStorage
        await AsyncStorage.setItem(
          `bookmarks_${decodedTitle.toLowerCase().replace(/\s+/g, "-")}`,
          JSON.stringify(bookmarks)
        );

        setBookmarkedTerms(bookmarks);
      } else {
        console.error("Failed to fetch bookmarks:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching bookmarked terms:", error);
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

      // Optimistically update the UI
      setBookmarkedTerms((prev) => ({
        ...prev,
        [termId]: !prev[termId],
      }));

      const isBookmarked = bookmarkedTerms[termId];
      const url = isBookmarked
        ? `https://savr-backend.onrender.com/api/bookmark/${decodedTitle
            .toLowerCase()
            .replace(/\s+/g, "-")}/remove`
        : `https://savr-backend.onrender.com/api/bookmark/${decodedTitle
            .toLowerCase()
            .replace(/\s+/g, "-")}/add`;

      await axios.post(
        url,
        { term_id: termId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      // Revert the optimistic update if the API call fails
      setBookmarkedTerms((prev) => ({
        ...prev,
        [termId]: !prev[termId],
      }));
      Alert.alert("Error", "Failed to toggle bookmark");
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTerms();
    setRefreshing(false);
  }, [fetchTerms]);

  const scrollOffsetY = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
      edges={["top"]}
    >
      <StatusBar style="dark" />
      <DynamicHeader
        value={scrollOffsetY}
        title={decodedTitle}
        onSearchPress={() => setSearchVisible((prev) => !prev)}
      />
      <View style={{ paddingHorizontal: 20 }}>
        {searchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search terms..."
              placeholderTextColor="#B0B0B0"
              value={searchInput}
              onChangeText={setSearchInput}
            />
          </View>
        )}
      </View>
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
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={{ flex: 1 }}>
              <ActivityIndicator size="large" color="#2E8B57" />
            </View>
          ) : filteredTerms.length > 0 ? (
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
              {filteredTerms.map((term) => (
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
                  isBookmarked={!!bookmarkedTerms[term.id]}
                  onBookmarkToggle={() => toggleBookmark(term.id)}
                  bookmarkLoading={bookmarkLoading}
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontStyle: "italic", color: "gray" }}
              >
                No data available for {decodedTitle}.
              </Text>
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
    fontSize: 17,
    color: "#2E8B57",
    fontWeight: "bold",
    paddingLeft: 10,
  },
  searchContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2E8B57",
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default SystemScreen;
