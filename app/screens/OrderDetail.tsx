import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import Header from "@/components/Header";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { useAuth } from "@/Context/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { ThemedText } from "@/components/ThemedText";

interface OrderItem {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  customization?: string[];
}

interface OrderDetail {
  order_id: string;
  order_local_id: string;
  table_num?: string;
  order_type: "Dine In" | "Take Away" | "Delivery";
  status: string;
  orderAt: string;
  items: OrderItem[];
  total_amount: number;
  delivery_info?: string; // JSON string
  takeaway_time?: string;
  cancel_reason?: string;
  cancel_at?: string;
  staff_id?: string;
}

interface CancellationReason {
  id: string;
  reason: string;
}

const ORDER_STATUSES = [
  "Pending",
  "In Progress",
  "Ready",
  "completed",
  "cancelled",
] as const;

const STATUS_CONFIG = {
  Pending: {
    icon: "timer-sand",
    color: "#F59E0B",
    background: "#FEF3C7",
    gradient: ["#F59E0B", "#D97706"],
    lightText: "#92400E",
  },
  "In Progress": {
    icon: "progress-clock",
    color: "#3B82F6",
    background: "#DBEAFE",
    gradient: ["#3B82F6", "#2563EB"],
    lightText: "#1E40AF",
  },
  Ready: {
    icon: "check-circle",
    color: "#22C55E",
    background: "#DCFCE7",
    gradient: ["#22C55E", "#16A34A"],
    lightText: "#166534",
  },
  completed: {
    icon: "check-circle-outline",
    color: "#059669",
    background: "#D1FAE5",
    gradient: ["#059669", "#047857"],
    lightText: "#065F46",
  },
  cancelled: {
    icon: "close-circle",
    color: "#EF4444",
    background: "#FEE2E2",
    gradient: ["#EF4444", "#DC2626"],
    lightText: "#991B1B",
  },
} as const;

const CANCELLATION_REASONS: CancellationReason[] = [
  { id: "customer_request", reason: "Customer Request" },
  { id: "out_of_stock", reason: "Items Out of Stock" },
  { id: "kitchen_issue", reason: "Kitchen Issue" },
  { id: "system_error", reason: "System Error" },
  { id: "other", reason: "Other" },
];

// Create a function for theme-dependent styles
const getThemedStyles = (isDark: boolean) => ({
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDark ? "#374151" : "#E5E7EB",
    marginTop: "auto",
  },
});

// Add this type guard function at the top
const isValidStatus = (
  status: string
): status is keyof typeof STATUS_CONFIG => {
  return status in STATUS_CONFIG;
};

// Add this type for user roles
type UserRole = "cashier" | "kitchen" | "waiter";

// Update ROLE_PERMISSIONS to be more specific about which actions each role can see
const ROLE_PERMISSIONS = {
  cashier: {
    canAccept: true,
    canMarkReady: true,
    canComplete: true,
    canCancel: true,
    canAddItems: true,
    showButtons: ["accept", "ready", "complete", "cancel", "addItems"],
  },
  kitchen: {
    canAccept: true,
    canMarkReady: true,
    canComplete: false,
    canCancel: false,
    canAddItems: false,
    showButtons: ["accept", "ready"], // Kitchen only sees accept and ready buttons
  },
  waiter: {
    canAccept: false,
    canMarkReady: false,
    canComplete: true,
    canCancel: false,
    canAddItems: false,
    showButtons: ["complete"], // Waiter only sees complete button
  },
} as const;

// Update ActionButtons component
interface ActionButtonsProps {
  order: OrderDetail | null;
  onStatusChange: (status: string) => void;
  onAddItems: () => void;
  onCancel: () => void;
  userRole?: string;
  userId?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  order,
  onStatusChange,
  onAddItems,
  onCancel,
  userRole = "cashier",
  userId,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Safely handle undefined userRole
  const permissions =
    ROLE_PERMISSIONS[userRole as UserRole] || ROLE_PERMISSIONS.cashier;

  // Check if the user can complete this specific order
  const canCompleteOrder = () => {
    if (userRole === "waiter") {
      return order?.staff_id === userId;
    }
    return permissions.canComplete;
  };

