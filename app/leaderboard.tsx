/* ============================================
   EGG CATCHER – Leaderboard Screen
   ============================================ */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GameAudio } from "@/utils/audio";
import { Storage } from "@/utils/storage";

const { width: SCREEN_W } = Dimensions.get("window");

interface LeaderboardEntry {
  name: string;
  avatar: string | null;
  score: number;
}

// Demo leaderboard data (fallback when server unavailable)
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { name: "John", score: 890, avatar: null },
  { name: "Emma", score: 720, avatar: null },
  { name: "Henry", score: 570, avatar: null },
  { name: "Mike", score: 510, avatar: null },
  { name: "Sarah", score: 480, avatar: null },
  { name: "Alex", score: 450, avatar: null },
  { name: "Lucy", score: 420, avatar: null },
  { name: "David", score: 380, avatar: null },
  { name: "Katie", score: 350, avatar: null },
  { name: "Brian", score: 300, avatar: null },
];

const MEDALS = ["🥇", "🥈", "🥉"];
const AVATAR_EMOJIS = [
  "😎",
  "🤠",
  "😊",
  "🧑‍🌾",
  "👩‍🌾",
  "🧒",
  "👧",
  "👦",
  "🙂",
  "😄",
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>(DEMO_LEADERBOARD);
  const [loading, setLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  useEffect(() => {
    // Load current user
    Storage.getGuest().then((user) => {
      if (user) setCurrentUserName(user.name);
    });

    // Try to fetch from server, fall back to demo
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Try fetching from server
      const { NODE_LIVE_URL } = require("../filesUrl");
      const res = await fetch(`${NODE_LIVE_URL.replace("/api", "")}/api/leaderboard`, {
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      if (data.success && data.leaderboard?.length > 0) {
        setLeaderboard(data.leaderboard);
      }
    } catch {
      // Use demo data
      setLeaderboard(DEMO_LEADERBOARD);
    }
    setLoading(false);
  };

  const handleBack = () => {
    GameAudio.playClick();
    router.back();
  };

  const handlePlayNow = () => {
    GameAudio.playClick();
    router.push("/game");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 LEADERBOARD</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Leaderboard List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🥚</Text>
            <Text style={styles.emptyText}>
              No scores yet!{"\n"}Be the first to play!
            </Text>
          </View>
        ) : (
          leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const isCurrent =
              currentUserName && entry.name === currentUserName;

            return (
              <View
                key={index}
                style={[
                  styles.row,
                  isTop3 && styles.rowTop3,
                  rank === 1 && styles.rowGold,
                  rank === 2 && styles.rowSilver,
                  rank === 3 && styles.rowBronze,
                  isCurrent && styles.rowCurrent,
                ]}
              >
                {/* Rank */}
                <View style={styles.rankContainer}>
                  {isTop3 ? (
                    <Text style={styles.medalText}>{MEDALS[index]}</Text>
                  ) : (
                    <Text style={styles.rankText}>{rank}</Text>
                  )}
                </View>

                {/* Avatar */}
                <View
                  style={[
                    styles.avatar,
                    isTop3 && styles.avatarTop3,
                  ]}
                >
                  <Text style={styles.avatarEmoji}>
                    {AVATAR_EMOJIS[index % AVATAR_EMOJIS.length]}
                  </Text>
                </View>

                {/* Name */}
                <View style={styles.nameContainer}>
                  <Text
                    style={[styles.nameText, isCurrent && styles.nameTextCurrent]}
                    numberOfLines={1}
                  >
                    {entry.name}
                  </Text>
                  {isCurrent && <Text style={styles.youBadge}>YOU</Text>}
                </View>

                {/* Score */}
                <Text style={[styles.scoreText, isTop3 && styles.scoreTextTop3]}>
                  {entry.score.toLocaleString()}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={handlePlayNow}
          activeOpacity={0.8}
        >
          <Text style={styles.playBtnText}>🎮 PLAY NOW</Text>
        </TouchableOpacity>
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
    height: "30%",
    backgroundColor: "#1A1A2E",
  },
  bgBottom: {
    position: "absolute",
    top: "15%",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#16213E",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backBtnText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 60,
  },

  // List
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 20,
    gap: 8,
  },

  // Loading / Empty
  loadingContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowTop3: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  rowGold: {
    backgroundColor: "rgba(255,215,0,0.12)",
    borderColor: "rgba(255,215,0,0.3)",
  },
  rowSilver: {
    backgroundColor: "rgba(192,192,192,0.1)",
    borderColor: "rgba(192,192,192,0.2)",
  },
  rowBronze: {
    backgroundColor: "rgba(205,127,50,0.1)",
    borderColor: "rgba(205,127,50,0.2)",
  },
  rowCurrent: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76,175,80,0.15)",
  },

  // Rank
  rankContainer: {
    width: 36,
    alignItems: "center",
  },
  medalText: {
    fontSize: 26,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },

  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTop3: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarEmoji: {
    fontSize: 22,
  },

  // Name
  nameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    flexShrink: 1,
  },
  nameTextCurrent: {
    color: "#4CAF50",
  },
  youBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4CAF50",
    backgroundColor: "rgba(76,175,80,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },

  // Score
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },
  scoreTextTop3: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFD700",
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: "#16213E",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  playBtn: {
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
  playBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
});
