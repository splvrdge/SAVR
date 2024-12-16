import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import axiosInstance from "@/utils/axiosConfig";
import { API_ENDPOINTS } from "@/constants/API";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";

const EditProfile = () => {
  const router = useRouter();
  const [user, setUser] = useState({ name: "", email: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("accessToken");
        if (storedToken) {
          setToken(storedToken);
        }

        const userName = await AsyncStorage.getItem("userName");
        const userEmail = await AsyncStorage.getItem("userEmail");
        if (userName && userEmail) {
          setUser({ name: userName, email: userEmail });
          setName(userName);
          setEmail(userEmail);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Email cannot be empty");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Check if any changes were made
    if (name.trim() === user.name && email.trim() === user.email) {
      Alert.alert("No Changes", "No changes were made to your profile");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.USER.UPDATE_PROFILE, {
        name: name.trim(),
        email: email.trim()
      });

      if (response.data.success) {
        // Update local storage with new values
        await AsyncStorage.setItem("userName", response.data.data.name);
        await AsyncStorage.setItem("userEmail", response.data.data.email);
        
        // If email was changed, require re-authentication
        if (email.trim() !== user.email) {
          await AsyncStorage.multiRemove([
            "accessToken",
            "refreshToken",
            "userName",
            "userEmail",
            "userId"
          ]);

          Alert.alert(
            "Email Updated",
            "Your email has been updated. Please sign in again with your new email.",
            [
              {
                text: "OK",
                onPress: () => {
                  router.replace("/(auth)/sign-in");
                },
              },
            ]
          );
        } else {
          Alert.alert("Success", "Profile updated successfully", [
            {
              text: "OK",
              onPress: () => {
                // Update local state before going back
                setUser({
                  name: response.data.data.name,
                  email: response.data.data.email
                });
                router.back();
              },
            },
          ]);
        }
      }
    } catch (error: any) {
      let errorMessage = "An error occurred while updating your profile";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete =
    name !== "" && email !== "" && (name !== user.name || email !== user.email);

  if (!user.name && !user.email) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#3B82F6", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.nameText}>{name || "Your Name"}</Text>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>Edit Profile</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <FormField
              value={name}
              handleChangeText={setName}
              placeholder="Enter your full name"
              otherStyles={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <FormField
              value={email}
              handleChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              otherStyles={styles.input}
            />
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Save Changes"
              handlePress={handleUpdateProfile}
              containerStyles={[
                styles.saveButton,
                !isFormComplete && styles.saveButtonDisabled
              ]}
              isLoading={isLoading}
              disabled={!isFormComplete || isLoading}
            />

            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  nameContainer: {
    marginLeft: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  badgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  badgeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
  },
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default EditProfile;