  const renderActionButtons = () => {
    if (
      !order ||
      order.status === "cancelled" ||
      order.status === "completed"
    ) {
      return null;
    }

    const permissions =
      ROLE_PERMISSIONS[userRole as UserRole] || ROLE_PERMISSIONS.kitchen;

    // Check if waiter can complete their own order
    const canCompleteOrder = () => {
      if (userRole === "waiter") {
        return order?.staff_id === userId;
      }
      return permissions.canComplete;
    };

    return (
      <View style={styles.actionRow}>
        {/* Accept Order - Kitchen & Cashier Only */}
        {permissions.showButtons.includes("accept") &&
          order.status === "Pending" && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.acceptButton]}
              onPress={() => onStatusChange("In Progress")}
            >
              <View style={styles.buttonInner}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="progress-check"
                    size={24}
                    color="white"
                  />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Accept Order</Text>
                  <Text style={styles.buttonSubtext}>
                    Start preparing the order
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

        {/* Mark Ready - Kitchen & Cashier Only */}
        {permissions.showButtons.includes("ready") &&
          order.status === "In Progress" && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.readyButton]}
              onPress={() => onStatusChange("Ready")}
            >
              <View style={styles.buttonInner}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color="white"
                  />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Mark as Ready</Text>
                  <Text style={styles.buttonSubtext}>Order is prepared</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

