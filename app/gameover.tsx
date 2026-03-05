/* ============================================
   EGG CATCHER – Game Over Screen
   ============================================ */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GameAudio } from "@/utils/audio";
import { Storage } from "@/utils/storage";

const { width: SCREEN_W } = Dimensions.get("window");

export default function GameOverScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ score: string }>();
  const finalScore = parseInt(params.score || "0", 10);

  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [rank, setRank] = useState("--");

  // Animations
  const titleScale = useRef(new Animated.Value(0)).current;
  const eggRotate = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(50)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check & update high score
    Storage.updateHighScoreIfNeeded(finalScore).then((isNew) => {
      setIsNewHighScore(isNew);
      Storage.getHighScore().then(setHighScore);
    });

    // Update guest user's high score
    Storage.getGuest().then((user) => {
      if (user && finalScore > (user.highScore || 0)) {
        user.highScore = finalScore;
        Storage.saveGuest(user);
      }
    });

    // Animations sequence
    Animated.sequence([
      // Title bounce in
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      // Stats fade in
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Buttons slide up
      Animated.parallel([
        Animated.timing(buttonsSlide, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Egg rotation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(eggRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(eggRotate, {
          toValue: -1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(eggRotate, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [finalScore]);

  const eggRotation = eggRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  const handlePlayAgain = () => {
    GameAudio.playClick();
    router.replace("/game");
  };

  const handleLeaderboard = () => {
    GameAudio.playClick();
    router.push("/leaderboard");
  };

  const handleMenu = () => {
    GameAudio.playClick();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background layers */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <View style={[styles.content, { paddingTop: insets.top + 30 }]}>
        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            { transform: [{ scale: titleScale }] },
          ]}
        >
          <Text style={styles.titleText}>GAME OVER</Text>
        </Animated.View>

        {/* Fried Egg */}
        <Animated.Text
          style={[
            styles.friedEgg,
            { transform: [{ rotate: eggRotation }] },
          ]}
        >
          🍳
        </Animated.Text>

        {/* Stats */}
        <Animated.View style={[styles.statsBox, { opacity: statsOpacity }]}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>
              {finalScore.toLocaleString()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>High Score</Text>
            <Text style={styles.statValue}>
              {(highScore || finalScore).toLocaleString()}
            </Text>
          </View>

          {isNewHighScore && (
            <>
              <View style={styles.divider} />
              <View style={styles.newHighScoreRow}>
                <Text style={styles.newHighScoreBadge}>
                  🌟 NEW HIGH SCORE! 🌟
                </Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Rank</Text>
            <Text style={styles.statValue}>
              {rank !== "--" ? `#${rank}` : "#--"}
            </Text>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsSlide }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.btnPlayAgain}
            onPress={handlePlayAgain}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPlayAgainText}>🔄 PLAY AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnLeaderboard}
            onPress={handleLeaderboard}
            activeOpacity={0.8}
          >
            <Text style={styles.btnLeaderboardText}>🏆 LEADERBOARD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnMenu}
            onPress={handleMenu}
            activeOpacity={0.8}
          >
            <Text style={styles.btnMenuText}>🏠 MENU</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#1A1A2E",
  },
  bgBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: "#16213E",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  // Title
  titleContainer: {
    marginBottom: 10,
  },
  titleText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#E53935",
    letterSpacing: 3,
    textShadowColor: "rgba(229, 57, 53, 0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },

  // Egg
  friedEgg: {
    fontSize: 65,
    marginBottom: 20,
  },

  // Stats
  statsBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    width: Math.min(SCREEN_W - 48, 340),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  newHighScoreRow: {
    paddingVertical: 10,
    alignItems: "center",
  },
  newHighScoreBadge: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFD700",
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Buttons
  buttonsContainer: {
    marginTop: 28,
    gap: 12,
    width: Math.min(SCREEN_W - 48, 300),
  },
  btnPlayAgain: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  btnPlayAgainText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
  btnLeaderboard: {
    backgroundColor: "#FF9800",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#E65100",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  btnLeaderboardText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
  btnMenu: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  btnMenuText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
});
