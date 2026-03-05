/* ============================================
   EGG CATCHER – Local Storage Helpers
   ============================================ */

import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_KEY = "eggcatcher_guest";
const HIGH_SCORE_KEY = "eggcatcher_highscore";

export interface GuestUser {
  id: string | null;
  name: string;
  avatar: string | null;
  highScore: number;
  isGuest: boolean;
  isOffline?: boolean;
}

export const Storage = {
  async saveGuest(user: GuestUser): Promise<void> {
    await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(user));
  },

  async getGuest(): Promise<GuestUser | null> {
    try {
      const data = await AsyncStorage.getItem(GUEST_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async clearGuest(): Promise<void> {
    await AsyncStorage.removeItem(GUEST_KEY);
  },

  async getHighScore(): Promise<number> {
    try {
      const score = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      return score ? parseInt(score, 10) : 0;
    } catch {
      return 0;
    }
  },

  async setHighScore(score: number): Promise<void> {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, String(score));
  },

  async updateHighScoreIfNeeded(score: number): Promise<boolean> {
    const current = await this.getHighScore();
    if (score > current) {
      await this.setHighScore(score);
      return true;
    }
    return false;
  },
};
