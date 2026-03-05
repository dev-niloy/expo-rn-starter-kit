/* ============================================
   EGG CATCHER – Game Screen
   The main gameplay rendered with RN views + emojis
   OPTIMIZED FOR 60FPS PERFORMANCE
   ============================================ */

import {
  createGameState,
  EGG_TYPES,
  EggObject,
  GameState,
  ParticleObject,
  ScorePopup,
  startGame,
  togglePause,
  updateGame,
} from "@/utils/gameEngine";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  InteractionManager,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Pre-computed styles for eggs to avoid inline style creation
const eggFontSizes: Record<number, { fontSize: number }> = {};
for (let i = 20; i <= 60; i++) {
  eggFontSizes[i] = { fontSize: i * 1.2 };
}

// Egg component - no memo since egg properties are mutated
function Egg({ egg }: { egg: EggObject }) {
  const fontSize = Math.round(egg.w);
  return (
    <View
      style={{
        position: "absolute",
        zIndex: 10,
        left: egg.x - egg.w * 0.6,
        top: egg.y - egg.h * 0.6,
        transform: [{ rotate: `${egg.rotAngle.toFixed(2)}rad` }],
      }}
    >
      <Text style={eggFontSizes[fontSize] || { fontSize: egg.w * 1.2 }}>
        {EGG_TYPES[egg.type].emoji}
      </Text>
    </View>
  );
}

// Particle component - no memo since particle properties are mutated
function Particle({ p }: { p: ParticleObject }) {
  return (
    <Text
      style={{
        position: "absolute",
        zIndex: 20,
        left: p.x - p.size / 2,
        top: p.y - p.size / 2,
        fontSize: p.size,
        opacity: Math.max(0, p.life),
      }}
    >
      {p.emoji}
    </Text>
  );
}

// ScorePopup component - no memo since properties are mutated
function ScorePopupItem({ sp }: { sp: ScorePopup }) {
  const color =
    sp.popType === "negative"
      ? "#E53935"
      : sp.popType === "golden"
        ? "#FFD700"
        : "#4CAF50";
  return (
    <Text
      style={{
        position: "absolute",
        width: 100,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "800",
        zIndex: 25,
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        left: sp.x - 50,
        top: sp.y,
        opacity: Math.max(0, sp.life),
        color,
      }}
    >
      {sp.text}
    </Text>
  );
}

// Memoized Character component
const Character = memo(function Character({
  basketX,
  basketY,
  basketW,
  magnetActive,
  freezeActive,
}: {
  basketX: number;
  basketY: number;
  basketW: number;
  magnetActive: boolean;
  freezeActive: boolean;
}) {
  const containerStyle = useMemo(
    () => [
      styles.basketContainer,
      {
        left: basketX - basketW / 2,
        top: basketY - 30,
      },
    ],
    [basketX, basketY, basketW],
  );

  return (
    <View style={containerStyle} pointerEvents="none">
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
        <View style={styles.armLeft} />
        <View style={styles.armRight} />
        <View style={styles.overalls}>
          <View style={styles.shirt} />
        </View>
      </View>

      {/* Basket */}
      <View style={[styles.basket, { width: basketW }]}>
        <View style={styles.basketRim} />
        <View style={styles.basketBody}>
          <View style={styles.weaveLine} />
          <View style={[styles.weaveLine, { top: "50%" }]} />
          <View style={[styles.weaveLine, { top: "75%" }]} />
        </View>
      </View>

      {/* Powerup Auras */}
      {magnetActive && <View style={[styles.aura, styles.magnetAura]} />}
      {freezeActive && <View style={[styles.aura, styles.freezeAura]} />}
    </View>
  );
});

