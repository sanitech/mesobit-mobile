import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Linking,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const SupportScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const styles = createStyles(isDarkMode);
  const router = useRouter();

  const handleEmailSupport = () => {
    Linking.openURL("mailto:ixsolutions01@gmail.com");
  };

  const handleCallSupport = () => {
    Linking.openURL("tel:+251962018602");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#121212" : "#fff"}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Support</Text>
        <Text style={styles.description}>
          If you need any help, please reach out to us using the options below:
        </Text>

        <TouchableOpacity style={styles.option} onPress={handleEmailSupport}>
          <MaterialCommunityIcons
            name="email-outline"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text style={styles.optionText}>Email Support</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleCallSupport}>
          <MaterialCommunityIcons
            name="phone-outline"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text style={styles.optionText}>Call Support</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/screens/FAQScreen")}
        >
          <MaterialCommunityIcons
            name="text-box-outline"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text style={styles.optionText}>FAQs</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const createStyles = (isDarkMode: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#fff",
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#000",
      marginBottom: 20,
    },
    description: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#666",
      marginBottom: 20,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#eaeaea",
    },
    optionText: {
      fontSize: 16,
      marginLeft: 10,
      flex: 1,
      color: isDarkMode ? "#fff" : "#000",
    },
  });

export default SupportScreen;