        {/* Complete Order - Waiter & Cashier Only */}
        {permissions.showButtons.includes("complete") &&
          order.status === "Ready" &&
          canCompleteOrder() && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.completeButton]}
              onPress={() => onStatusChange("completed")}
            >
              <View style={styles.buttonInner}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="check-all"
                    size={24}
                    color="white"
                  />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Complete Order</Text>
                  <Text style={styles.buttonSubtext}>
                    {userRole === "waiter"
                      ? "Your order is delivered"
                      : "Order has been delivered"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

        {/* Secondary Actions - Cashier Only */}
        {(permissions.showButtons.includes("cancel") ||
          permissions.showButtons.includes("addItems")) && (
          <View style={styles.secondaryActions}>
            {permissions.showButtons.includes("addItems") && order.items && (
              <TouchableOpacity
                style={[styles.secondaryButton, styles.addButton]}
                onPress={onAddItems}
              >
                <View style={styles.secondaryButtonInner}>
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={24}
                    color="#475569"
                  />
                  <Text style={styles.secondaryButtonText}>Add Items</Text>
                </View>
              </TouchableOpacity>
            )}

            {permissions.showButtons.includes("cancel") && (
              <TouchableOpacity
                style={[styles.secondaryButton, styles.cancelButton]}
                onPress={onCancel}
              >
                <View style={styles.secondaryButtonInner}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={24}
                    color="#DC2626"
                  />
                  <Text
                    style={[styles.secondaryButtonText, { color: "#DC2626" }]}
                  >
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Only render if we have an order
  if (!order) return null;

  return (
    <View
      style={[
        styles.actionContainer,
        { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
      ]}
    >
      {renderActionButtons()}
    </View>
  );
};

// Update the getAvailableStatusesByRole function
const getAvailableStatusesByRole = (
  currentRole: string,
  currentStatus: string,
  staffId?: string,
  orderStaffId?: string
) => {
  const isOwnOrder = staffId === orderStaffId;
  const role = currentRole.toLowerCase();

  // Define available status transitions based on current status
  const statusTransitions = {
    Pending: ["Pending", "In Progress", "cancelled"],
    "In Progress": ["In Progress", "Ready", "cancelled"],
    Ready: ["Ready", "completed"], // Only Ready and Completed for Ready status
    completed: ["completed"],
    cancelled: ["cancelled"],
    default: [currentStatus],
  };

  // Get available statuses based on current status and role
  const availableStatuses =
    statusTransitions[currentStatus as keyof typeof statusTransitions] ||
    statusTransitions.default;

  // Filter available statuses based on role permissions
  switch (role) {
    case "kitchen":
      return availableStatuses.filter((status) =>
        ["Pending", "In Progress", "Ready"].includes(status)
      );

    case "waiter":
      if (currentStatus === "Ready" && isOwnOrder) {
        return ["Ready", "completed"];
      }
      return [currentStatus];

    case "cashier":
      return availableStatuses; // Cashier can see all available transitions

    default:
      return [currentStatus];
  }
};

// At the top of the file, add this helper function
const useThemeColor = () => {
  const colorScheme = useColorScheme();
  return {
    isDark: colorScheme === "dark",
    colors: {
      background: colorScheme === "dark" ? "#1F2937" : "#FFFFFF",
      text: colorScheme === "dark" ? "#F3F4F6" : "#111827",
      secondaryText: colorScheme === "dark" ? "#9CA3AF" : "#6B7280",
      border: colorScheme === "dark" ? "#374151" : "#E5E7EB",
      modalBackground: colorScheme === "dark" ? "#111827" : "#F3F4F6",
    },
  };
};

// Add this helper function for role-specific modal titles
const getModalTitle = (role: string) => {
  switch (role?.toLowerCase()) {
    case "kitchen":
      return "Update Cooking Status";
    case "waiter":
      return "Update Delivery Status";
    default:
      return "Update Order Status";
  }
};

const OrderDetail = () => {
  const { order_id } = useLocalSearchParams();
  const { user } = useAuth();
  const { isDark, colors } = useThemeColor();
  const themedStyles = getThemedStyles(isDark);
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newStatus, setNewStatus] = useState<(typeof ORDER_STATUSES)[number]>(
    order?.status || "Pending"
  );
  const [extraItem, setExtraItem] = useState({
    item_name: "",
    quantity: 1,
    price: 0,
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!order_id) {
        setError("Order ID is missing");
        return;
      }

      const response = await axios.get(`/orders/${order_id}`);
      setOrder(response.data);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      setError("Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      Alert.alert("Error", "Please select a cancellation reason");
      return;
    }

    if (cancelReason === "other" && !otherReason) {
      Alert.alert("Error", "Please specify the reason");
      return;
    }

    try {
      await axios.put(`/orders/cancel/${order_id}/${cancelReason}`, {
        reason:
          cancelReason === "other"
            ? otherReason
            : CANCELLATION_REASONS.find((r) => r.id === cancelReason)?.reason,
        reason_code: cancelReason,
      });
      router.back();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      Alert.alert("Error", "Failed to cancel order");
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await axios.put(`/orders/status/${order_id}`, { status: newStatus });
      fetchOrderDetail();
      setShowStatusModal(false);
      router.back();
    } catch (error) {
      console.error("Failed to update status:", error);
      Alert.alert("Error", "Failed to update order status");
    }
  };

  const handleAddExtraItem = async () => {
    if (!extraItem.item_name || extraItem.quantity < 1 || extraItem.price < 0) {
      Alert.alert("Invalid Input", "Please fill all fields correctly");
      return;
    }

    try {
      await axios.post(`/orders/${order_id}/items`, extraItem);
      fetchOrderDetail();
      setShowAddItemModal(false);
      setExtraItem({ item_name: "", quantity: 1, price: 0 });
    } catch (error) {
      console.error("Failed to add extra item:", error);
      Alert.alert("Error", "Failed to add extra item");
    }
  };

  React.useEffect(() => {
    fetchOrderDetail();
  }, [order_id]);

  const parseDeliveryInfo = (deliveryInfo: string | undefined) => {
    if (!deliveryInfo) return null;
    try {
      return JSON.parse(deliveryInfo) as {
        phoneNumber: string;
        address: string;
      };
    } catch (e) {
      console.error("Failed to parse delivery info:", e);
      return null;
    }
  };

  const getStatusDescription = (status: (typeof ORDER_STATUSES)[number]) => {
    const descriptions = {
      Pending: "Order received, waiting to be processed",
      "In Progress": "Order is being prepared in the kitchen",
      Ready: "Order is ready for service/pickup",
      cancelled: "Order has been cancelled",
    };
    return descriptions[status];
  };

  const getStatusConfig = (status: string) => {
    if (isValidStatus(status)) {
      return STATUS_CONFIG[status];
    }
    // Return default config if status is invalid
    return STATUS_CONFIG["Pending"];
  };

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Order Details" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <ThemedText>Loading order details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Order Details" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Order not found"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrderDetail}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header title={`Order ${order.order_local_id}`} />
      <ScrollView style={styles.content}>
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
          ]}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderType}>
              <MaterialCommunityIcons
                name={
                  order.order_type === "Dine In"
                    ? "food-fork-drink"
                    : order.order_type === "Take Away"
                    ? "shopping-outline"
                    : "truck-delivery-outline"
                }
                size={24}
                color="#FF922E"
              />
              <Text
                style={[
                  styles.orderTypeText,
                  { color: isDark ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {order.order_type}
              </Text>
            </View>
            <View style={[styles.statusBadge]}>
              <View style={styles.statusContent}>
                <View
                  style={[
                    styles.statusIconContainer,
                    { backgroundColor: getStatusConfig(order.status).color },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getStatusConfig(order.status).icon}
                    size={16}
                    color="white"
                  />
                </View>
                <View style={styles.statusTextWrapper}>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: getStatusConfig(order.status).color },
                    ]}
                  >
                    STATUS
                  </Text>
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusConfig(order.status).color },
                    ]}
                  >
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {order.status === "cancelled" && order.cancel_reason && (
            <View style={styles.cancelReasonWrapper}>
              <View style={styles.cancelReasonContainer}>
                <View style={styles.cancelIconContainer}>
                  <MaterialIcons name="cancel" size={24} color="#EF4444" />
                </View>
                <View style={styles.cancelReasonContent}>
                  <Text style={styles.cancelReasonLabel}>
                    Cancellation Reason
                  </Text>
                  <Text style={styles.cancelReasonText}>
                    {order.cancel_reason}
                  </Text>
                  <Text style={styles.cancelTimeText}>
                    Cancelled at:{" "}
                    {new Date(order.cancel_at).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.orderInfo}>
            <View style={styles.infoItem}>
              <MaterialIcons
                name="access-time"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                style={[
                  styles.infoText,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {new Date(order.orderAt).toLocaleString()}
              </Text>
            </View>

            {order.order_type === "Dine In" && order.table_num && (
              <View style={styles.infoItem}>
                <MaterialIcons
                  name="table-restaurant"
                  size={20}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Table {order.table_num}
                </Text>
              </View>
            )}

            {order.order_type === "Delivery" && (
              <>
                {parseDeliveryInfo(order.delivery_info) && (
                  <>
                    <View style={styles.infoItem}>
                      <MaterialIcons
                        name="phone"
                        size={20}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: isDark ? "#9CA3AF" : "#6B7280" },
                        ]}
                      >
                        {parseDeliveryInfo(order.delivery_info)?.phoneNumber}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <MaterialIcons
                        name="location-on"
                        size={20}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: isDark ? "#9CA3AF" : "#6B7280" },
                        ]}
                      >
                        {parseDeliveryInfo(order.delivery_info)?.address}
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}

            {order.order_type === "Take Away" && order.takeaway_time && (
              <View style={styles.infoItem}>
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Pickup at: {order.takeaway_time}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            Order Items
          </Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemHeader}>
                <Text
                  style={[
                    styles.itemName,
                    { color: isDark ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {item.item_name}
                </Text>
                <Text
                  style={[
                    styles.itemPrice,
                    { color: isDark ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {item.quantity} x {item.price} ETB
                </Text>
              </View>
              {item.customization && item.customization.length > 0 && (
                <View style={styles.customization}>
                  {item.customization.map((custom, idx) => (
                    <Text key={idx} style={styles.customText}>
                      • {custom}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
          <View style={styles.totalSection}>
            <Text
              style={[
                styles.totalText,
                { color: isDark ? "#FFFFFF" : "#1F2937" },
              ]}
            >
              Total Amount
            </Text>
            <View>
              <Text
                style={[
                  styles.totalAmount,
                  { color: isDark ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {order.total_amount} ETB
              </Text>
              {order.order_type === "Take Away" && (
                <Text style={styles.takeawayNote}>
                  * Includes takeaway packaging
                </Text>
              )}
            </View>
          </View>
        </View>

        <ActionButtons
          order={order}
          userRole={user?.position.toLowerCase()}
          userId={user?.staff_id}
          onStatusChange={(status) => {
            if (order) {
              setNewStatus(status);
              setShowStatusModal(true);
            }
          }}
          onAddItems={() => {
            if (order?.items) {
              router.push({
                pathname: "/screens/ExtraOrder",
                params: {
                  orderItems: JSON.stringify(
                    order.items.map((item) => ({
                      item_id: item.item_id,
                      name: item.item_name,
                      price: item.price,
                      count: item.quantity,
                      original: true,
                    }))
                  ),
                  orderId: order.order_id,
                  totalAmount: order.total_amount,
                },
              });
            }
          }}
          onCancel={() => setShowCancelModal(true)}
        />

        <Modal
          visible={showStatusModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.modalBackground,
                },
              ]}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: colors.secondaryText,
                    },
                  ]}
                >
                  {getModalTitle(user?.position.toLowerCase())}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowStatusModal(false)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.secondaryText}
                  />
                </TouchableOpacity>
              </View>

              {/* Status Options */}
              <ScrollView style={styles.statusOptionsScroll}>
                <View style={styles.statusOptions}>
                  {getAvailableStatusesByRole(
                    user?.position.toLowerCase() || "",
                    order?.status || "",
                    user?.staff_id,
                    order?.staff_id
                  ).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor: colors.background,
                          borderColor:
                            newStatus === status
                              ? getStatusConfig(status).color
                              : colors.border,
                        },
                      ]}
                      onPress={() => setNewStatus(status)}
                    >
                      <View style={styles.statusOptionContent}>
                        <View
                          style={[
                            styles.statusIconBg,
                            {
                              backgroundColor:
                                getStatusConfig(status).background,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={getStatusConfig(status).icon}
                            size={20}
                            color={getStatusConfig(status).color}
                          />
                        </View>
                        <View style={styles.statusTextContainer}>
                          <Text
                            style={[
                              styles.statusOptionTitle,
                              {
                                color: colors.text,
                              },
                            ]}
                          >
                            {status}
                          </Text>
                          <Text
                            style={[
                              styles.statusOptionDescription,
                              {
                                color: colors.secondaryText,
                              },
                            ]}
                          >
                            {getStatusDescription(
                              status,
                              user?.position.toLowerCase()
                            )}
                          </Text>
                        </View>
                        {newStatus === status && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={24}
                            color={getStatusConfig(status).color}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Update Button */}
              <View
                style={[styles.modalFooter, { borderTopColor: colors.border }]}
              >
                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    {
                      backgroundColor: getStatusConfig(newStatus).color,
                      opacity: newStatus === order.status ? 0.5 : 1,
                    },
                  ]}
                  disabled={newStatus === order.status}
                  onPress={handleStatusUpdate}
                >
                  <Text style={styles.updateButtonText}>Update Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showAddItemModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddItemModal(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                Add Extra Item
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#1F2937" },
                ]}
                placeholder="Item name"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={extraItem.item_name}
                onChangeText={(text) =>
                  setExtraItem((prev) => ({ ...prev, item_name: text }))
                }
              />
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#1F2937" },
                ]}
                placeholder="Quantity"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                keyboardType="numeric"
                value={extraItem.quantity.toString()}
                onChangeText={(text) =>
                  setExtraItem((prev) => ({
                    ...prev,
                    quantity: parseInt(text) || 0,
                  }))
                }
              />
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? "#FFFFFF" : "#1F2937" },
                ]}
                placeholder="Price"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                keyboardType="numeric"
                value={extraItem.price.toString()}
                onChangeText={(text) =>
                  setExtraItem((prev) => ({
                    ...prev,
                    price: parseFloat(text) || 0,
                  }))
                }
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowAddItemModal(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmModalButton]}
                  onPress={handleAddExtraItem}
                >
                  <Text style={styles.buttonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showCancelModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCancelModal(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <MaterialIcons name="cancel" size={24} color="#EF4444" />
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: isDark ? "#FFFFFF" : "#1F2937" },
                    ]}
                  >
                    Cancel Order
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
                  ]}
                  onPress={() => setShowCancelModal(false)}
                >
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.modalSubtitle,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Please select a reason for cancellation
              </Text>

              <View style={styles.reasonOptions}>
                {CANCELLATION_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: isDark ? "#111827" : "#FFFFFF",
                        borderColor:
                          cancelReason === reason.id
                            ? "#EF4444"
                            : isDark
                            ? "#374151"
                            : "#E5E7EB",
                      },
                    ]}
                    onPress={() => setCancelReason(reason.id)}
                  >
                    <View style={styles.reasonContent}>
                      <Text
                        style={[
                          styles.reasonText,
                          { color: isDark ? "#FFFFFF" : "#1F2937" },
                        ]}
                      >
                        {reason.reason}
                      </Text>
                      {cancelReason === reason.id && (
                        <MaterialIcons
                          name="check-circle"
                          size={24}
                          color="#EF4444"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {cancelReason === "other" && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDark ? "#FFFFFF" : "#1F2937",
                      borderColor: isDark ? "#374151" : "#E5E7EB",
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                    },
                  ]}
                  placeholder="Specify reason..."
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={otherReason}
                  onChangeText={setOtherReason}
                  multiline
                />
              )}

              <TouchableOpacity
                style={[
                  styles.cancelConfirmButton,
                  { opacity: cancelReason ? 1 : 0.5 },
                ]}
                onPress={handleCancel}
                disabled={!cancelReason}
              >
                <Text style={styles.cancelConfirmText}>
                  Confirm Cancellation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ThemedView>
  );
};

