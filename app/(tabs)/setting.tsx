import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useColorScheme,
  Appearance,
  ScrollView,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/Context/AuthContext";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import { ThemedView } from "@/components/ThemedView";
import { Image } from "expo-image";

// Add role-specific menu items
const ROLE_MENU_ITEMS = {
  cashier: [
    {
      id: "sales",
      title: "Sales History",
      icon: "cash-register",
      description: "View your sales transactions",
      route: "/screens/sales-history",
    },
    {
      id: "payments",
      title: "Payment Methods",
      icon: "credit-card-outline",
      description: "Manage payment options",
      route: "/screens/payment-methods",
    },
    {
      id: "shifts",
      title: "My Shifts",
      icon: "clock-outline",
      description: "View your work schedule",
      route: "/screens/shifts",
    },
  ],
  kitchen: [
    {
      id: "recipes",
      title: "Recipes",
      icon: "book-open-variant",
      description: "View cooking instructions",
      route: "/screens/recipes",
    },
    {
      id: "inventory",
      title: "Kitchen Inventory",
      icon: "fridge-outline",
      description: "Check stock levels",
      route: "/screens/kitchen-inventory",
    },
    {
      id: "prep",
      title: "Prep Lists",
      icon: "format-list-checks",
      description: "Daily preparation tasks",
      route: "/screens/prep-lists",
    },
  ],
  waiter: [
    {
      id: "tables",
      title: "My Tables",
      icon: "table-furniture",
      description: "View assigned tables",
      route: "/screens/my-tables",
    },
    {
      id: "tips",
      title: "My Tips",
      icon: "cash-multiple",
      description: "Track your earnings",
      route: "/screens/my-tips",
    },
    {
      id: "schedule",
      title: "Work Schedule",
      icon: "calendar-clock",
      description: "View your shifts",
      route: "/screens/schedule",
    },
  ],
  owner: [
    {
      id: "analytics",
      title: "Business Analytics",
      icon: "chart-box-outline",
      description: "View business performance",
      route: "/screens/analytics",
    },
    {
      id: "staff",
      title: "Staff Management",
      icon: "account-group",
      description: "Manage employees",
      route: "/screens/staff",
    },
    {
      id: "reports",
      title: "Financial Reports",
      icon: "file-chart",
      description: "View financial statements",
      route: "/screens/reports",
    },
  ],
} as const;

const SettingsScreen = () => {
  const { signOut, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const styles = createStyles(isDarkMode);

  // State to store the selected image
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const renderRoleMenuItems = () => {
    const roleItems =
      ROLE_MENU_ITEMS[
        user?.position.toLowerCase() as keyof typeof ROLE_MENU_ITEMS
      ] || [];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {roleItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() => router.push(item.route as any)}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
            <Text style={styles.itemText}>{item.title}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Function to pick an image from the device
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      console.log(result.assets[0].uri);
      setSelectedImage(result.assets[0 as any].uri);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Profile Section */}
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#121212" : "#fff"}
      />
      <ScrollView>
        <View>
          <View style={styles.profileContainer}>
            <TouchableOpacity
              onPress={pickImage}
              style={{ position: "relative" }}
            >
              <Image
                source={{
                  uri:
                    selectedImage ||
                    "https://cdn.pixabay.com/photo/2017/10/10/00/49/female-2835524_1280.jpg", // Use selected image if available
                }}
                style={styles.profileImage}
                cachePolicy={"memory"}
              />
              <MaterialCommunityIcons
                name="pencil"
                size={22}
                color={"white"}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: isDarkMode ? "#121212" : "#fff",
                  padding: 5,
                  borderRadius: 15,
                }}
              />
            </TouchableOpacity>

            <Text style={styles.nameText}>{user?.full_name}</Text>
            <Text style={styles.emailText}>{user?.position}</Text>
            {/* Edit Profile Button */}
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push("/screens/EditProfileScreen")}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderRoleMenuItems()}

        {/* Inventories Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push("/screens/ChangePassword")}
          >
            <MaterialCommunityIcons
              name="lock-reset" // Example icon name
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
            <Text style={styles.itemText}>Change Password</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push("/screens/SupportScreen")}
          >
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
            <Text style={styles.itemText}>Support</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.item}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
            <Text style={styles.itemText}>Push Notifications</Text>
            <Switch value={true} />
          </View>

          {/* <View style={styles.item}>
            <MaterialCommunityIcons
              name="face-recognition"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
            <Text style={styles.itemText}>Face ID</Text>
            <Switch value={true} />
          </View> */}

          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push("/screens/SetPinCode")}
          >
            <MaterialCommunityIcons
              name="key-outline"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
            <Text style={styles.itemText}>PIN Code</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        </View>

        {/* Dark Mode Toggle */}
        <View style={styles.section}>
          <View style={styles.item}>
            <MaterialCommunityIcons
              name="theme-light-dark"
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
            <Text style={styles.itemText}>Dark Mode</Text>
            <Switch value={isDarkMode} />
          </View>
        </View>

        {/* Logout Section */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()}>
          <MaterialCommunityIcons name="logout" size={24} color="red" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.developerText}>
            Powered by IX-IT & Marketing Solution
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

// Dynamic styles based on theme
const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    profileContainer: {
      alignItems: "center",
      marginBottom: 30,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
    },
    nameText: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#000",
    },
    emailText: {
      color: isDarkMode ? "gray" : "darkgray",
      marginBottom: 10,
    },
    editProfileButton: {
      backgroundColor: isDarkMode ? "#fff" : "#000",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 40,
    },
    editProfileText: {
      color: isDarkMode ? "#000" : "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    section: {
      backgroundColor: isDarkMode ? "#1F2937" : "#f9f9f9",
      borderRadius: 10,
      padding: 10,
      marginBottom: 20,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#eaeaea",
    },
    itemText: {
      fontSize: 16,
      marginLeft: 10,
      flex: 1,
      color: isDarkMode ? "#fff" : "#000",
    },
    notificationBubble: {
      backgroundColor: "green",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 2,
    },
    notificationText: {
      color: "#fff",
      fontWeight: "bold",
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    logoutText: {
      color: "red",
      fontSize: 16,
      marginLeft: 10,
      fontWeight: "bold",
    },
    bottomSection: {
      marginTop: 30,
      alignItems: "center",
    },
    versionText: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "gray",
      marginBottom: 5,
    },
    developerText: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "gray",
      fontStyle: "italic",
    },
    menuSection: {
      // padding: 16,
      backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#D1D5DB" : "#4B5563",
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#374151" : "#E5E7EB",
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
    },
    menuItemContent: {
      marginLeft: 12,
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: isDarkMode ? "#F9FAFB" : "#111827",
      marginBottom: 2,
    },
    menuItemDescription: {
      fontSize: 14,
      color: isDarkMode ? "#9CA3AF" : "#6B7280",
    },
  });

export default SettingsScreen;
