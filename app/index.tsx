import React, { useRef, useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const screenWidth = Dimensions.get("window").width;
const scaleFactor = screenWidth / 320;

const responsiveFontSize = (size) => {
  const newSize = size * scaleFactor;
  return Math.round(newSize);
};

const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.log("Error storing value: ", error);
  }
};

const getItem = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    console.log("Error retrieving value: ", error);
    return null;
  }
};

const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log("Error deleting value: ", error);
  }
};

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const flatListRef = useRef(null);
  const router = useRouter();

  const slides = [
    {
      id: 1,
      title: "Roots and Morphology",
      description:
        "Explore the linguistic foundation of Anatomy and Physiology through an in-depth look at Roots and Morphology.",
      image: require("../assets/icons/R-outline.png"),
    },
    {
      id: 2,
      title: "Linguistic Foundation",
      description:
        "Rediscover the linguistic foundation of Anatomy terms metaphorically, figuratively, simile, poetically, and literally.",
      image: require("../assets/images/onboarding/2.png"),
    },
    {
      id: 3,
      title: "About The Author",
      description:
        "Lee Oliva was educated in the classics in a Catholic Seminary by the Vincentian Missionaries. A Doctor of Chiropractic, He graduated from Palmer College of Chiropractic - West., San Jose, California. Received his Bachelor's degree in Business Administration, California State University, Los Angeles. This app is owned and maintained by Lee Oliva and Maria Siervo.",
      image: require("../assets/images/onboarding/3.png"),
    },
  ];

  const checkOnboardingStatus = async () => {
    const hasOnboarded = await getItem("hasOnboarded");
    if (hasOnboarded) {
      router.push("/home");
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        checkOnboardingStatus();
      }
    });

    checkOnboardingStatus();

    return () => unsubscribe();
  }, []);

  const handleContinue = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await setItem("hasOnboarded", "true");
      router.push("/home");
    }
  };

  const getContinueButtonText = () => {
    return currentIndex === slides.length - 1
      ? "Explore Dashboard"
      : "Continue";
  };

  const showSkipButton = currentIndex < 2;

  const renderIndicator = ({ index }) => {
    return (
      <View
        style={[
          styles.indicator,
          { backgroundColor: index === currentIndex ? "#2E8B57" : "#C4C4C4" },
        ]}
        key={index}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.loadingContainer}>
        <Text className="text-xl font-bold text-gray-700">
          No Internet Connection
        </Text>
        <Text className="text-[18px] text-gray-500 mt-1">
          Please connect to the internet to continue.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.top}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          onScroll={(event) => {
            const slideIndex = Math.round(
              event.nativeEvent.contentOffset.x / Dimensions.get("window").width
            );
            setCurrentIndex(slideIndex);
          }}
          renderItem={({ item }) => {
            return (
              <View className="items-center pt-3">
                <Image style={styles.logo} source={item.logo} />
                <View style={styles.item}>
                  <View className="pt-8">
                    <Image style={styles.image} source={item.image} />
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => renderIndicator({ index }))}
        </View>
      </View>
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{getContinueButtonText()}</Text>
        </TouchableOpacity>
        {showSkipButton && (
          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={async () => {
              await setItem("hasOnboarded", "true");
              router.push("/home");
            }}
          >
            <Text
              style={[styles.buttonText, { color: "#666", fontWeight: "500" }]}
            >
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  top: {
    flex: responsiveFontSize(0.9),
    backgroundColor: "white",
  },
  bottom: {
    flex: 0.2,
    marginBottom: responsiveFontSize(13),
    alignItems: "center",
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#2E8B57",
    padding: 18,
    marginVertical: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    width: "70%",
  },
  buttonOutline: {
    borderColor: "#fff",
    padding: 10,
    marginVertical: 5,
    justifyContent: "center",
    alignItems: "center",
    width: "70%",
  },
  buttonText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 15,
  },
  item: {
    width: Dimensions.get("window").width,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: responsiveFontSize(230),
    height: responsiveFontSize(230),
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: responsiveFontSize(5),
    paddingBottom: responsiveFontSize(30),
  },
  title: {
    fontSize: responsiveFontSize(23),
    fontWeight: "bold",
    color: "#2E8B57",
    textAlign: "center",
  },
  description: {
    fontSize: responsiveFontSize(11),
    textAlign: "center",
    color: "#666",
    paddingHorizontal: responsiveFontSize(35),
    marginTop: responsiveFontSize(7),
  },
  indicatorContainer: {
    flexDirection: "row",
    right: 0,
    left: 0,
    bottom: 20,
    justifyContent: "center",
    marginTop: responsiveFontSize(20),
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 50,
    marginHorizontal: 5,
    borderColor: "#fff",
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    height: responsiveFontSize(50),
    width: responsiveFontSize(50),
  },
});
