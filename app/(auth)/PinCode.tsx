import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import { getStorageItemAsync } from "@/utils/storage"; // Assumed utility function for storage

const Pincode = () => {
  const [pin, setPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [isIncorrect, setIsIncorrect] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const styles = createStyles(isDarkMode, isIncorrect);
  const router = useRouter();

  useEffect(() => {
    const fetchPin = async () => {
      const userPin = await getStorageItemAsync("userPin");
      setCurrentPin(userPin || "");
    };
    fetchPin();
  }, []);

  const handlePress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setIsIncorrect(false);
      if (newPin.length === currentPin.length) {
        handleSubmit(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setIsIncorrect(false);
  };

  const handleSubmit = async (enteredPin) => {
    if (enteredPin === currentPin) {
      router.push("/home"); // Redirect to home screen
    } else {
      setPin("");
      setIsIncorrect(true);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar backgroundColor={isDarkMode ? "#121212" : "#fff"} />
      <MaterialCommunityIcons
        name="lock"
        size={48}
        color={isDarkMode ? "#fff" : "#000"}
        style={styles.lockIcon}
      />
      <ThemedText style={styles.instruction}>Enter your PIN</ThemedText>
      <ThemedView style={styles.pinContainer}>
        {Array.from({ length: currentPin.length }, (_, index) => (
          <View
            key={index}
            style={[
              styles.pinCircle,
              pin.length > index ? styles.filledPinCircle : null,
            ]}
          />
        ))}
      </ThemedView>
      {isIncorrect && (
        <ThemedText style={styles.errorText}>
          Incorrect PIN. Please try again.
        </ThemedText>
      )}
      <ThemedView style={styles.numberContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, index) => (
          <TouchableOpacity
            key={index}
            style={styles.numberButton}
            onPress={() => handlePress(num)}
          >
            <Text style={styles.numberText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.numberButton} onPress={handleDelete}>
          <MaterialCommunityIcons
            name="backspace"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.numberButton} onPress={handleDelete}>
          <MaterialCommunityIcons
            name="check"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </ThemedView>
      <ThemedText style={styles.footerText}>
        This keeps your account secure.
      </ThemedText>
    </ThemedView>
  );
};

export default Pincode;

const createStyles = (isDarkMode, isIncorrect) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: isDarkMode ? "#121212" : "#fff",
    },
    lockIcon: {
      marginBottom: 20,
    },
    instruction: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 30,
      color: isDarkMode ? "#fff" : "#000",
    },
    pinContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "60%",
      marginBottom: 20,
    },
    pinCircle: {
      width: 15,
      height: 15,
      borderRadius: 7.5,
      borderWidth: 1,
      borderColor: isIncorrect ? "red" : isDarkMode ? "#fff" : "#000",
    },
    filledPinCircle: {
      backgroundColor: isIncorrect ? "red" : isDarkMode ? "#fff" : "#000",
    },
    errorText: {
      color: "red",
      marginBottom: 10,
    },
    numberContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      width: "80%",
      marginBottom: 20,
    },
    numberButton: {
      width: 70,
      height: 70,
      justifyContent: "center",
      alignItems: "center",
      margin: 8,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 50,
      backgroundColor: isDarkMode ? "#333" : "#fff",
    },
    numberText: {
      fontSize: 24,
      color: isDarkMode ? "#fff" : "#000",
    },
    footerText: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      marginTop: 20,
    },
  });
