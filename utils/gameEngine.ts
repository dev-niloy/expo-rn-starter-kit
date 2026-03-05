/* ============================================
   EGG CATCHER – Game Engine (Pure Logic)
   No React/RN dependencies - portable game state
   ============================================ */

// ---- Types ----

export type EggType =
  | "normal"
  | "golden"
  | "rotten"
  | "heart"
  | "magnet"
  | "freeze";

export type GameStatus = "idle" | "playing" | "paused" | "gameover";

export interface EggConfig {
  emoji: string;
  points: number;
  chance: number;
  color: string;
  type?: "powerup";
  action?: string;
}

export const EGG_TYPES: Record<EggType, EggConfig> = {
  normal: { emoji: "🥚", points: 10, chance: 0.6, color: "#FAFAFA" },
  golden: { emoji: "🥇", points: 50, chance: 0.1, color: "#FFD700" },
  rotten: { emoji: "🤢", points: -1, chance: 0.2, color: "#6B8E23" },
  heart: {
    emoji: "❤️",
    chance: 0.03,
    points: 0,
    color: "#E91E63",
    type: "powerup",
    action: "life",
  },
  magnet: {
    emoji: "🧲",
    chance: 0.04,
    points: 0,
    color: "#9C27B0",
    type: "powerup",
    action: "magnet",
  },
  freeze: {
    emoji: "❄️",
    chance: 0.03,
    points: 0,
    color: "#00BCD4",
    type: "powerup",
    action: "freeze",
  },
};

let nextId = 1;

export interface EggObject {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  type: EggType;
  rotation: number;
  rotAngle: number;
  wobble: number;
}

export interface ParticleObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  emoji: string;
  size: number;
}

export interface ScorePopup {
  id: number;
  x: number;
  y: number;
  text: string;
  popType: "positive" | "negative" | "golden";
  life: number;
  vy: number;
}

export interface GameCallbacks {
  onCatch?: () => void;
  onGoldenCatch?: () => void;
  onHurt?: () => void;
  onPowerup?: () => void;
  onGameOver?: (score: number) => void;
}

export interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  combo: number;
  difficulty: number;
  frameCount: number;

  screenW: number;
  screenH: number;

  basket: {
    x: number;
    y: number;
    w: number;
    h: number;
    targetX: number;
  };

  eggs: EggObject[];
  particles: ParticleObject[];
  scorePopups: ScorePopup[];

  powerups: {
    magnet: { active: boolean; timer: number };
    freeze: { active: boolean; timer: number };
  };

  inputX: number | null;
  callbacks: GameCallbacks;
}

// ---- Factory ----

export function createGameState(
  screenW: number,
  screenH: number,
  callbacks: GameCallbacks = {},
): GameState {
  const basketW = Math.min(110, screenW * 0.28);
  const basketH = basketW * 0.9;

  return {
    status: "idle",
    score: 0,
    lives: 3,
    maxLives: 3,
    combo: 0,
    difficulty: 1,
    frameCount: 0,
    screenW,
    screenH,
    basket: {
      x: screenW / 2,
      y: screenH - basketH - 100,
      w: basketW,
      h: basketH,
      targetX: screenW / 2,
    },
    eggs: [],
    particles: [],
    scorePopups: [],
    powerups: {
      magnet: { active: false, timer: 0 },
      freeze: { active: false, timer: 0 },
    },
    inputX: null,
    callbacks,
  };
}

// ---- Game Flow ----

export function startGame(state: GameState): void {
  state.status = "playing";
  state.score = 0;
  state.lives = state.maxLives;
  state.combo = 0;
  state.difficulty = 1;
  state.frameCount = 0;
  state.eggs = [];
  state.particles = [];
  state.scorePopups = [];
  state.basket.x = state.screenW / 2;
  state.basket.targetX = state.screenW / 2;
  state.inputX = null;
  state.powerups.magnet = { active: false, timer: 0 };
  state.powerups.freeze = { active: false, timer: 0 };
}

export function togglePause(state: GameState): void {
  if (state.status === "playing") {
    state.status = "paused";
  } else if (state.status === "paused") {
    state.status = "playing";
  }
}

// ---- Main Update ----

