import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import NetInfo from "@react-native-community/netinfo";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
      const token = await AsyncStorage.getItem("accessToken");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              "accessToken",
              "userId",
              "userName",
            ]);
            setUser(null);
            router.replace("/(auth)/sign-in");
          } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("/edit-profile");
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

  const SettingsItem = ({ icon, title, subtitle = "", onPress, color = "#3B82F6" }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}10` }]}>
        {icon}
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.settingsSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={color} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.notLoggedInContainer}>
        <MaterialCommunityIcons name="account-off" size={64} color="#666" />
        <Text style={styles.notLoggedInTitle}>Not Logged In</Text>
        <Text style={styles.notLoggedInSubtitle}>
          Please sign in to access your profile
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
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
                  {user.name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.nameText}>{user.name}</Text>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>Active Member</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <SettingsItem
            icon={<MaterialCommunityIcons name="account-edit" size={24} color="#3B82F6" />}
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={handleEditProfile}
          />
          
          <SettingsItem
            icon={<MaterialCommunityIcons name="shield-lock" size={24} color="#3B82F6" />}
            title="Security"
            subtitle="Manage your account security"
            onPress={() => {}}
          />
          
          <SettingsItem
            icon={<MaterialCommunityIcons name="bell-outline" size={24} color="#3B82F6" />}
            title="Notifications"
            subtitle="Customize your notification settings"
            onPress={() => {}}
          />
          
          <SettingsItem
            icon={<MaterialCommunityIcons name="help-circle" size={24} color="#3B82F6" />}
            title="Help & Support"
            subtitle="Get help with your account"
            onPress={() => {}}
          />
          
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <View style={styles.logoutIconContainer}>
              <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
            </View>
            <View style={styles.logoutContent}>
              <Text style={styles.logoutTitle}>Logout</Text>
              <Text style={styles.logoutSubtitle}>Sign out of your account</Text>
            </View>
          </TouchableOpacity>
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
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 24,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: "#1F2937",
  },
  notLoggedInSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
    textAlign: "center",
  },
  signInButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsContent: {
    flex: 1,
    marginLeft: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  settingsSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
  },
  logoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutContent: {
    flex: 1,
    marginLeft: 16,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  logoutSubtitle: {
    fontSize: 14,
    color: "#F87171",
    marginTop: 2,
  },
});

export default Profile;