// Memoized static background component - never re-renders
const StaticBackground = memo(function StaticBackground() {
  return (
    <>
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
    </>
  );
});

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Use simple state for force update - more predictable
  const [, setTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const animFrameRef = useRef<number>(0);
  const isRunning = useRef(false);
  const lastTimeRef = useRef(Date.now());
  const lastRenderRef = useRef(Date.now());

  // Initialize game state
  const gameRef = useRef<GameState>(
    createGameState(SCREEN_W, SCREEN_H, {
      onCatch: () => {
        // Play catch sound if not muted
      },
      onGoldenCatch: () => {
        // Play golden catch sound
      },
      onHurt: () => {
        // Play hurt sound
      },
      onPowerup: () => {
        // Play powerup sound
      },
      onGameOver: (score: number) => {
        router.push({
          pathname: "/gameover",
          params: { score: score.toString() },
        });
      },
    }),
  );

  // Start the game on mount
  useEffect(() => {
    startGame(gameRef.current);
  }, []);

  // PanResponder for touch input - optimized with InteractionManager
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          gameRef.current.inputX = evt.nativeEvent.pageX;
        },
        onPanResponderMove: (evt) => {
          // Direct assignment - no state updates during touch
          gameRef.current.inputX = evt.nativeEvent.pageX;
        },
        onPanResponderRelease: () => {
          gameRef.current.inputX = null;
        },
      }),
    [],
  );

  // Game loop - MAXIMUM OPTIMIZATION
  const loop = useCallback(() => {
    if (!isRunning.current) return;

    const now = Date.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;

    // Update game logic at full speed (60fps)
    if (gameRef.current && gameRef.current.status === "playing") {
      updateGame(gameRef.current, dt);
    }

    // Throttle React re-renders to ~24fps (every 42ms) for smoother touch response
    // Game logic still runs at 60fps, only UI updates are throttled
    if (now - lastRenderRef.current >= 42) {
      lastRenderRef.current = now;
      setTick((t) => t + 1);
    }

    if (gameRef.current && gameRef.current.status !== "gameover") {
      animFrameRef.current = requestAnimationFrame(loop);
    }
  }, []);

  useEffect(() => {
    isRunning.current = true;
    lastTimeRef.current = Date.now();
    lastRenderRef.current = Date.now();
    // Use InteractionManager to start loop after animations complete
    const handle = InteractionManager.runAfterInteractions(() => {
      animFrameRef.current = requestAnimationFrame(loop);
    });
    return () => {
      isRunning.current = false;
      cancelAnimationFrame(animFrameRef.current);
      handle.cancel();
    };
  }, [loop]);

  // Handlers
  const handlePause = useCallback(() => {
    if (gameRef.current) {
      togglePause(gameRef.current);
      setIsPaused(gameRef.current.status === "paused");
      if (gameRef.current.status === "playing") {
        lastTimeRef.current = Date.now();
        lastRenderRef.current = Date.now();
        animFrameRef.current = requestAnimationFrame(loop);
      }
    }
  }, [loop]);

  const handleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const handleQuit = useCallback(() => {
    isRunning.current = false;
    cancelAnimationFrame(animFrameRef.current);
    router.push("/");
  }, [router]);

  const currentGame = gameRef.current;
  if (!currentGame) return <View style={styles.container} />;

  // Compute lives display
  const livesDisplay: string[] = [];
  for (let i = 0; i < currentGame.maxLives; i++) {
    livesDisplay.push(i < currentGame.lives ? "❤️" : "🖤");
  }

  // Compute combo
  let comboMultiplier = 1;
  if (currentGame.combo >= 10) comboMultiplier = 3;
  else if (currentGame.combo >= 5) comboMultiplier = 2;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar hidden />

      {/* ---- BACKGROUND (Memoized - never re-renders) ---- */}
      <StaticBackground />

      {/* ---- FALLING EGGS (Memoized) ---- */}
      {currentGame.eggs.map((egg) => (
        <Egg key={egg.id} egg={egg} />
      ))}

      {/* ---- BASKET + CHARACTER (Memoized) ---- */}
      <Character
        basketX={currentGame.basket.x}
        basketY={currentGame.basket.y}
        basketW={currentGame.basket.w}
        magnetActive={currentGame.powerups.magnet.active}
        freezeActive={currentGame.powerups.freeze.active}
      />

      {/* ---- PARTICLES (Memoized) ---- */}
      {currentGame.particles.map((p) => (
        <Particle key={p.id} p={p} />
      ))}

      {/* ---- SCORE POPUPS (Memoized) ---- */}
      {currentGame.scorePopups.map((sp) => (
        <ScorePopupItem key={sp.id} sp={sp} />
      ))}

      {/* ---- HUD ---- */}
      <View style={[styles.hud, { top: insets.top + 10 }]}>
        {/* Left side - Lives and controls */}
        <View style={styles.hudLeft}>
          <View style={styles.livesContainer}>
            <Text style={styles.livesText}>{livesDisplay.join(" ")}</Text>
          </View>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.hudBtn}
              onPress={handlePause}
              activeOpacity={0.7}
            >
              <Text style={styles.hudBtnText}>{isPaused ? "▶️" : "⏸️"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.hudBtn}
              onPress={handleMute}
              activeOpacity={0.7}
            >
              <Text style={styles.hudBtnText}>{isMuted ? "🔇" : "🔊"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Center - Level and Combo */}
        <View style={styles.hudCenter}>
          <View style={styles.levelContainer}>
            <Text style={styles.levelLabel}>LEVEL</Text>
            <Text style={styles.levelValue}>{Math.floor(currentGame.difficulty)}</Text>
          </View>
          {currentGame.combo >= 3 && (
            <View style={styles.comboContainer}>
              <Text style={styles.comboText}>
                🔥 x{comboMultiplier}
              </Text>
              <Text style={styles.comboCount}>{currentGame.combo} hits</Text>
            </View>
          )}
        </View>

        {/* Right side - Score */}
        <View style={styles.hudRight}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{currentGame.score.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* ---- PAUSE OVERLAY ---- */}
      {isPaused && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <View style={styles.pauseIconContainer}>
              <Text style={styles.pauseIcon}>⏸️</Text>
            </View>
            <Text style={styles.overlayTitle}>GAME PAUSED</Text>
            
            {/* Game Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Score</Text>
                <Text style={styles.statValue}>{currentGame.score.toLocaleString()}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Level</Text>
                <Text style={styles.statValue}>{Math.floor(currentGame.difficulty)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Lives</Text>
                <Text style={styles.statValue}>{currentGame.lives}/{currentGame.maxLives}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={handlePause}
              activeOpacity={0.8}
            >
              <Text style={styles.resumeBtnText}>▶️  RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitBtn}
              onPress={handleQuit}
              activeOpacity={0.8}
            >
              <Text style={styles.quitBtnText}>🏠  QUIT TO MENU</Text>
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
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 50,
  },
  hudLeft: {
    alignItems: "flex-start",
    gap: 8,
  },
  livesContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  livesText: {
    fontSize: 18,
    letterSpacing: 2,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
  },
  hudBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  hudBtnText: {
    fontSize: 20,
  },
  hudCenter: {
    alignItems: "center",
    gap: 8,
  },
  levelContainer: {
    backgroundColor: "rgba(103, 58, 183, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#4527A0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  levelLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1.5,
  },
  levelValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFF",
  },
  comboContainer: {
    backgroundColor: "rgba(255, 87, 34, 0.95)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#E64A19",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  comboText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFF",
  },
  comboCount: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  hudRight: {
    alignItems: "flex-end",
  },
  scoreContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 90,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1.5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2E7D32",
  },

  // ---- Pause Overlay ----
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  overlayBox: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    elevation: 12,
    width: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  pauseIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pauseIcon: {
    fontSize: 36,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#333",
    letterSpacing: 2,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 20,
    width: "100%",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#DDD",
  },
  resumeBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    elevation: 6,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  resumeBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
  quitBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    elevation: 6,
    width: "100%",
    alignItems: "center",
    shadowColor: "#E65100",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  quitBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
});
