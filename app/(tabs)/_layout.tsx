import { router, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";
import { Appearance, useColorScheme } from "react-native";

// Define theme colors
const COLORS = {
  light: {
    primary: '#FF922E',
    background: '#FFFFFF',
    tabBar: '#FFFFFF',
    text: '#1F2937',
    inactive: '#6B7280',
    border: '#E5E7EB'
  },
  dark: {
    primary: '#FF922E',
    background: '#1F2937',
    tabBar: '#111827',
    text: '#F3F4F6',
    inactive: '#9CA3AF',
    border: '#374151'
  }
};

export default function Layout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.inactive,
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="space-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="reorder" size={size} color={color} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="AddOrder"
        options={{
          title: "Add Order",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="setting"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