// Add this helper function for role-specific descriptions
const getRoleSpecificDescription = (status: string, role?: string) => {
  const descriptions = {
    kitchen: {
      Pending: "Start preparing this order",
      "In Progress": "Order is being cooked",
      Ready: "Order is ready for service",
    },
    waiter: {
      Ready: "Order is ready for delivery",
      completed: "Order has been delivered to customer",
    },
    cashier: {
      Pending: "Order received, waiting to be processed",
      "In Progress": "Order is being prepared in kitchen",
      Ready: "Order is ready for service/pickup",
      completed: "Order has been completed and delivered",
      cancelled: "Order has been cancelled",
    },
  };

  return (
    descriptions[role?.toLowerCase() as keyof typeof descriptions]?.[status] ||
    descriptions.cashier[status as keyof typeof descriptions.cashier] ||
    "Update order status"
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
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderTypeText: {
    fontSize: 18,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  statusTextWrapper: {
    flexDirection: "column",
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  orderInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  orderItem: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 16,
  },
  customization: {
    marginLeft: 8,
    marginTop: 4,
  },
  customText: {
    color: "#6B7280",
    fontSize: 14,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "600",
  },
  takeawayNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 4,
  },
  actionContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionRow: {
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 16,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  buttonSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: "#2563EB",
  },
  readyButton: {
    backgroundColor: "#059669",
  },
  completeButton: {
    backgroundColor: "#059669",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  secondaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  addButton: {
    borderColor: "#CBD5E1",
  },
  cancelButton: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  currentStatusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  currentStatusLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusOptionsScroll: {
    maxHeight: "60%",
  },
  statusOptions: {
    gap: 12,
  },
  statusOption: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  statusOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusTextContainer: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusOptionDescription: {
    fontSize: 14,
  },
  modalFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  updateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#EF4444",
  },
  confirmModalButton: {
    backgroundColor: "#22C55E",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  reasonOptions: {
    gap: 12,
    marginBottom: 24,
  },
  reasonOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  reasonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reasonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cancelConfirmButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelConfirmText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelReasonWrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
  cancelReasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    gap: 12,
  },
  cancelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelReasonContent: {
    flex: 1,
  },
  cancelReasonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#991B1B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cancelReasonText: {
    fontSize: 15,
    color: "#7F1D1D",
    fontWeight: "500",
    marginBottom: 4,
  },
  cancelTimeText: {
    fontSize: 12,
    color: "#EF4444",
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

export default OrderDetail;
