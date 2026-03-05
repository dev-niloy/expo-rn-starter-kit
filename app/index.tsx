/* ============================================
   EGG CATCHER – Menu Screen
   ============================================ */

import { GameAudio } from "@/utils/audio";
import { GuestUser, Storage } from "@/utils/storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { initializeApp } from "firebase/app";

export const GOOGLE_WEB_CLIENT_ID =
  "39268486080-ls310i27urtqm5hcnoukjssgur100v82.apps.googleusercontent.com";
export const GOOGLE_ANDROID_CLIENT_ID =
  "39268486080-q10eqe5f94fks6t7kctq8r9ppl5npfs4.apps.googleusercontent.com";

const firebaseConfig = {
  apiKey: "AIzaSyCYXrl2EbzVyxp2hV7c-mEnhK5ja19euwU",
  authDomain: "eggcatcher-31828.firebaseapp.com",
  projectId: "eggcatcher-31828",
  storageBucket: "eggcatcher-31828.firebasestorage.app",
  messagingSenderId: "835418629907",
  appId: "1:835418629907:android:30939b48089bdb6a625ce6",
};

const app = initializeApp(firebaseConfig);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Floating egg animation data
const FLOATING_EGGS = [
  { emoji: "🥚", startX: SCREEN_W * 0.1, delay: 0, duration: 4000 },
  { emoji: "🥚", startX: SCREEN_W * 0.3, delay: 800, duration: 3500 },
  { emoji: "🥇", startX: SCREEN_W * 0.5, delay: 1600, duration: 4500 },
  { emoji: "🥚", startX: SCREEN_W * 0.7, delay: 400, duration: 3800 },
  { emoji: "🥚", startX: SCREEN_W * 0.9, delay: 1200, duration: 4200 },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<GuestUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Chicken bounce animations
  const chicken1Anim = useRef(new Animated.Value(0)).current;
  const chicken2Anim = useRef(new Animated.Value(0)).current;
  const chicken3Anim = useRef(new Animated.Value(0)).current;

  // Title scale animation
  const titleScale = useRef(new Animated.Value(0.8)).current;

  // Floating egg animations
  const eggAnims = useRef(
    FLOATING_EGGS.map(() => new Animated.Value(-60)),
  ).current;

  useEffect(() => {
    // Load saved user
    Storage.getGuest().then((savedUser) => {
      if (savedUser) setUser(savedUser);
    });

    // Title animation
    Animated.spring(titleScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Chicken bounce animations
    const bounceChicken = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -12,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    bounceChicken(chicken1Anim, 0);
    bounceChicken(chicken2Anim, 200);
    bounceChicken(chicken3Anim, 400);

    // Falling egg animations
    eggAnims.forEach((anim, i) => {
      const startLoop = () => {
        anim.setValue(-60);
        Animated.timing(anim, {
          toValue: SCREEN_H + 60,
          duration: FLOATING_EGGS[i].duration,
          delay: FLOATING_EGGS[i].delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => startLoop());
      };
      startLoop();
    });
  }, []);

  const handlePlayAsGuest = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    GameAudio.playClick();

    const guestNames = ["Farmer", "Player", "Chick", "Hatcher", "Eggy"];
    const name =
      guestNames[Math.floor(Math.random() * guestNames.length)] +
      "_" +
      Math.floor(Math.random() * 999);

    const guestUser: GuestUser = {
      id: null,
      name,
      avatar: null,
      highScore: (await Storage.getHighScore()) || 0,
      isGuest: true,
    };

    await Storage.saveGuest(guestUser);
    setUser(guestUser);
    setIsLoggingIn(false);
  };

  const handleStartGame = () => {
    GameAudio.playClick();
    if (!user) {
      handlePlayAsGuest().then(() => {
        router.push("/game");
      });
    } else {
      router.push("/game");
    }
  };

  const handleLeaderboard = () => {
    GameAudio.playClick();
    router.push("/leaderboard");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Sky Background */}
      <View style={styles.skyBg} />

      {/* Sun */}
      <Text style={[styles.sun, { top: insets.top + 20 }]}>☀️</Text>

      {/* Clouds */}
      <Text style={[styles.cloud, { top: insets.top + 40, left: 20 }]}>☁️</Text>
      <Text style={[styles.cloud, { top: insets.top + 80, right: 30 }]}>
        ☁️
      </Text>

      {/* Hen House */}
      <View style={[styles.henHouse, { top: insets.top + 15 }]}>
        <View style={styles.roof} />
        <View style={styles.roofEdge} />
        <View style={styles.henHouseBody}>
          <View style={styles.perch} />
        </View>
      </View>

      {/* Ground */}
      <View style={styles.ground} />

      {/* Fence */}
      <View style={styles.fence}>
        <View style={styles.fenceRail} />
        <View style={[styles.fenceRail, { bottom: 5 }]} />
      </View>

      {/* Flowers on ground */}
      <Text style={[styles.flower, { bottom: SCREEN_H * 0.22, left: 30 }]}>
        🌸
      </Text>
      <Text style={[styles.flower, { bottom: SCREEN_H * 0.18, left: 100 }]}>
        🌻
      </Text>
      <Text style={[styles.flower, { bottom: SCREEN_H * 0.2, right: 40 }]}>
        🌺
      </Text>
      <Text style={[styles.flower, { bottom: SCREEN_H * 0.24, right: 120 }]}>
        🌼
      </Text>

      {/* Falling Eggs (background decoration) */}
      {FLOATING_EGGS.map((egg, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.fallingEgg,
            {
              left: egg.startX,
              transform: [{ translateY: eggAnims[i] }],
            },
          ]}
        >
          {egg.emoji}
        </Animated.Text>
      ))}

      {/* Title */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            top: insets.top + 130,
            transform: [{ scale: titleScale }],
          },
        ]}
      >
        <Text style={styles.titleText}>🥚 EGG CATCHER!</Text>

        {/* Animated Chickens */}
        <View style={styles.chickensRow}>
          <Animated.Text
            style={[
              styles.chickenEmoji,
              { transform: [{ translateY: chicken1Anim }] },
            ]}
          >
            🐔
          </Animated.Text>
          <Animated.Text
            style={[
              styles.chickenEmoji,
              { transform: [{ translateY: chicken2Anim }] },
            ]}
          >
            🐔
          </Animated.Text>
          <Animated.Text
            style={[
              styles.chickenEmoji,
              { transform: [{ translateY: chicken3Anim }] },
            ]}
          >
            🐔
          </Animated.Text>
        </View>
      </Animated.View>

      {/* User Info */}
      {user && (
        <View style={[styles.userInfo, { top: insets.top + 280 }]}>
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>
              {user.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.highScoreText}>
              HIGH SCORE: {user.highScore || 0}
            </Text>
          </View>
        </View>
      )}

      {/* Menu Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.btnStart}
          onPress={handleStartGame}
          activeOpacity={0.8}
        >
          <Text style={styles.btnStartText}>🎮 START GAME</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnLeaderboard}
          onPress={handleLeaderboard}
          activeOpacity={0.8}
        >
          <Text style={styles.btnLeaderboardText}>🏆 LEADERBOARD</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Section */}
      {!user && (
        <View style={styles.authSection}>
          <TouchableOpacity
            style={styles.btnGuest}
            onPress={handlePlayAsGuest}
            activeOpacity={0.8}
            disabled={isLoggingIn}
          >
            <Text style={styles.btnGuestText}>
              {isLoggingIn ? "Loading..." : "Play as Guest"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#87CEEB",
  },
  skyBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#87CEEB",
  },
  sun: {
    position: "absolute",
    right: 25,
    fontSize: 50,
  },
  cloud: {
    position: "absolute",
    fontSize: 40,
    opacity: 0.8,
  },
  henHouse: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    zIndex: 5,
  },
  roof: {
    width: 160,
    height: 0,
    borderLeftWidth: 90,
    borderRightWidth: 90,
    borderBottomWidth: 35,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#C62828",
  },
  roofEdge: {
    width: 180,
    height: 6,
    backgroundColor: "#B71C1C",
    borderRadius: 2,
  },
  henHouseBody: {
    width: 160,
    height: 55,
    backgroundColor: "#A0782C",
    borderWidth: 1,
    borderColor: "#8B6914",
  },
  perch: {
    position: "absolute",
    bottom: -8,
    left: 10,
    right: 10,
    height: 7,
    backgroundColor: "#8B6914",
    borderRadius: 3,
  },
  ground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.35,
    backgroundColor: "#7EC850",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  fence: {
    position: "absolute",
    bottom: SCREEN_H * 0.33,
    left: 0,
    right: 0,
    height: 30,
  },
  fenceRail: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 10,
    height: 5,
    backgroundColor: "#A0782C",
  },
  flower: {
    position: "absolute",
    fontSize: 24,
  },
  fallingEgg: {
    position: "absolute",
    fontSize: 28,
    opacity: 0.4,
    zIndex: 1,
  },
  titleContainer: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  titleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  chickensRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 15,
  },
  chickenEmoji: {
    fontSize: 36,
  },
  userInfo: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF9800",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
  userDetails: {
    gap: 1,
  },
  welcomeText: {
    fontSize: 12,
    color: "#888",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  highScoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9800",
  },
  buttonsContainer: {
    position: "absolute",
    bottom: SCREEN_H * 0.18,
    alignSelf: "center",
    gap: 14,
    zIndex: 10,
  },
  btnStart: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 50,
    elevation: 6,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    minWidth: 220,
    alignItems: "center",
  },
  btnStartText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  btnLeaderboard: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 50,
    elevation: 6,
    shadowColor: "#E65100",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    minWidth: 220,
    alignItems: "center",
  },
  btnLeaderboardText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  authSection: {
    position: "absolute",
    bottom: SCREEN_H * 0.06,
    alignSelf: "center",
    zIndex: 10,
  },
  btnGuest: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 2,
  },
  btnGuestText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});
