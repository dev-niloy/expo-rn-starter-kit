/* ============================================
   EGG CATCHER – Firebase Service
   Handles authentication and data storage
   ============================================ */

import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  User,
  signOut as firebaseSignOut,
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYXrl2EbzVyxp2hV7c-mEnhK5ja19euwU",
  authDomain: "eggcatcher-31828.firebaseapp.com",
  projectId: "eggcatcher-31828",
  storageBucket: "eggcatcher-31828.firebasestorage.app",
  messagingSenderId: "835418629907",
  appId: "1:835418629907:android:30939b48089bdb6a625ce6",
};

// Initialize Firebase only once
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

// ---- Types ----

export interface PlayerProfile {
  id: string;
  name: string;
  email: string | null;
  avatar: string;
  highScore: number;
  gamesPlayed: number;
  createdAt: any;
  updatedAt: any;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  rank?: number;
}

// ---- Available Avatars ----

export const AVATAR_OPTIONS = [
  "🧑‍🌾",
  "👩‍🌾",
  "🤠",
  "😎",
  "🥳",
  "🧒",
  "👧",
  "👦",
  "🦊",
  "🐔",
  "🐣",
  "🐥",
  "🐤",
  "🦆",
  "🐓",
];

// ---- Auth Functions ----

export const FirebaseService = {
  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Sign in with Google ID token
  async signInWithGoogle(idToken: string): Promise<PlayerProfile | null> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const user = result.user;

      // Check if profile exists
      let profile = await this.getPlayerProfile(user.uid);

      if (!profile) {
        // Create new profile
        profile = {
          id: user.uid,
          name: user.displayName || "Player",
          email: user.email,
          avatar:
            AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)],
          highScore: 0,
          gamesPlayed: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await this.savePlayerProfile(profile);
      }

      return profile;
    } catch (error) {
      console.error("Google sign-in error:", error);
      return null;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  },

  // ---- Player Profile Functions ----

  // Get player profile
  async getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
    try {
      const docRef = doc(db, "players", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as PlayerProfile;
      }
      return null;
    } catch (error) {
      console.error("Get profile error:", error);
      return null;
    }
  },

  // Save player profile
  async savePlayerProfile(profile: PlayerProfile): Promise<void> {
    try {
      const docRef = doc(db, "players", profile.id);
      await setDoc(docRef, {
        ...profile,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Save profile error:", error);
    }
  },

  // Update player name
  async updatePlayerName(userId: string, name: string): Promise<void> {
    try {
      const docRef = doc(db, "players", userId);
      await updateDoc(docRef, {
        name,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Update name error:", error);
    }
  },

  // Update player avatar
  async updatePlayerAvatar(userId: string, avatar: string): Promise<void> {
    try {
      const docRef = doc(db, "players", userId);
      await updateDoc(docRef, {
        avatar,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Update avatar error:", error);
    }
  },

  // Update high score
  async updateHighScore(userId: string, score: number): Promise<boolean> {
    try {
      const profile = await this.getPlayerProfile(userId);
      if (!profile) return false;

      if (score > profile.highScore) {
        const docRef = doc(db, "players", userId);
        await updateDoc(docRef, {
          highScore: score,
          gamesPlayed: profile.gamesPlayed + 1,
          updatedAt: serverTimestamp(),
        });

        // Also update leaderboard
        await this.submitScore(userId, profile.name, profile.avatar, score);
        return true;
      } else {
        // Just increment games played
        const docRef = doc(db, "players", userId);
        await updateDoc(docRef, {
          gamesPlayed: profile.gamesPlayed + 1,
          updatedAt: serverTimestamp(),
        });
      }
      return false;
    } catch (error) {
      console.error("Update high score error:", error);
      return false;
    }
  },

  // ---- Leaderboard Functions ----

  // Submit score to leaderboard
  async submitScore(
    userId: string,
    name: string,
    avatar: string,
    score: number,
  ): Promise<void> {
    try {
      const docRef = doc(db, "leaderboard", userId);
      await setDoc(docRef, {
        id: userId,
        name,
        avatar,
        score,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Submit score error:", error);
    }
  },

  // Get top leaderboard entries
  async getLeaderboard(limitCount: number = 20): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, "leaderboard"),
        orderBy("score", "desc"),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: data.id,
          name: data.name,
          avatar: data.avatar,
          score: data.score,
          rank: entries.length + 1,
        });
      });

      return entries;
    } catch (error) {
      console.error("Get leaderboard error:", error);
      return [];
    }
  },

  // Get player rank
  async getPlayerRank(userId: string): Promise<number | null> {
    try {
      const leaderboard = await this.getLeaderboard(100);
      const index = leaderboard.findIndex((entry) => entry.id === userId);
      return index >= 0 ? index + 1 : null;
    } catch (error) {
      console.error("Get rank error:", error);
      return null;
    }
  },
};

export default FirebaseService;