export function updateGame(state: GameState, dt: number): void {
  if (state.status !== "playing") return;

  state.frameCount++;

  // Handle powerup timers
  let eggDt = dt;
  if (state.powerups.freeze.active) {
    state.powerups.freeze.timer -= dt;
    if (state.powerups.freeze.timer <= 0) {
      state.powerups.freeze.active = false;
    } else {
      eggDt = dt * 0.4; // slow eggs by 60%
    }
  }
  if (state.powerups.magnet.active) {
    state.powerups.magnet.timer -= dt;
    if (state.powerups.magnet.timer <= 0) {
      state.powerups.magnet.active = false;
    }
  }

  // Increase difficulty
  state.difficulty = 1 + Math.floor(state.score / 100) * 0.15;

  // Updates
  updateBasket(state, dt);
  spawnEggs(state);
  updateEggs(state, eggDt);
  updateParticles(state, dt);
  updateScorePopups(state, dt);
  // Collision detection is handled in updateEggs
}

// ---- Basket ----

function updateBasket(state: GameState, dt: number): void {
  const { basket, inputX, screenW } = state;

  if (inputX !== null) {
    basket.targetX = inputX;
  }

  // Smooth follow
  const dx = basket.targetX - basket.x;
  basket.x += dx * 12 * dt;

  // Clamp
  basket.x = Math.max(basket.w / 2, Math.min(screenW - basket.w / 2, basket.x));
}

// ---- Egg Spawning ----

function spawnEggs(state: GameState): void {
  const baseRate = 55;
  const rate = Math.max(15, baseRate - state.difficulty * 5);

  if (state.frameCount % Math.round(rate) === 0) {
    const type = pickEggType(state.difficulty);
    const size = type === "golden" ? 38 : 32;

    state.eggs.push({
      id: nextId++,
      x: Math.random() * (state.screenW - 60) + 30,
      y: -50,
      w: size,
      h: size * 1.2,
      speed: 130 + Math.random() * 60 + state.difficulty * 20,
      type,
      rotation: (Math.random() - 0.5) * 0.5,
      rotAngle: 0,
      wobble: Math.random() * Math.PI * 2,
    });
  }
}

function pickEggType(difficulty: number): EggType {
  const r = Math.random();
  const rottenChance = Math.min(
    0.35,
    EGG_TYPES.rotten.chance + difficulty * 0.015,
  );
  const goldenChance = Math.max(
    0.05,
    EGG_TYPES.golden.chance - difficulty * 0.005,
  );

  let cumulative = 0;

  cumulative += EGG_TYPES.heart.chance;
  if (r < cumulative) return "heart";

  cumulative += EGG_TYPES.magnet.chance;
  if (r < cumulative) return "magnet";

  cumulative += EGG_TYPES.freeze.chance;
  if (r < cumulative) return "freeze";

  cumulative += rottenChance;
  if (r < cumulative) return "rotten";

  cumulative += goldenChance;
  if (r < cumulative) return "golden";

  return "normal";
}

// ---- Egg Updates ----

function updateEggs(state: GameState, dt: number): void {
  for (let i = state.eggs.length - 1; i >= 0; i--) {
    const egg = state.eggs[i];
    egg.y += egg.speed * dt;
    egg.rotAngle += egg.rotation * dt * 3;
    egg.wobble += dt * 2;
    egg.x += Math.sin(egg.wobble) * 0.3;

    // Magnet effect
    if (state.powerups.magnet.active && egg.y > 0) {
      const dx = state.basket.x - egg.x;
      egg.x += dx * dt * 2;
    }

    // Check basket collision
    if (checkCatch(state, egg)) {
      handleCatch(state, egg);
      state.eggs.splice(i, 1);
      continue;
    }

    // Missed (fell off screen)
    if (egg.y > state.screenH + 50) {
      const cfg = EGG_TYPES[egg.type];
      if (egg.type !== "rotten" && !cfg.type) {
        // Missed a good egg - break combo
        state.combo = 0;
      }
      state.eggs.splice(i, 1);
    }
  }
}

