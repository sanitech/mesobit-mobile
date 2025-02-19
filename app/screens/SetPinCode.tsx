import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/Context/AuthContext";
import { router } from "expo-router";
import {
  setStorageItemAsync,
  getStorageItemAsync,
  removeStorageItemAsync,
} from "@/utils/storage";

const SetPinCodeScreen = () => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const styles = createStyles(isDarkMode);

  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [currentPinInput, setCurrentPinInput] = useState<string>("");
  const [newPin, setNewPin] = useState<string>("");
  const [confirmNewPin, setConfirmNewPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);

  useEffect(() => {
    const fetchCurrentPin = async () => {
      const storedPin = await getStorageItemAsync("userPin");
      setCurrentPin(storedPin);
    };

    fetchCurrentPin();
  }, []);

  const handleSetPin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      setError("PIN code must be 4 to 6 digits.");
      return;
    }
    if (newPin !== confirmNewPin) {
      setError("PIN codes do not match.");
      return;
    }

    try {
      await setStorageItemAsync("userPin", newPin);
      setError("");
      setNewPin("");
      setConfirmNewPin("");
      setCurrentPinInput("");
      Alert.alert("Success", "PIN code set successfully.");
      router.back();
    } catch (err) {
      setError("Failed to set PIN code.");
      console.error("Error setting PIN code:", err);
    }
  };

  const handleVerifyPin = async () => {
    if (!currentPinInput) {
      setError("Please enter your current PIN code.");
      return;
    }

    if (currentPinInput !== currentPin) {
      setError("Current PIN code is incorrect.");
      return;
    }

    setIsPinVerified(true);
    setCurrentPinInput("");
  };

  const handleRemovePin = async () => {
    try {
      await removeStorageItemAsync("userPin");
      setCurrentPin(null);
      setIsPinVerified(false);
      Alert.alert("Success", "PIN code removed successfully.");
      router.back();
    } catch (err) {
      setError("Failed to remove PIN code.");
      console.error("Error removing PIN code:", err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#121212" : "#fff"}
      />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isPinVerified ? "Set New PIN Code" : "Verify Current PIN Code"}
          </Text>
          <Text style={styles.description}>
            {isPinVerified
              ? "Enter a new 4 to 6-digit PIN code."
              : "Enter your current PIN code to verify."}
          </Text>
        </View>

        {!isPinVerified && currentPin && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Current PIN Code"
              value={currentPinInput}
              onChangeText={setCurrentPinInput}
              keyboardType="numeric"
              secureTextEntry={true}
              maxLength={6}
              placeholderTextColor={isDarkMode ? "#999" : "#666"}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleVerifyPin}
            >
              <Text style={styles.submitButtonText}>Verify PIN Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {(isPinVerified || !currentPin) && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter New PIN Code (4 to 6 digits)"
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="numeric"
              secureTextEntry={true}
              maxLength={6}
              placeholderTextColor={isDarkMode ? "#999" : "#666"}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New PIN Code (4 to 6 digits)"
              value={confirmNewPin}
              onChangeText={setConfirmNewPin}
              keyboardType="numeric"
              secureTextEntry={true}
              maxLength={6}
              placeholderTextColor={isDarkMode ? "#999" : "#666"}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSetPin}
            >
              <Text style={styles.submitButtonText}>Set PIN Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!isPinVerified && currentPin && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemovePin}
          >
            <Text style={styles.removeButtonText}>Remove PIN Code</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Dynamic styles based on theme
const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#fff",
      padding: 20,
    },
    header: {
      marginBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#000",
    },
    description: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#888",
      marginTop: 5,
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      height: 50,
      borderColor: isDarkMode ? "#444" : "#ddd",
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 15,
      backgroundColor: isDarkMode ? "#1e1e1e" : "#f9f9f9",
      color: isDarkMode ? "#fff" : "#000",
    },
    submitButton: {
      backgroundColor: "#007AFF",
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    removeButton: {
      backgroundColor: "#FF3B30",
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },
    removeButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    errorText: {
      color: "red",
      fontSize: 14,
      marginBottom: 15,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    backButtonText: {
      color: isDarkMode ? "#fff" : "#000",
      fontSize: 16,
      marginLeft: 5,
    },
  });

export default SetPinCodeScreen;
