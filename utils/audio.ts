/* ============================================
   EGG CATCHER – Audio/Haptic Feedback
   Uses expo-av for sounds + expo-haptics for tactile
   ============================================ */

import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

let isMuted = false;
let soundsLoaded = false;

// Sound instances (loaded on demand)
const sounds: { [key: string]: Audio.Sound | null } = {
  catch: null,
  golden: null,
  hurt: null,
  powerup: null,
  gameover: null,
  click: null,
};

// Initialize audio
async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    soundsLoaded = true;
  } catch (error) {
    console.warn("Audio init failed:", error);
  }
}

// Call init on module load
initAudio();

// Play a tone using expo-av (frequency-based beep simulation)
async function playTone(
  frequency: number,
  duration: number = 100,
): Promise<void> {
  // expo-av doesn't support frequency generation directly
  // We'll use haptics as the primary feedback and skip tone generation
  // Real sound files would be added to assets/sounds/ in production
}

export const GameAudio = {
  toggleMute() {
    isMuted = !isMuted;
    return isMuted;
  },

  setMuted(muted: boolean) {
    isMuted = muted;
  },

  isMuted() {
    return isMuted;
  },

  async playCatch() {
    if (isMuted) return;
    // Light haptic for normal catch
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  async playGoldenCatch() {
    if (isMuted) return;
    // Medium haptic for golden catch (special!)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Double tap effect
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  },

  async playHurt() {
    if (isMuted) return;
    // Error notification for hurt
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  async playPowerup() {
    if (isMuted) return;
    // Heavy impact + success for powerup
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 150);
  },

  async playGameOver() {
    if (isMuted) return;
    // Warning notification for game over
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 300);
  },

  async playClick() {
    if (isMuted) return;
    // Light tap for UI clicks
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Cleanup sounds when app closes
  async cleanup() {
    for (const key in sounds) {
      if (sounds[key]) {
        await sounds[key]?.unloadAsync();
        sounds[key] = null;
      }
    }
  },
};
