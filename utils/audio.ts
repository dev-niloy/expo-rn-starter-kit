/* ============================================
   EGG CATCHER – Audio/Haptic Feedback
   Uses expo-haptics for tactile feedback on Android
   ============================================ */

import * as Haptics from "expo-haptics";

let isMuted = false;

export const GameAudio = {
  toggleMute() {
    isMuted = !isMuted;
    return isMuted;
  },

  isMuted() {
    return isMuted;
  },

  playCatch() {
    if (isMuted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  playGoldenCatch() {
    if (isMuted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  playHurt() {
    if (isMuted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  playPowerup() {
    if (isMuted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  playGameOver() {
    if (isMuted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  playClick() {
    if (isMuted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
};