function checkCatch(state: GameState, egg: EggObject): boolean {
  const { basket } = state;
  const catchZoneY = basket.y - 15;
  const catchZoneH = basket.h + 25;
  const catchZoneW = basket.w + 25;

  return (
    egg.y + egg.h / 2 > catchZoneY &&
    egg.y - egg.h / 2 < catchZoneY + catchZoneH &&
    Math.abs(egg.x - basket.x) < catchZoneW / 2
  );
}

function handleCatch(state: GameState, egg: EggObject): void {
  const typeConfig = EGG_TYPES[egg.type];

  if (typeConfig.type === "powerup") {
    state.callbacks.onPowerup?.();

    if (typeConfig.action === "life") {
      state.lives = Math.min(state.lives + 1, state.maxLives);
      addScorePopup(state, egg.x, state.basket.y - 30, "+1 ❤️", "positive");
    } else if (typeConfig.action === "magnet") {
      state.powerups.magnet.active = true;
      state.powerups.magnet.timer = 5;
      addScorePopup(state, egg.x, state.basket.y - 30, "MAGNET!", "positive");
    } else if (typeConfig.action === "freeze") {
      state.powerups.freeze.active = true;
      state.powerups.freeze.timer = 5;
      addScorePopup(state, egg.x, state.basket.y - 30, "FREEZE!", "positive");
    }
    spawnParticles(state, egg.x, state.basket.y, typeConfig.emoji, 6);
  } else if (egg.type === "rotten") {
    state.callbacks.onHurt?.();
    state.lives--;
    state.combo = 0;
    spawnParticles(state, egg.x, state.basket.y, "💀", 3);
    addScorePopup(state, egg.x, state.basket.y - 30, "-1 ❤️", "negative");

    if (state.lives <= 0) {
      state.status = "gameover";
      state.callbacks.onGameOver?.(state.score);
    }
  } else {
    // Normal or Golden egg
    if (egg.type === "golden") {
      state.callbacks.onGoldenCatch?.();
    } else {
      state.callbacks.onCatch?.();
    }

    let points = typeConfig.points;
    state.combo++;

    // Combo multiplier
    let multiplier = 1;
    if (state.combo >= 10) multiplier = 3;
    else if (state.combo >= 5) multiplier = 2;

    points *= multiplier;
    state.score += points;

    const label = egg.type === "golden" ? `+${points} 🌟` : `+${points}`;
    const popType = egg.type === "golden" ? "golden" : "positive";
    addScorePopup(
      state,
      egg.x,
      state.basket.y - 30,
      label,
      popType as "positive" | "negative" | "golden",
    );

    const particleEmoji = egg.type === "golden" ? "✨" : "🥚";
    spawnParticles(
      state,
      egg.x,
      state.basket.y,
      particleEmoji,
      egg.type === "golden" ? 8 : 4,
    );
  }
}

// ---- Particles ----

function spawnParticles(
  state: GameState,
  x: number,
  y: number,
  emoji: string,
  count: number,
): void {
  // Limit total particles for performance
  if (state.particles.length > 25) {
    state.particles.splice(0, state.particles.length - 18);
  }

  for (let i = 0; i < count; i++) {
    state.particles.push({
      id: nextId++,
      x,
      y,
      vx: (Math.random() - 0.5) * 200,
      vy: -Math.random() * 250 - 50,
      life: 1,
      decay: 0.8 + Math.random() * 0.5,
      emoji,
      size: 14 + Math.random() * 10,
    });
  }
}

function updateParticles(state: GameState, dt: number): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt; // gravity
    p.life -= p.decay * dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

// ---- Score Popups ----

function addScorePopup(
  state: GameState,
  x: number,
  y: number,
  text: string,
  popType: "positive" | "negative" | "golden",
): void {
  if (state.scorePopups.length > 10) {
    state.scorePopups.splice(0, state.scorePopups.length - 8);
  }

  state.scorePopups.push({
    id: nextId++,
    x,
    y,
    text,
    popType,
    life: 1,
    vy: -80,
  });
}

function updateScorePopups(state: GameState, dt: number): void {
  for (let i = state.scorePopups.length - 1; i >= 0; i--) {
    const sp = state.scorePopups[i];
    sp.y += sp.vy * dt;
    sp.life -= dt * 0.8;
    if (sp.life <= 0) state.scorePopups.splice(i, 1);
  }
}
