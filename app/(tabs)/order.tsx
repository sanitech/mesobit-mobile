import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useAuth } from "@/Context/AuthContext";
import {
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import Header from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { getOrdersToday } from "@/utils/sqliteHelper";

// Color palette
const COLORS = {
  primary: "orange",
  success: "#22C55E",
  warning: "#9333EA",
  delivery: "#F59E0B",
  error: "#EF4444",
  info: "#475569",
  dark: "#1F2937",
  light: "#F3F4F6",
  white: "#FFFFFF",
  gray: "#6B7280",
} as const;

const STATUS_COLORS = {
  Pending: {
    bg: "#FEF3C7",
    text: "#D97706",
    icon: "clock-outline",
  },
  "In Progress": {
    bg: "#DBEAFE",
    text: "#2563EB",
    icon: "progress-clock",
  },
  Ready: {
    bg: "#D1FAE5",
    text: "#059669",
    icon: "check-circle-outline",
  },
  cancelled: {
    bg: "#FEE2E2",
    text: "#DC2626",
    icon: "close-circle-outline",
  },
  completed: {
    bg: "#F0FFF4",
    text: "#2F855A",
    icon: "check-circle", // Improved icon for completed status
  },
} as const;

interface Order {
  order_id: string;
  order_local_id: string;
  table_num: string;
  count_item: number;
  orderAt: string;
  order_type: keyof typeof ORDER_TYPE_CONFIG;
  status: keyof typeof STATUS_COLORS;
  items?: { item_name: string; count: number }[];
  total_price: number;
}

interface Filter {
  label: string;
  count: number;
  bgColor: string;
  textColor: string;
  badgeColor: string;
  value: string;
}

interface OrderStats {
  total: number;
  dineIn: number;
  takeAway: number;
  delivery: number;
  cancelled: number;
  filterValue: "all" | "Dine In" | "Take Away" | "Delivery" | "cancelled";
}

// Add this constant for order type icons and colors
const ORDER_TYPE_CONFIG = {
  "Dine In": {
    icon: "food-fork-drink",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  "Take Away": {
    icon: "shopping-outline",
    color: "#059669",
    bg: "#D1FAE5",
  },
  Delivery: {
    icon: "truck-delivery-outline",
    color: "#D97706",
    bg: "#FEF3C7",
  },
} as const;

const OrderLine = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    dineIn: 0,
    takeAway: 0,
    delivery: 0,
    cancelled: 0,
    filterValue: "all",
  });
  const colorScheme = useColorScheme();

  console.log(user?.vendor_id);
  const filters: Filter[] = [
    {
      label: "All",
      count: 0,
      bgColor: "#EBF8FF", // Light blue
      textColor: "#2B6CB0", // Blue
      badgeColor: "#2B6CB0",
      value: "all",
    },
    {
      label: "Dine In",
      count: 0,
      bgColor: "#F0FFF4", // Light green
      textColor: "#2F855A", // Green
      badgeColor: "#2F855A",
      value: "Dine In",
    },
    {
      label: "Take Away",
      count: 0,
      bgColor: "#FAF5FF", // Light purple
      textColor: "#6B46C1", // Purple
      badgeColor: "#6B46C1",
      value: "Take Away",
    },
    {
      label: "Delivery",
      count: 0,
      bgColor: "#FFFFF0", // Light yellow
      textColor: "#975A16", // Yellow
      badgeColor: "#975A16",
      value: "Delivery",
    },
    {
      label: "Cancelled",
      count: 0,
      bgColor: "#FFFAF0", // Light orange
      textColor: "#C05621", // Orange
      badgeColor: "#C05621",
      value: "cancelled",
    },
  ];

  const statCards = [
    {
      value: "all",
      label: "Total Orders",
      count: orderStats.total,
      color: COLORS.info,
      icon: "receipt-outline",
    },
    {
      value: "Dine In",
      label: "Dine In",
      count: orderStats.dineIn,
      color: COLORS.success,
      icon: "restaurant-outline",
    },
    {
      value: "Take Away",
      label: "Take Away",
      count: orderStats.takeAway,
      color: COLORS.warning,
      icon: "bag-handle-outline",
    },
    {
      value: "Delivery",
      label: "Delivery",
      count: orderStats.delivery,
      color: COLORS.delivery,
      icon: "bicycle-outline",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      count: orderStats.cancelled,
      color: COLORS.error,
      icon: "close-circle-outline",
    },
  ];

  const orderTypeColors = {
    "Dine In": { status: COLORS.success },
    "Take Away": { status: COLORS.warning },
    Delivery: { status: COLORS.delivery },
    cancelled: { status: COLORS.error },
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      // Fetch today's orders from the local database
      const cachedOrders = await getOrdersToday();
      console.log("Today's Orders:", cachedOrders);
      
      if (cachedOrders) {
        setOrders(cachedOrders);
      }

      // Optionally, you can also fetch fresh orders from the server
      const response = await axios.get(`/orders/vendor/${user?.vendor_id}`);
      const fetchedOrders = response.data;
      console.log("Fetched Orders:", fetchedOrders);

      // Sort orders by date
      const sortedOrders = [...fetchedOrders].sort(
        (a, b) => new Date(b.orderAt).getTime() - new Date(a.orderAt).getTime()
      );

      // Update cache and state
      await AsyncStorage.setItem("orders", JSON.stringify(sortedOrders));
      setOrders(sortedOrders);

      // Calculate stats
      const stats = calculateStats(sortedOrders);
      setOrderStats(stats);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (orders: Order[]): OrderStats => {
    return orders.reduce(
      (stats, order) => ({
        total: stats.total + 1,
        dineIn:
          stats.dineIn +
          (order.order_type === "Dine In" && order.status !== "cancelled"
            ? 1
            : 0),
        takeAway:
          stats.takeAway +
          (order.order_type === "Take Away" && order.status !== "cancelled"
            ? 1
            : 0),
        delivery:
          stats.delivery +
          (order.order_type === "Delivery" && order.status !== "cancelled"
            ? 1
            : 0),
        cancelled: stats.cancelled + (order.status === "cancelled" ? 1 : 0),
        filterValue: "all" as const,
      }),
      {
        total: 0,
        dineIn: 0,
        takeAway: 0,
        delivery: 0,
        cancelled: 0,
        filterValue: "all" as const,
      }
    );
  };

  useEffect(() => {
    if (user?.vendor_id) {
      fetchOrders();
    }
  }, [user?.vendor_id]);

  // Filter orders based on selected filter
  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "cancelled") return order.status === "cancelled";
    return order.order_type === selectedFilter && order.status !== "cancelled";
  });

  // Update filter counts
  const updatedFilters = filters.map((filter) => ({
    ...filter,
    count:
      filter.value === "all"
        ? orders.length
        : orders.filter((order) =>
            filter.value === "cancelled"
              ? order.status === "cancelled"
              : order.order_type === filter.value &&
                order.status !== "cancelled"
          ).length,
  }));

  // Improved renderOrder function
  const renderOrder = ({ item: order }: { item: Order }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(
          `/screens/OrderDetail?order_id=${order.order_id || order.orderAt}`
        )
      }
      style={[
        styles.orderCard,
        styles.elevatedCard,
        {
          backgroundColor: colorScheme === "dark" ? COLORS.dark : COLORS.light,
        },
      ]}
    >
      {/* Top Section */}
      <View style={styles.cardTop}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <View style={styles.orderIdBadge}>
            <ThemedText style={styles.orderId}>Order</ThemedText>
            <Text
              style={[
                styles.orderId,
                { color: colorScheme === "dark" ? COLORS.white : COLORS.gray },
              ]}
            >
              {order.order_local_id || order.order_id}
            </Text>
          </View>
          <View style={[styles.typeIndicator]}>
            <MaterialCommunityIcons
              name={ORDER_TYPE_CONFIG[order.order_type]?.icon}
              size={20}
              color={ORDER_TYPE_CONFIG[order.order_type]?.color}
            />
            <Text
              style={[{ color: ORDER_TYPE_CONFIG[order.order_type]?.color }]}
            >
              {order.order_type}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={[styles.statusBadge]}>
          <MaterialCommunityIcons
            name={STATUS_COLORS[order.status]?.icon}
            size={18}
            color={STATUS_COLORS[order.status]?.text}
            style={{
              backgroundColor: STATUS_COLORS[order.status]?.bg,
              borderRadius: 50,
              padding: 5,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 4,
            }}
          />
          <View style={{}}>
            <Text
              style={[
                styles.typeText,
                {
                  textTransform: "uppercase",
                  color: STATUS_COLORS[order.status]?.text,
                },
              ]}
            >
              status
            </Text>
            <Text
              style={[
                styles.statusText,
                {
                  textTransform: "uppercase",
                  color: STATUS_COLORS[order.status]?.text,
                },
              ]}
            >
              {order.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Order Type Section */}
      <View style={styles.typeSection}></View>

      {/* Items Preview */}
      <View
        style={[
          styles.itemsPreview,
          // { backgroundColor: colorScheme === "dark" ? "#374151" : "#F9FAFB" },
        ]}
      >
        <View style={styles.itemsHeader}>
          <View style={styles.itemsCount}>
            <MaterialCommunityIcons
              name="food-variant"
              size={18}
              color={colorScheme === "dark" ? COLORS.white : COLORS.gray}
            />
            <Text
              style={[
                styles.countText,
                { color: colorScheme === "dark" ? COLORS.white : COLORS.gray },
              ]}
            >
              {order.count_item} items
            </Text>
          </View>
          {order.order_type === "Dine In" && (
            <View style={styles.tableInfo}>
              <MaterialCommunityIcons
                name="table-furniture"
                size={18}
                color={colorScheme === "dark" ? COLORS.white : COLORS.gray}
              />
              <Text
                style={[
                  styles.tableText,
                  {
                    color: colorScheme === "dark" ? COLORS.white : COLORS.gray,
                  },
                ]}
              >
                Table {order.table_num}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.priceText,
              { color: colorScheme === "dark" ? "#A2CA9C" : "#059669" },
            ]}
          >
            ETB {order.total_price}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar backgroundColor={"#FF922E"} />
      <Header title="" />

      {/* Header with Stats */}
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          {statCards.map((card) => (
            <TouchableOpacity
              key={card.value}
              onPress={() => setSelectedFilter(card.value)}
              style={[
                styles.statCard,
                { backgroundColor: card.color },
                selectedFilter === card.value && styles.selectedStatCard,
              ]}
            >
              <View style={styles.statCardContent}>
                <Ionicons name={card.icon} size={24} color="white" />
                <Text style={styles.statNumber}>{card.count}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </View>
              {selectedFilter === card.value && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.order_id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchOrders} />
        }
        contentContainerStyle={styles.orderList}
      />

      {/* Floating Action Button */}
          <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/addOrder")}
      >
        <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterHeader: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterList: {
    padding: 10,
  },
  filterButton: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  filterButtonActive: {
    borderWidth: 2,
  },
  filterText: {
    fontWeight: "600",
    fontSize: 14,
  },
  filterCount: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  orderList: {
    padding: 10,
    paddingBottom: 80, // Add padding to avoid FAB overlap
  },
  orderCard: {
    margin: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  elevatedCard: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary, // Use primary color for order ID
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 13,
    color: (colorScheme) =>
      colorScheme === "dark" ? COLORS.white : COLORS.gray,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  typeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  typeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    // paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.8,
  },
  tableInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tableText: {
    fontSize: 14,
  },
  itemsPreview: {
    borderRadius: 12,
    padding: 0,
    // backgroundColor: (colorScheme) =>
    //   colorScheme === "dark" ? "#374151" : "#F9FAFB", // Light background for items preview
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8, // Add some space between header and list
  },
  itemsCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  countText: {
    fontSize: 14,
    color: (colorScheme) =>
      colorScheme === "dark" ? COLORS.white : COLORS.gray,
    fontWeight: "500",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantity: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF922E",
    minWidth: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: (colorScheme) =>
      colorScheme === "dark" ? COLORS.white : COLORS.gray,
  },
  moreItems: {
    fontSize: 13,
    color: (colorScheme) =>
      colorScheme === "dark" ? COLORS.white : COLORS.gray,
    fontStyle: "italic",
    marginTop: 4,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    marginTop: -60,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  statCard: {
    width: Dimensions.get("window").width * 0.35,
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    position: "relative",
    overflow: "hidden",
  },
  selectedStatCard: {
    borderWidth: 2,
    borderColor: "white",
  },
  statCardContent: {
    alignItems: "center",
    gap: 8,
  },
  selectedIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "white",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
  },
});

export default OrderLine;
