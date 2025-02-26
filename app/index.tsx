import React, { useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import "./utils/backgroundTask"; // Ensure the task is registered
import {
  Image,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from "react-native";

const Index = () => {
  const themed = useColorScheme();
  const logo =
    themed === "dark"
      ? require("../assets/images/splash-icon-light.png")
      : require("../assets/images/splash-icon-dark.png");

  useEffect(() => {
    const registerBackgroundFetch = async () => {
      try {
        // Check the status of background fetch
        const status = await BackgroundFetch.getStatusAsync();
        if (
          status === BackgroundFetch.Status.Restricted ||
          status === BackgroundFetch.Status.Denied
        ) {
          console.warn("Background fetch is not enabled in your app.");
          return;
        }

        // Schedule the background fetch
        await BackgroundFetch.scheduleTaskAsync({
          taskName: "BACKGROUND_SYNC_TASK",
          delay: 15 * 60 * 1000, // 15 minutes
          minimumInterval: 15 * 60, // 15 minutes
          stopOnTerminate: false, // Keep running after app is terminated
          startOnBoot: true, // Start on device boot
        });
      } catch (error) {
        console.error("Failed to register background fetch:", error);
      }
    };

    registerBackgroundFetch();
  }, []);

  return (
    <ThemedView
      style={{ justifyContent: "center", alignItems: "center", flex: 1 }}
    >
      <Image source={logo} style={{ width: 250, height: 250 }} />
      <ActivityIndicator />
    </ThemedView>
  );
};

export default Index;

const styles = StyleSheet.create({});
