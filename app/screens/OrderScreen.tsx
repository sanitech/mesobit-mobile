import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import Header from "@/components/Header";
import { useColorScheme } from "react-native";
import { useAuth } from "@/Context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getOrdersOnDay } from "@/utils/sqliteHelper";
interface Order {
  order_id: string;
  order_local_id: string;
  table_num: string;
  count_item: number;
  orderAt: string;
  order_type: "Dine In" | "Take Away" | "Delivery";
  status: "Pending" | "In Progress" | "Ready" | "cancelled";
}

interface OrderScreenProps {
  type: "today" | "pending" | "preparing";
  title: string;
}

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
    bg: "#D1FAE5",
    text: "#059669",
    icon: "check-circle-outline",
  },
} as const;

const COLORS = {
  primary: "#FF922E",
  statusColors: {
    Pending: "#F59E0B",
    "In Progress": "#3B82F6",
    Ready: "#22C55E",
    cancelled: "#EF4444",
  },
};

const calculateStats = (orders: Order[]) => {
  return {
    total: orders.length,
    pending: orders.filter((order) => order.status === "Pending").length,
    inProgress: orders.filter((order) => order.status === "In Progress").length,
    ready: orders.filter((order) => order.status === "Ready").length,
    completed: orders.filter((order) => order.status === "completed").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
  };
};

const filterOrdersByType = (
  orders: Order[],
  screenType: "today" | "pending" | "preparing"
) => {
  const today = new Date().toISOString().split("T")[0];

  return orders.filter((order) => {
    const orderDate = new Date(order.orderAt).toISOString().split("T")[0];

    switch (screenType) {
      case "today":
        return order;

      case "pending":
        return ["Pending"].includes(order.status);

      case "preparing":
        return ["In Progress", "Ready"].includes(order.status);

      default:
        return true;
    }
  });
};

const OrderScreen: React.FC<OrderScreenProps> = ({ type, title }) => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch orders from local storage
  const getLocalOrders = async () => {
    try {
      const storedOrders = await getOrdersOnDay(); // Fetch from SQLite
      return storedOrders || [];
    } catch (error) {
      console.error("Error reading from local storage:", error);
      return [];
    }
  };

  // // Function to save orders to AsyncStorage
  // const saveLocalOrders = async (orders: Order[]) => {
  //   try {
  //     await AsyncStorage.setItem("orders", JSON.stringify(orders));
  //   } catch (error) {
  //     console.error("Error saving to AsyncStorage:", error);
  //   }
  // };

  // // Function to fetch orders from API
  // const fetchOrdersFromAPI = async () => {
  //   try {
  //     const response = await axios.get(`/orders/vendor/${user?.vendor_id}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error fetching from API:", error);
  //     throw error;
  //   }
  // };

  // Main fetch function
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load local orders first
      const localOrders = await getLocalOrders();
      setOrders(localOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.vendor_id]);

  // Function to handle manual refresh
  const handleRefresh = () => {
    fetchOrders();
  };

  // Function to handle order status updates
  const handleOrderStatusUpdate = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      // Update locally first for immediate feedback
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Save to local storage
      const updatedOrders = orders.map((order) =>
        order.order_id === orderId ? { ...order, status: newStatus } : order
      );
      await saveLocalOrders(updatedOrders);

      // Update on server
      await axios.put(`/orders/${orderId}/status`, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
      // Revert local changes if API call fails
      fetchOrders();
    }
  };

  const getEmptyStateMessage = () => {
    switch (type) {
      case "today":
        return "No orders today";
      case "pending":
        return "No pending orders";
      case "preparing":
        return "No orders being prepared";
      default:
        return "No orders found";
    }
  };

  const renderOrder = ({ item: order }: { item: Order }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(
          `/screens/OrderDetail?order_id=${order.order_id || order.id}`
        )
      }
      style={[
        styles.orderCard,
        { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
      ]}
    >
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: STATUS_COLORS[order.status]?.bg },
        ]}
      >
        <MaterialCommunityIcons
          name={STATUS_COLORS[order.status]?.icon}
          size={16}
          color={STATUS_COLORS[order.status]?.text}
        />
        <Text
          style={[
            styles.statusText,
            { color: STATUS_COLORS[order.status]?.text },
          ]}
        >
          {order.status}
        </Text>
      </View>

      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text
            style={[styles.orderId, { color: isDark ? "#FFFFFF" : "#1F2937" }]}
          >
            {order.order_local_id || order.order_id}
          </Text>
          {type === "today" && (
            <Text style={styles.orderTime}>
              {new Date(order.orderAt).toLocaleTimeString()}
            </Text>
          )}
        </View>

        <View style={styles.orderType}>
          <MaterialCommunityIcons
            name={
              order.order_type === "Dine In"
                ? "food-fork-drink"
                : order.order_type === "Take Away"
                ? "shopping-outline"
                : "truck-delivery-outline"
            }
            size={20}
            color="#FF922E"
          />
          <Text style={styles.orderTypeText}>{order.order_type}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        {order.order_type === "Dine In" && (
          <View style={styles.detailItem}>
            <MaterialCommunityIcons
              name="table-furniture"
              size={18}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
            <Text style={styles.detailText}>Table {order.table_num}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="food"
            size={18}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text style={styles.detailText}>{order.count_item} items</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="cash"
            size={18}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text style={styles.detailText}>ETB {order.total_price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Header title={title} />
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF922E" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={64}
            color={isDark ? "#4B5563" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.emptyText,
              { color: isDark ? "#9CA3AF" : "#4B5563" },
            ]}
          >
            {getEmptyStateMessage()}
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.order_id || item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  orderType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderTypeText: {
    fontSize: 12,
    color: "#FF922E",
    marginLeft: 4,
    fontWeight: "500",
  },
  orderDetails: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: "#FF922E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default OrderScreen;
