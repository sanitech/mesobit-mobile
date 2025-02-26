import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  RefreshControl,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { ThemedView } from "@/components/ThemedView";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import axios from "axios";
import Header from "@/components/Header";
import { router } from "expo-router";
import { getDashboardStats } from "@/utils/sqliteHelper";
import { syncManager } from "../utils/syncManager";

// Define theme colors
const COLORS = {
  primary: "#FF922E",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  dark: "#1F2937",
  light: "#F3F4F6",
  white: "#FFFFFF",
  gray: "#6B7280",
  statusColors: {
    Pending: "#F59E0B", // Warning orange
    "In Progress": "#3B82F6", // Processing blue
    Ready: "#22C55E", // Success green
    cancelled: "#EF4444", // Error red
  } as Record<string, string>,
};

// Update the type definition to match the actual status values
type OrderStatus = "pending" | "in progress" | "ready" | "cancelled";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  activeOrders: number;
  popularItems: Array<{ name: string; count: number }>;
  recentOrders: Array<{
    type: string;
    time: string;
    status: OrderStatus;
    table?: string;
  }>;
}

// Update route type to match your file structure
type RouteNames =
  | "/screens/TodayOrders"
  | "/screens/revenue"
  | "/screens/pendingOrders"
  | "/screens/PreparingOrders";

const Dashboard = () => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    activeOrders: 0,
    popularItems: [],
    recentOrders: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    if (!user?.vendor_id) return;

    try {
      const response = await getDashboardStats(user.vendor_id, user.staff_id);
      console.log(response);
      setStats(response);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
    await syncManager.syncDataWithRetry();
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user?.vendor_id]);

  // Update the StatCard component
  const StatCard = ({ title, value, icon, color }: any) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        { backgroundColor: isDark ? COLORS.dark : COLORS.white },
      ]}
      onPress={() => {
        if (title === "Today's Revenue") return;
        const route: RouteNames =
          title === "Today's Orders"
            ? "/screens/TodayOrders"
            : title === "Pending Orders"
            ? "/screens/pendingOrders"
            : "/screens/PreparingOrders";
        router.push(route);
      }}
      activeOpacity={title === "Today's Revenue" ? 1 : 0.6}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text
          style={[
            styles.statValue,
            { color: isDark ? COLORS.white : COLORS.dark },
          ]}
        >
          {title.includes("Revenue") ? `${Number(value) || 0} ETB` : value || 0}
        </Text>
        <Text
          style={[
            styles.statTitle,
            { color: isDark ? COLORS.gray : "#6B7280" },
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Header title="Smart Restaurant Dashboard" />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]} // Android
            tintColor={COLORS.primary} // iOS
          />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard
            title="Today's Orders"
            value={stats.todayOrders}
            icon="food"
            color={COLORS.primary}
          />
          <StatCard
            title="Today's Revenue"
            value={stats.todayRevenue}
            icon="cash"
            color={COLORS.success}
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon="clock-outline"
            color={COLORS.warning}
          />
          <StatCard
            title="Active Orders"
            value={stats.activeOrders}
            icon="progress-clock"
            color={COLORS.info}
          />
        </View>

        {/* Popular Items Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? COLORS.dark : COLORS.white },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? COLORS.white : COLORS.dark },
            ]}
          >
            Popular Items
          </Text>
          {stats.popularItems.map((item, index) => (
            <View key={index} style={styles.popularItem}>
              <MaterialCommunityIcons
                name="food"
                size={20}
                color={COLORS.primary}
              />
              <Text
                style={[
                  styles.itemName,
                  { color: isDark ? COLORS.white : COLORS.dark },
                ]}
              >
                {item.name}
              </Text>
              <Text style={styles.itemCount}>{item.count} orders</Text>
            </View>
          ))}
        </View>

        {/* Recent Orders Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? COLORS.dark : COLORS.white },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? COLORS.white : COLORS.dark },
            ]}
          >
            Recent Orders
          </Text>
          {stats.recentOrders.map((order, index) => (
            <TouchableOpacity
              onPress={() =>
                router.push(`/screens/OrderDetail?order_id=${order.orderId}`)
              }
              key={index}
              style={styles.recentOrder}
            >
              <View style={styles.orderInfo}>
                <MaterialCommunityIcons
                  name={
                    order.type === "Dine In"
                      ? "food-fork-drink"
                      : order.type === "Take Away"
                      ? "shopping-outline"
                      : "truck-delivery-outline"
                  }
                  size={20}
                  color={COLORS.statusColors[order.status] || COLORS.primary}
                />
                <View>
                  <Text
                    style={[
                      styles.orderType,
                      { color: isDark ? COLORS.white : COLORS.dark },
                    ]}
                  >
                    {order.type}
                  </Text>
                  {order.table && (
                    <Text style={styles.tableNumber}>Table {order.table}</Text>
                  )}
                </View>
              </View>
              <View style={styles.orderStatus}>
                <Text style={[styles.orderTime]}>{order.time}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        COLORS.statusColors[order.status]?.concat("15") ||
                        COLORS.primary + "15",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          COLORS.statusColors[order.status] || COLORS.primary,
                      },
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: -5,
  },
  statCard: {
    width: (Dimensions.get("window").width - 44) / 2,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
  },
  section: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  popularItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
  },
  itemCount: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  recentOrder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orderType: {
    fontSize: 16,
    fontWeight: "500",
  },
  tableNumber: {
    color: COLORS.gray,
  },
  orderStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderTime: {
    color: COLORS.gray,
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default Dashboard;
