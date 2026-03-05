/* ============================================
   EGG CATCHER – Settings Screen
   Profile, Sound, Avatar, and Account settings
   ============================================ */

import { GameAudio } from "@/utils/audio";
import { AVATAR_OPTIONS, FirebaseService } from "@/utils/firebase";
import { GuestUser, Storage } from "@/utils/storage";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");

// Google OAuth client IDs (same as index.tsx)
const GOOGLE_WEB_CLIENT_ID =
  "39268486080-ls310i27urtqm5hcnoukjssgur100v82.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID =
  "39268486080-q10eqe5f94fks6t7kctq8r9ppl5npfs4.apps.googleusercontent.com";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<GuestUser | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🧑‍🌾");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Google Sign-In setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    selectAccount: true,
  });

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(response.authentication?.idToken);
    }
  }, [response]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const savedUser = await Storage.getGuest();
      if (savedUser) {
        setUser(savedUser);
        setName(savedUser.name);
        setAvatar(savedUser.avatar || "🧑‍🌾");
      }
      // Check if sound is muted
      setSoundEnabled(!GameAudio.isMuted());
    } catch (error) {
      console.error("Load user data error:", error);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async (idToken: string | undefined) => {
    if (!idToken) {
      Alert.alert("Error", "Failed to get authentication token");
      return;
    }

    setIsLoading(true);
    try {
      const profile = await FirebaseService.signInWithGoogle(idToken);
      if (profile) {
        const newUser: GuestUser = {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          highScore: profile.highScore,
          isGuest: false,
        };
        await Storage.saveGuest(newUser);
        setUser(newUser);
        setName(profile.name);
        setAvatar(profile.avatar);
        Alert.alert("Success", "Signed in successfully!");
      } else {
        Alert.alert("Error", "Failed to sign in with Google");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      Alert.alert("Error", "Sign-in failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      if (user) {
        const updatedUser = { ...user, name: name.trim() };
        await Storage.saveGuest(updatedUser);
        setUser(updatedUser);

        // If logged in with Google, update Firebase
        if (user.id && !user.isGuest) {
          await FirebaseService.updatePlayerName(user.id, name.trim());
        }

        Alert.alert("Success", "Name updated!");
      }
    } catch (error) {
      console.error("Save name error:", error);
      Alert.alert("Error", "Failed to save name");
    }
    setIsSaving(false);
  };

  const handleSelectAvatar = async (selectedAvatar: string) => {
    GameAudio.playClick();
    setAvatar(selectedAvatar);

    if (user) {
      const updatedUser = { ...user, avatar: selectedAvatar };
      await Storage.saveGuest(updatedUser);
      setUser(updatedUser);

      // If logged in with Google, update Firebase
      if (user.id && !user.isGuest) {
        await FirebaseService.updatePlayerAvatar(user.id, selectedAvatar);
      }
    }
  };

  const handleSoundToggle = (value: boolean) => {
    GameAudio.setMuted(!value);
    setSoundEnabled(value);
    if (value) {
      GameAudio.playClick();
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await FirebaseService.signOut();
            await Storage.clearGuest();
            setUser(null);
            setName("");
            setAvatar("🧑‍🌾");
            router.replace("/");
          } catch (error) {
            console.error("Logout error:", error);
          }
          setIsLoading(false);
        },
      },
    ]);
  };

  const handleBack = () => {
    GameAudio.playClick();
    router.back();
  };

  if (isLoading && !user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile</Text>

          {/* Avatar Display */}
          <View style={styles.avatarDisplay}>
            <Text style={styles.currentAvatar}>{avatar}</Text>
            {user && (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userType}>
                  {user.isGuest ? "Guest Player" : "Google Account"}
                </Text>
              </View>
            )}
          </View>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                maxLength={20}
              />
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSaveName}
                disabled={isSaving}
              >
                <Text style={styles.saveBtnText}>
                  {isSaving ? "..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎭 Choose Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((avatarOption, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.avatarOption,
                  avatar === avatarOption && styles.avatarOptionSelected,
                ]}
                onPress={() => handleSelectAvatar(avatarOption)}
              >
                <Text style={styles.avatarEmoji}>{avatarOption}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sound Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Sound</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingDesc}>
                Haptic feedback and sound effects
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: "#DDD", true: "#A5D6A7" }}
              thumbColor={soundEnabled ? "#4CAF50" : "#999"}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Account</Text>

          {user?.isGuest ? (
            <View style={styles.accountInfo}>
              <Text style={styles.accountText}>
                You are playing as a guest. Sign in with Google to save your
                progress across devices.
              </Text>
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() => promptAsync()}
                disabled={!request || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleBtnText}>
                      Sign in with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.accountInfo}>
              <Text style={styles.accountText}>
                Signed in with Google. Your progress is synced to the cloud.
              </Text>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                disabled={isLoading}
              >
                <Text style={styles.logoutBtnText}>🚪 Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Game Stats */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user.highScore}</Text>
                <Text style={styles.statLabel}>High Score</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: {
    width: 70,
  },
  backBtnText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  avatarDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
  },
  currentAvatar: {
    fontSize: 50,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  userType: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  inputGroup: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#CCC",
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  avatarOption: {
    width: (SCREEN_W - 80) / 5,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarOptionSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  settingDesc: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  accountInfo: {
    alignItems: "center",
  },
  accountText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFF",
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  logoutBtn: {
    backgroundColor: "#FF5722",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  statBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    minWidth: 120,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4CAF50",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
});
