import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { NODE_LIVE_URL } from "../filesUrl";

const baseQuery = fetchBaseQuery({
  baseUrl: NODE_LIVE_URL,
  timeout: 30000,
  prepareHeaders: async (headers) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("Authorization", token);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    } catch (error) {
      console.error("Error getting token from storage:", error);
      return headers;
    }
  },
});

const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    console.log("Unauthorized - clearing token");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: [],
  endpoints: () => ({}),
});
