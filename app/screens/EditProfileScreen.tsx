import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/Context/AuthContext";
import axios from "axios"; // Make sure axios is installed and imported
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const EditProfileScreen = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.date_of_birth || "");
  const [username, setUsername] = useState(user?.username || "");
  const [contactNumber, setContactNumber] = useState(
    user?.contact_number || ""
  );
  const [address, setAddress] = useState(user?.address || "");
  const [emergencyContact, setEmergencyContact] = useState(
    user?.emergency_contact || ""
  );
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const styles = createStyles(isDarkMode);

  const handleSaveChanges = async () => {
    try {
      const response = await axios.put(`/staff/${user?.staff_id}`, {
        full_name: name,
        email,
        date_of_birth: dateOfBirth,
        username,
        contact_number: contactNumber,
        address,
        emergency_contact: emergencyContact,
      });

      if (response.status === 200) {
        const userInfo = await AsyncStorage.getItem("userInfo");
        const parsedUserInfo = JSON.parse(userInfo);
        const newUserInfo = {
          ...parsedUserInfo,
          full_name: name,
          email,
          date_of_birth: dateOfBirth,
          username,
          contact_number: contactNumber,
          address,
          emergency_contact: emergencyContact,
        };
        await AsyncStorage.setItem("userInfo", JSON.stringify(newUserInfo));

        alert("Profile updated successfully!");
        router.back();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="account"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="email"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="calendar"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="account-outline"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="phone"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="home"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="account-outline"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Emergency Contact"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
          keyboardType="phone-pad"
        />
      </View>

      {/* Adding staff_id field */}
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="numeric"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Staff ID"
          value={user?.staff_id || ""}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
          editable={false}
        />
      </View>

      {/* Adding position field */}
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="briefcase"
          size={24}
          color={isDarkMode ? "#AAA" : "#888"}
        />
        <TextInput
          style={styles.input}
          placeholder="Position"
          value={user?.position || ""}
          placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
          editable={false}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#FFFFFF" : "#000000",
      marginBottom: 20,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
      borderWidth: 1,
      borderColor: isDarkMode ? "#333" : "#EAEAEA",
      borderRadius: 5,
      padding: 10,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      color: isDarkMode ? "#FFFFFF" : "#000000",
    },
    saveButton: {
      backgroundColor: "#007AFF",
      padding: 15,
      borderRadius: 5,
      alignItems: "center",
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default EditProfileScreen;
