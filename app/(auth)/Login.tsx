import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import axios, { AxiosError } from "axios"; // Import axios and AxiosError
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { useAuth } from "@/Context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [errorMessage, setErrorMessage] = useState(""); // Add errorMessage state
  const [showPassword, setShowPassword] = useState(false); // Add showPassword state
  const { signIn } = useAuth();
  const isDarkMode = useColorScheme() === "dark";

  const handleLogin = async () => {
    setIsLoading(true); // Set isLoading to true when login starts
    setErrorMessage(""); // Clear previous error message
    const username = !email.includes("staff-") ? `staff-${email}` : email;
    try {
      const response = await axios.post("/auth/staff", {
        username,
        password_hash: password,
      });
      await signIn(response.data);
      console.log("Logged in successfully:", response.data);
      // Handle successful login, e.g., navigation or state update
    } catch (error) {
      console.error("Login failed:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.response?.data?.message) {
        setErrorMessage(axiosError.response.data.message);
        console.log(axiosError.response.data);
      } else if (!axiosError.response) {
        // Handle network error
        setErrorMessage("Please check your internet connection.");
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false); // Set isLoading to false when login ends
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar
        backgroundColor={isDarkMode ? "#000000" : "#ffffff"}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <ThemedView style={styles.container}>
        <Image
          source={require("../../assets/images/loginscreentop.png")}
          style={styles.loginscreentopImage}
        />
        {/* <Image
          source={require("../assets/images/loginscreenbottom.png")}
          style={styles.loginscreenbottomImage}
        /> */}

        <View style={{ flexDirection: "row", padding: 0 }}>
          <ThemedText style={styles.title}>Welcome Back, Mesobit!</ThemedText>
          <View style={{ flex: 1 }}></View>
        </View>
        <ThemedText style={styles.subtitle}>
          An all-in-one cafe and restaurant management system designed to
          streamline operations, enhance customer engagement, and empower your
          staff.
        </ThemedText>

        <ThemedTextInput
          style={styles.input}
          placeholder="Username or Staff ID"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={"#ced4da"}
          autoCapitalize="none"
        />

        <View style={styles.passwordInputContainer}>
          <ThemedTextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={"#ced4da"}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIconContainer}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialCommunityIcons
              name="eye"
              style={styles.eyeIcon}
              size={22}
              color={isDarkMode ? "#ffffff" : "#000000"}
            />
          </TouchableOpacity>
        </View>

        {errorMessage ? ( // Display error message if it exists
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}

        <TouchableOpacity
          onPress={() => console.log("Forgot Password")}
          style={styles.forgotPasswordContainer}
        >
          <ThemedText style={styles.forgotPassword}>
            Forgot password?
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading} // Disable button when loading
        >
          <ThemedText style={styles.loginButtonText}>
            {isLoading ? <ActivityIndicator /> : "Login"}{" "}
            {/* Change button text based on isLoading */}
          </ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.signupText}>
          Simplify Your Restaurant Operations with Mesobit!
          <ThemedText style={styles.additionalSignupText}>
            {" "}
            Streamline your processes and enhance your dining experience.
          </ThemedText>
        </ThemedText>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 70,
    position: "relative",
  },
  loginscreentopImage: {
    position: "absolute",
    top: -40,
    right: -20,
    zIndex: 1,
    width: 200,
    height: 200,
  },
  loginscreenbottomImage: {
    position: "absolute",
    bottom: -10,
    left: -10,
    zIndex: -1,
    width: 300,
    height: 250,
    resizeMode: "cover",
  },
  title: {
    fontSize: 46,
    lineHeight: 46,
    fontWeight: "bold",
    fontFamily: "SpaceMono",
    width: 200,
    zIndex: 1,
  },
  subtitle: {
    color: "#6c757d",
    marginBottom: 20,
    marginTop: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  eyeIconContainer: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 10,
  },
  eyeIcon: {
    width: 24,
    height: 24,
  },
  forgotPasswordContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: -10,
  },
  forgotPassword: {
    color: "#007bff",
    marginBottom: 20,
    textAlign: "right",
    width: "100%",
  },
  loginButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#000",
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 10,
  },
  loginButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  signupText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
  },
  additionalSignupText: {
    textAlign: "center",
    color: "#495057",
    fontSize: 14,
  },
  signupLink: {
    color: "#007bff",
  },
  errorText: {
    color: "#ff0000", // Red color for error message
    marginBottom: 10,
    textAlign: "center",
    width: "100%",
  },
});
