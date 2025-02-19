import { AuthProvider } from "@/Context/AuthContext";
import { getStorageItemAsync } from "@/utils/storage";
import axios from "axios";
import { Stack } from "expo-router";
import React, { useEffect } from "react";

export default function Layout() {
  useEffect(() => {
    const setAxiosDefaults = async () => {
      // Set base URL
      axios.defaults.baseURL = process.env.EXPO_PUBLIC_MY_API;
      axios.defaults.withCredentials = true;

      // Set default headers
      axios.defaults.headers.common["Accept"] = "application/json";
      axios.defaults.headers.common["Content-Type"] = "application/json";

      // Set auth token if exists
      const token = await getStorageItemAsync("userToken");
      if (token) {
        axios.defaults.headers.common["Authorization"] = token;
      }
    };

    setAxiosDefaults();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SplashScreenComponent" />
      </Stack>
    </AuthProvider>
  );
}
