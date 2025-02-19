import {
  ActivityIndicator,
  Image,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import React from "react";
import { ThemedView } from "@/components/ThemedView";

const Index = () => {
  const themed = useColorScheme();
  const logo = themed === "dark" 
    ? require("../assets/images/splash-icon-light.png")
    : require("../assets/images/splash-icon-dark.png");

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
