import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from "react-native";
import { useAuth } from "@/Context/AuthContext";
import axios from "axios";

const ChangePasswordScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const styles = createStyles(isDarkMode);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (
      newPassword.length <
      parseInt(process.env.EXPO_PUBLIC_MIN_PASSWORD_LENGTH, 10)
    ) {
      return setError(
        `Password must be at least ${process.env.EXPO_PUBLIC_MIN_PASSWORD_LENGTH} characters.`
      );
    }

    try {
      const response = await axios.put(
        `/staff/${user?.staff_id}/change-password`,
        {
          currentPassword,
          newPassword,
        }
      );

      if (response.status === 200) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setSuccess("Password changed successfully!");
        }, 3000);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseError =
          error.response?.data?.message || "An unexpected error occurred.";
        setError(responseError);
      } else {
        setError("Network error, please try again later.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Current Password"
        placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleChangePassword}
      >
        <Text style={styles.submitButtonText}>Change Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? "#121212" : "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#000",
      marginBottom: 20,
    },
    input: {
      height: 40,
      borderColor: isDarkMode ? "#333" : "#eaeaea",
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
      marginBottom: 15,
      color: isDarkMode ? "#fff" : "#000",
    },
    submitButton: {
      backgroundColor: "#007AFF",
      padding: 15,
      borderRadius: 5,
      justifyContent: "center",
      alignItems: "center",
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    errorText: {
      color: "red",
      marginBottom: 15,
      textAlign: "center",
    },
    successText: {
      color: "green",
      marginBottom: 15,
      textAlign: "center",
    },
  });

export default ChangePasswordScreen;
