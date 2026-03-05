/* ============================================
   EGG CATCHER – Game Screen
   The main gameplay rendered with RN views + emojis
   ============================================ */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GameState,
  createGameState,
  startGame,
  updateGame,
  togglePause,
  EGG_TYPES,
} from "@/utils/gameEngine";
import { GameAudio } from "@/utils/audio";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const gameRef = useRef<GameState | null>(null);
  const [, setTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const animFrameRef = useRef<number>(0);
  const isRunning = useRef(false);

  // Initialize game engine
  useEffect(() => {
    const game = createGameState(SCREEN_W, SCREEN_H, {
      onCatch: () => GameAudio.playCatch(),
      onGoldenCatch: () => GameAudio.playGoldenCatch(),
      onHurt: () => GameAudio.playHurt(),
      onPowerup: () => GameAudio.playPowerup(),
      onGameOver: (score) => {
        isRunning.current = false;
        cancelAnimationFrame(animFrameRef.current);
        GameAudio.playGameOver();
        setTimeout(() => {
          router.replace({
            pathname: "/gameover",
            params: { score: String(score) },
          });
        }, 600);
      },
    });

    gameRef.current = game;
    startGame(game);
    isRunning.current = true;

    let lastTime = Date.now();
    const loop = () => {
      if (!isRunning.current) return;

      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (gameRef.current && gameRef.current.status === "playing") {
        updateGame(gameRef.current, dt);
      }
      setTick((t) => t + 1);

      if (gameRef.current && gameRef.current.status === "playing") {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning.current = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Touch handling via PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (gameRef.current && gameRef.current.status === "playing") {
          gameRef.current.inputX = evt.nativeEvent.pageX;
        }
      },
      onPanResponderMove: (evt) => {
        if (gameRef.current && gameRef.current.status === "playing") {
          gameRef.current.inputX = evt.nativeEvent.pageX;
        }
      },
      onPanResponderRelease: () => {
        if (gameRef.current) {
          gameRef.current.inputX = null;
        }
      },
      onPanResponderTerminate: () => {
        if (gameRef.current) {
          gameRef.current.inputX = null;
        }
      },
    }),
  ).current;

  const resumeLoop = useCallback(() => {
    if (!gameRef.current || gameRef.current.status !== "playing") return;
    isRunning.current = true;
    let lastTime = Date.now();
    const loop = () => {
      if (!isRunning.current) return;
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (gameRef.current && gameRef.current.status === "playing") {
        updateGame(gameRef.current, dt);
      }
      setTick((t) => t + 1);
      if (
        gameRef.current &&
        gameRef.current.status === "playing" &&
        isRunning.current
      ) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };
    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  const handlePause = useCallback(() => {
    if (!gameRef.current) return;
    GameAudio.playClick();
    togglePause(gameRef.current);
    const newPaused = gameRef.current.status === "paused";
    setIsPaused(newPaused);

    if (newPaused) {
      isRunning.current = false;
      cancelAnimationFrame(animFrameRef.current);
    } else {
      resumeLoop();
    }
  }, [resumeLoop]);

  const handleQuit = useCallback(() => {
    GameAudio.playClick();
    isRunning.current = false;
    cancelAnimationFrame(animFrameRef.current);
    if (gameRef.current) gameRef.current.status = "idle";
    router.replace("/");
  }, []);

  const handleMute = useCallback(() => {
    const muted = GameAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  const game = gameRef.current;
  if (!game) return <View style={styles.container} />;

  // Compute lives display
  const livesDisplay: string[] = [];
  for (let i = 0; i < game.maxLives; i++) {
    livesDisplay.push(i < game.lives ? "❤️" : "🖤");
  }

  // Compute combo
  let comboMultiplier = 1;
  if (game.combo >= 10) comboMultiplier = 3;
  else if (game.combo >= 5) comboMultiplier = 2;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar hidden />

      {/* ---- BACKGROUND ---- */}
      {/* Sky */}
      <View style={styles.sky} />

      {/* Sun */}
      <Text style={styles.sun}>☀️</Text>

      {/* Clouds */}
      <Text style={[styles.cloudEmoji, { top: 50, left: 15 }]}>☁️</Text>
      <Text style={[styles.cloudEmoji, { top: 30, right: 50 }]}>☁️</Text>

      {/* Hen House at top */}
      <View style={styles.henHouse}>
        <View style={styles.henRoof} />
        <View style={styles.henRoofEdge} />
        <View style={styles.henBody}>
          <Text style={styles.henChickens}>🐔 🐔 🐔</Text>
        </View>
        <View style={styles.henPerch} />
      </View>

      {/* Barn */}
      <View style={styles.barn}>
        <View style={styles.barnRoof} />
        <View style={styles.barnBody}>
          <View style={styles.barnWindow} />
          <View style={styles.barnDoor} />
        </View>
      </View>

      {/* Ground with grass */}
      <View style={styles.ground}>
        <View style={styles.grassHill} />
      </View>

      {/* Fence */}
      <View style={styles.fence}>
        <View style={styles.fenceRail} />
        <View style={[styles.fenceRail, { top: 16 }]} />
      </View>

      {/* Flowers */}
      <Text style={[styles.flowers, { bottom: 95, left: 20 }]}>🌸</Text>
      <Text style={[styles.flowers, { bottom: 80, left: 90 }]}>🌻</Text>
      <Text style={[styles.flowers, { bottom: 100, right: 30 }]}>🌺</Text>
      <Text style={[styles.flowers, { bottom: 70, right: 110 }]}>🌼</Text>
      <Text style={[styles.flowers, { bottom: 85, left: SCREEN_W * 0.45 }]}>
        🌷
      </Text>

      {/* ---- FALLING EGGS ---- */}
      {game.eggs.map((egg) => (
        <View
          key={egg.id}
          style={[
            styles.eggContainer,
            {
              left: egg.x - egg.w * 0.6,
              top: egg.y - egg.h * 0.6,
              transform: [{ rotate: `${egg.rotAngle}rad` }],
            },
          ]}
        >
          <Text style={{ fontSize: egg.w * 1.2 }}>
            {EGG_TYPES[egg.type].emoji}
          </Text>
        </View>
      ))}

      {/* ---- BASKET + CHARACTER ---- */}
      <View
        style={[
          styles.basketContainer,
          {
            left: game.basket.x - game.basket.w / 2,
            top: game.basket.y - 30,
          },
        ]}
        pointerEvents="none"
      >
        {/* Character head */}
        <View style={styles.characterHead}>
          <View style={styles.cap} />
          <View style={styles.face}>
            <View style={styles.eyeRow}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <Text style={styles.mouth}>⌣</Text>
          </View>
        </View>

        {/* Character body */}
        <View style={styles.characterBody}>
          {/* Arms */}
          <View style={styles.armLeft} />
          <View style={styles.armRight} />

          {/* Overalls */}
          <View style={styles.overalls}>
            <View style={styles.shirt} />
          </View>
        </View>

        {/* Basket */}
        <View style={[styles.basket, { width: game.basket.w }]}>
          <View style={styles.basketRim} />
          <View style={styles.basketBody}>
            {/* Weave lines */}
            <View style={styles.weaveLine} />
            <View style={[styles.weaveLine, { top: "50%" }]} />
            <View style={[styles.weaveLine, { top: "75%" }]} />
          </View>
        </View>

        {/* Powerup Auras */}
        {game.powerups.magnet.active && (
          <View style={[styles.aura, styles.magnetAura]} />
        )}
        {game.powerups.freeze.active && (
          <View style={[styles.aura, styles.freezeAura]} />
        )}
      </View>

      {/* ---- PARTICLES ---- */}
      {game.particles.map((p) => (
        <Text
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.x - p.size / 2,
              top: p.y - p.size / 2,
              fontSize: p.size,
              opacity: Math.max(0, p.life),
            },
          ]}
        >
          {p.emoji}
        </Text>
      ))}

      {/* ---- SCORE POPUPS ---- */}
      {game.scorePopups.map((sp) => (
        <Text
          key={sp.id}
          style={[
            styles.scorePopup,
            {
              left: sp.x - 50,
              top: sp.y,
              opacity: Math.max(0, sp.life),
              color:
                sp.popType === "negative"
                  ? "#E53935"
                  : sp.popType === "golden"
                    ? "#FFD700"
                    : "#4CAF50",
            },
          ]}
        >
          {sp.text}
        </Text>
      ))}

      {/* ---- HUD ---- */}
      <View style={[styles.hud, { top: insets.top + 5 }]}>
        <View style={styles.hudLeft}>
          <Text style={styles.livesText}>{livesDisplay.join("")}</Text>
          <TouchableOpacity
            style={styles.hudBtn}
            onPress={handlePause}
            activeOpacity={0.7}
          >
            <Text style={styles.hudBtnText}>
              {isPaused ? "▶️" : "⏸️"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hudBtn}
            onPress={handleMute}
            activeOpacity={0.7}
          >
            <Text style={styles.hudBtnText}>{isMuted ? "🔇" : "🔊"}</Text>
          </TouchableOpacity>
        </View>

        {game.combo >= 3 && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboText}>
              🔥 x{comboMultiplier} ({game.combo})
            </Text>
          </View>
        )}

        <View style={styles.hudRight}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{game.score}</Text>
        </View>
      </View>

      {/* ---- PAUSE OVERLAY ---- */}
      {isPaused && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <Text style={styles.overlayTitle}>⏸️ PAUSED</Text>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={handlePause}
              activeOpacity={0.8}
            >
              <Text style={styles.resumeBtnText}>▶️ RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitBtn}
              onPress={handleQuit}
              activeOpacity={0.8}
            >
              <Text style={styles.quitBtnText}>🏠 QUIT</Text>
            </TouchableOpacity>
          </View>
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

  // ---- Background ----
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#87CEEB",
  },
  sun: {
    position: "absolute",
    top: 15,
    right: 15,
    fontSize: 42,
  },
  cloudEmoji: {
    position: "absolute",
    fontSize: 36,
    opacity: 0.7,
  },

  // Hen house
  henHouse: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 2,
  },
  henRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 80,
    borderRightWidth: 80,
    borderBottomWidth: 30,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#C62828",
  },
  henRoofEdge: {
    width: 165,
    height: 5,
    backgroundColor: "#B71C1C",
    borderRadius: 2,
  },
  henBody: {
    width: 145,
    height: 45,
    backgroundColor: "#A0782C",
    borderWidth: 1,
    borderColor: "#8B6914",
    alignItems: "center",
    justifyContent: "center",
  },
  henChickens: {
    fontSize: 22,
  },
  henPerch: {
    width: 125,
    height: 6,
    backgroundColor: "#8B6914",
    borderRadius: 3,
    marginTop: 2,
  },

  // Barn
  barn: {
    position: "absolute",
    top: SCREEN_H * 0.52,
    left: 15,
    alignItems: "center",
    zIndex: 1,
  },
  barnRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 40,
    borderRightWidth: 40,
    borderBottomWidth: 22,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#B71C1C",
  },
  barnBody: {
    width: 65,
    height: 45,
    backgroundColor: "#C62828",
  },
  barnWindow: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 14,
    height: 12,
    backgroundColor: "#FFEB3B",
    borderWidth: 1,
    borderColor: "#5D4037",
  },
  barnDoor: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    width: 18,
    height: 26,
    backgroundColor: "#5D4037",
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },

  // Ground
  ground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.32,
    backgroundColor: "#5DA83A",
    overflow: "hidden",
  },
  grassHill: {
    position: "absolute",
    top: -20,
    left: -30,
    right: -30,
    height: 50,
    backgroundColor: "#6DB344",
    borderRadius: 100,
  },

  // Fence
  fence: {
    position: "absolute",
    bottom: SCREEN_H * 0.31,
    left: 0,
    right: 0,
    height: 25,
    zIndex: 1,
  },
  fenceRail: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 5,
    height: 4,
    backgroundColor: "#A0782C",
  },

  flowers: {
    position: "absolute",
    fontSize: 20,
    zIndex: 2,
  },

  // ---- Egg ----
  eggContainer: {
    position: "absolute",
    zIndex: 10,
  },

  // ---- Basket & Character ----
  basketContainer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 8,
  },
  characterHead: {
    alignItems: "center",
    zIndex: 2,
  },
  cap: {
    width: 28,
    height: 14,
    backgroundColor: "#E53935",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginBottom: -3,
  },
  face: {
    width: 28,
    height: 24,
    borderRadius: 14,
    backgroundColor: "#FFCCBC",
    alignItems: "center",
    justifyContent: "center",
  },
  eyeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  eye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
  },
  mouth: {
    fontSize: 9,
    marginTop: -2,
    color: "#D84315",
  },
  characterBody: {
    alignItems: "center",
    height: 22,
    marginTop: -2,
  },
  armLeft: {
    position: "absolute",
    top: 3,
    left: -20,
    width: 20,
    height: 5,
    backgroundColor: "#FFCCBC",
    borderRadius: 2.5,
    transform: [{ rotate: "-30deg" }],
  },
  armRight: {
    position: "absolute",
    top: 3,
    right: -20,
    width: 20,
    height: 5,
    backgroundColor: "#FFCCBC",
    borderRadius: 2.5,
    transform: [{ rotate: "30deg" }],
  },
  overalls: {
    width: 26,
    height: 22,
    backgroundColor: "#1565C0",
    borderRadius: 4,
    overflow: "hidden",
  },
  shirt: {
    width: "100%",
    height: 10,
    backgroundColor: "#E53935",
    borderRadius: 2,
  },

  // Basket
  basket: {
    alignItems: "center",
    zIndex: 1,
    marginTop: -4,
  },
  basketRim: {
    width: "90%",
    height: 6,
    backgroundColor: "#A0782C",
    borderRadius: 3,
    zIndex: 2,
  },
  basketBody: {
    width: "100%",
    height: 32,
    backgroundColor: "#C49A5C",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 3,
    borderColor: "#A0782C",
  },
  weaveLine: {
    position: "absolute",
    top: "25%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(139, 105, 20, 0.3)",
  },

  // Powerup auras
  aura: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    width: 90,
    height: 50,
    borderRadius: 45,
    borderWidth: 3,
  },
  magnetAura: {
    borderColor: "rgba(156, 39, 176, 0.6)",
  },
  freezeAura: {
    borderColor: "rgba(0, 188, 212, 0.6)",
  },

  // ---- Particles ----
  particle: {
    position: "absolute",
    zIndex: 20,
  },

  // ---- Score Popups ----
  scorePopup: {
    position: "absolute",
    width: 100,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    zIndex: 25,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // ---- HUD ----
  hud: {
    position: "absolute",
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 50,
  },
  hudLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  livesText: {
    fontSize: 20,
  },
  hudBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  hudBtnText: {
    fontSize: 18,
  },
  comboContainer: {
    backgroundColor: "rgba(255,87,34,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  comboText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
  },
  hudRight: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
    letterSpacing: 1.5,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#333",
  },

  // ---- Pause Overlay ----
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  overlayBox: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    gap: 14,
    elevation: 10,
    width: 260,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#333",
    marginBottom: 10,
  },
  resumeBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 50,
    elevation: 4,
    width: "100%",
    alignItems: "center",
  },
  resumeBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
  quitBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 50,
    elevation: 4,
    width: "100%",
    alignItems: "center",
  },
  quitBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
});
