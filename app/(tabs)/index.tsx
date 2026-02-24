import { useLoginMutation } from "@/api/authApi";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Index = () => {
  const [login] = useLoginMutation();

  const handleLogin = async () => {
    try {
      const result = await login({
        email: "user@example.com",
        password: "password",
      });
      console.log("Login result:", result);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-100 to-blue-300 items-center justify-center p-6">
      <View className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md items-center">
        <Text className="text-lg text-gray-800 mb-2">NILOY ROY</Text>
        <Text className="text-base text-gray-500 mb-4 text-center">
          I am a driven and dedicated Senior Backend Developer with a passion
          for creating efficient and effective web applications. I strive to
          deliver high-quality and user-friendly web app that meets the needs of
          clients and end-users. Lets work together to bring your next project
          to life.
        </Text>
        <View className="flex-row space-x-2 mt-2">
          <View className="w-6 h-6 rounded-full bg-blue-400" />
          <View className="w-6 h-6 rounded-full bg-green-400" />
          <View className="w-6 h-6 rounded-full bg-pink-400" />
        </View>
      </View>

      <View>
        <TouchableOpacity onPress={handleLogin}>
          <Text className="text-blue-500 font-semibold">Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Index;
