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
  Animated,
  Alert,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import "../global.css";

interface Slide {
  id: number;
  title: string;
  description: string;
  image: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const scaleFactor = screenWidth / 375; // Using iPhone standard width as base

const responsiveFontSize = (size: number): number => {
  const newSize = size * scaleFactor;
  return Math.round(newSize);
};

const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    Alert.alert('Error', 'Failed to save value');
  }
};

const getItem = async (key: string): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    Alert.alert('Error', 'Failed to retrieve value');
    return null;
  }
};

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const slides: Slide[] = [
    {
      id: 1,
      title: "Track Your Expenses",
      description:
        "Gain insights into your spending habits and manage your finances with ease. Track every penny and stay in control.",
      image: require("../assets/images/onboarding/1.png"),
    },
    {
      id: 2,
      title: "Set Financial Goals",
      description:
        "Plan for the future by setting and achieving financial goals. Save smarter, spend wiser, and reach your targets.",
      image: require("../assets/images/onboarding/2.png"),
    },
    {
      id: 3,
      title: "Secure and Reliable",
      description:
        "Your financial data is safe with us. Our app ensures top-notch security while providing reliable tracking and reporting.",
      image: require("../assets/images/onboarding/3.png"),
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasOnboarded = await getItem("hasOnboarded");
      const token = await getItem("token");
      
      if (token) {
        // If user is already logged in, go to home
        router.replace("/(tabs)/home");
      } else if (hasOnboarded) {
        // If onboarded but not logged in, go to sign in
        router.replace("/(auth)/sign-in");
      } else {
        // First time user, show onboarding
        setIsLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check onboarding status');
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
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      try {
        await setItem("hasOnboarded", "true");
      } catch (error) {
        Alert.alert('Error', 'Failed to save onboarding status');
      }
      router.push("/sign-up");
    }
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <Animated.View style={[styles.item, { opacity: fadeAnim }]}>
      <Image style={styles.image} source={item.image} resizeMode="contain" />
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.9)', '#ffffff']}
        style={styles.gradientOverlay}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require("../assets/icons/no-internet.png")}
          style={styles.offlineIcon}
        />
        <Text style={styles.offlineTitle}>No Internet Connection</Text>
        <Text style={styles.offlineDescription}>
          Please check your connection and try again
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          onScroll={(event) => {
            const slideIndex = Math.round(
              event.nativeEvent.contentOffset.x / screenWidth
            );
            setCurrentIndex(slideIndex);
          }}
          renderItem={renderItem}
        />
        
        <View style={styles.footer}>
          <View style={styles.indicatorContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === currentIndex ? "#2E8B57" : "#E0E0E0",
                    width: index === currentIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? "Get Started" : "Continue"}
            </Text>
          </TouchableOpacity>

          {currentIndex < slides.length - 1 && (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await setItem("hasOnboarded", "true");
                } catch (error) {
                  Alert.alert('Error', 'Failed to save onboarding status');
                }
                router.push("/sign-up");
              }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  offlineIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  offlineTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  offlineDescription: {
    fontSize: responsiveFontSize(16),
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  item: {
    width: screenWidth,
    height: screenHeight * 0.8,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    marginBottom: 30,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.3,
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  titleContainer: {
    paddingHorizontal: 40,
    alignItems: "center",
  },
  title: {
    fontSize: responsiveFontSize(24),
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: responsiveFontSize(16),
    color: "#666666",
    textAlign: "center",
    lineHeight: responsiveFontSize(24),
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: "all 0.3s ease",
  },
  button: {
    backgroundColor: "#2E8B57",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2E8B57",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: responsiveFontSize(18),
    fontWeight: "600",
  },
  skipText: {
    color: "#666666",
    fontSize: responsiveFontSize(16),
    textAlign: "center",
    paddingVertical: 8,
  },
});