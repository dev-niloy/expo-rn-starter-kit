import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import "react-native-reanimated";
import "../global.css";

// Suppress deprecation warning from react-native-css-interop (NativeWind internals)
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

export default function RootLayout() {
  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="game" options={{ gestureEnabled: false }} />
          <Stack.Screen name="gameover" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="leaderboard"
            options={{ animation: "slide_from_right" }}
          />
        </Stack>
      </SafeAreaView>
      <StatusBar style="auto" />
    </>
  );
}
