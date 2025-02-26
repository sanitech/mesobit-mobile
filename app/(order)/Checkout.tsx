import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  useColorScheme,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { useAuth } from "@/Context/AuthContext";
import { addOrder } from "@/utils/sqliteHelper";

interface OrderItem {
  item_id: string;
  item_name: string;
  original_price: string;
  count: number;
  category_name: string;
}

interface DeliveryInfo {
  phoneNumber: string;
  address: string;
}

interface ProcessedOrder {
  id: string;
  vendor_id: string;
  items: {
    item_id: string;
    item_name: string;
    count: number;
    original_price: number;
  }[];
  order_type: "Dine In" | "Take Away" | "Delivery";
  count_item: number;
  staff_id: string;
  table_num: string | null;
  delivery_info: string | null;
  total_price: number;
  discount_percent: number;
  discount_amount: number;
  tax: number;
  delivery_fee: number;
  takeaway_fee: number;
  total_amount: number;
  status: string;
  created_at: string;
}

const Checkout = () => {
  const params = useLocalSearchParams();
  const orderItems: OrderItem[] = JSON.parse(params.cart as string);
  console.log(orderItems);
  const tableNumber = "12";
  const persons = "2";
  const orderId = "#83932";
  const [orderType, setOrderType] = useState<
    "Dine In" | "Take Away" | "Delivery"
  >("Dine In");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    phoneNumber: "",
    address: "",
  });

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const TAKEAWAY_FEE = 10; // 10 ETB for takeaway
  const DELIVERY_FEE = 50; // 50 ETB for delivery

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      const price = parseFloat(item.original_price) || 0;
      const quantity = item.count || 0;
      return sum + price * quantity;
    }, 0);
  };

  const calculateDiscount = (subtotal: number) => {
    return (subtotal * discountPercent) / 100;
  };

  const calculateTax = (subtotal: number, discount: number) => {
    return (subtotal - discount) * 0.15; // 15% VAT after discount
  };

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const tax = calculateTax(subtotal, discount);

  const calculateTotal = () => {
    let finalTotal = subtotal - discount + tax;

    if (orderType === "Take Away") {
      finalTotal += TAKEAWAY_FEE;
    } else if (orderType === "Delivery") {
      finalTotal += DELIVERY_FEE;
    }

    return finalTotal;
  };

  const total = calculateTotal();

  const discountOptions = [0, 5, 10, 15, 20];

  const tabs = [
    {
      id: "Dine In",
      label: "Dine In",
      icon: (active: boolean) => (
        <MaterialCommunityIcons
          name="table-chair"
          size={20}
          color={active ? "white" : "#666"}
        />
      ),
    },
    {
      id: "Take Away",
      label: "Take Away",
      icon: (active: boolean) => (
        <MaterialCommunityIcons
          name="shopping-outline"
          size={20}
          color={active ? "white" : "#666"}
        />
      ),
    },
    {
      id: "Delivery",
      label: "Delivery",
      icon: (active: boolean) => (
        <MaterialCommunityIcons
          name="truck-delivery-outline"
          size={20}
          color={active ? "white" : "#666"}
        />
      ),
    },
  ];

  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const count_item = orderItems.reduce((sum, item) => sum + item.count, 0);

  const handleProcessOrder = async () => {
    if (orderType === "Delivery" && !deliveryInfo.phoneNumber) {
      Alert.alert("Error", "Please enter delivery information");
      return;
    }

    setIsProcessing(true);
    try {
      if (!user?.vendor_id || !user?.staff_id) {
        throw new Error("Missing user information");
      }

      const formattedItems = orderItems.map((item) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        count: item.count,
        original_price: parseFloat(item.original_price) || 0,
      }));

      // Add order to local database
      const orderId = await addOrder(
        user.vendor_id,
        formattedItems,
        subtotal,
        orderType,
        user.staff_id,
        orderType === "Dine In" ? tableNumber : null,
        orderType === "Delivery" ? JSON.stringify(deliveryInfo) : null,
        discountPercent,
        discount,
        tax,
        orderType === "Delivery" ? DELIVERY_FEE : 0,
        orderType === "Take Away" ? TAKEAWAY_FEE : 0,
        total
      );

      router.replace("/(tabs)/order");
    } catch (error) {
      console.error("Error processing order:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to process order"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar backgroundColor={"#FF922E"} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Checkout</ThemedText>
        <TouchableOpacity>
          <Ionicons name="download-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        {/* Order Type Tabs */}
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setOrderType(tab.id as typeof orderType)}
              style={[styles.tab, orderType === tab.id && styles.activeTab]}
            >
              <View style={styles.tabContent}>
                {tab.icon(orderType === tab.id)}
                <ThemedText
                  style={[
                    styles.tabText,
                    orderType === tab.id && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Show/Hide Table Info based on order type */}
        {/* {orderType === 'Dine In' && (
          <View style={styles.tableInfo}>
            <View>
              <ThemedText style={styles.tableTitle}>Table {tableNumber}</ThemedText>
              <View style={styles.personsInfo}>
                <Ionicons name="people-outline" size={16} color="#FF922E" />
                <ThemedText style={styles.personsText}>{persons} Persons</ThemedText>
              </View>
            </View>
            <TouchableOpacity>
              <ThemedText style={styles.changeTable}>Change table</ThemedText>
            </TouchableOpacity>
          </View>
        )} */}

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.orderRow}>
            <ThemedText>Order ID</ThemedText>
            <ThemedText>{orderId}</ThemedText>
          </View>
        </View>

        {/* Order Items */}
        <ScrollView style={styles.itemsList}>
          <ThemedText style={styles.sectionTitle}>Ordered menu</ThemedText>
          {orderItems.map((item) => (
            <View key={item.item_id} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.quantity}>
                  x{item.count || 0}
                </ThemedText>
                <View>
                  <ThemedText style={styles.itemName}>
                    {item.item_name}
                  </ThemedText>
                  <ThemedText style={styles.itemCategory}>
                    {item.category_name}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.itemPrice}>
                {(
                  (parseFloat(item.original_price) || 0) * (item.count || 0)
                ).toFixed(2)}{" "}
                ETB
              </ThemedText>
            </View>
          ))}
        </ScrollView>

        {/* Discount Section */}
        <View style={styles.discountSection}>
          <ThemedText style={styles.sectionTitle}>Select Discount</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.discountOptions}>
              {discountOptions.map((percent) => (
                <TouchableOpacity
                  key={percent}
                  style={[
                    styles.discountButton,
                    discountPercent === percent && styles.activeDiscountButton,
                  ]}
                  onPress={() => setDiscountPercent(percent)}
                >
                  <ThemedText
                    style={[
                      styles.discountButtonText,
                      discountPercent === percent &&
                        styles.activeDiscountButtonText,
                    ]}
                  >
                    {percent}%
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Add Delivery Info Section */}
        {orderType === "Delivery" && (
          <View style={styles.deliverySection}>
            <ThemedText style={styles.sectionTitle}>
              Delivery Information
            </ThemedText>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: isDarkMode ? "#fff" : "#666" }]}
                placeholder="Phone Number"
                value={deliveryInfo.phoneNumber}
                onChangeText={(text) =>
                  setDeliveryInfo((prev) => ({ ...prev, phoneNumber: text }))
                }
                keyboardType="phone-pad"
                placeholderTextColor={isDarkMode ? "#999" : "#666"}
              />
              <TextInput
                style={[styles.input, { color: isDarkMode ? "#fff" : "#666" }]}
                placeholder="Delivery Address"
                value={deliveryInfo.address}
                onChangeText={(text) =>
                  setDeliveryInfo((prev) => ({ ...prev, address: text }))
                }
                multiline
                placeholderTextColor={isDarkMode ? "#999" : "#666"}
              />
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summary}>
          <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText>Item total</ThemedText>
            <ThemedText>{subtotal.toFixed(2)} ETB</ThemedText>
          </View>
          {discountPercent > 0 && (
            <View style={styles.summaryRow}>
              <ThemedText>Discount ({discountPercent}%)</ThemedText>
              <ThemedText style={styles.discountText}>
                -{discount.toFixed(2)} ETB
              </ThemedText>
            </View>
          )}
          <View style={styles.summaryRow}>
            <ThemedText>Tax (15%)</ThemedText>
            <ThemedText>{tax.toFixed(2)} ETB</ThemedText>
          </View>
          {orderType === "Take Away" && (
            <View style={styles.summaryRow}>
              <ThemedText>Takeaway Fee</ThemedText>
              <ThemedText>{TAKEAWAY_FEE.toFixed(2)} ETB</ThemedText>
            </View>
          )}
          {orderType === "Delivery" && (
            <View style={styles.summaryRow}>
              <ThemedText>Delivery Fee</ThemedText>
              <ThemedText>{DELIVERY_FEE.toFixed(2)} ETB</ThemedText>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText style={styles.totalText}>Total</ThemedText>
            <ThemedText style={styles.totalAmount}>
              {total.toFixed(2)} ETB
            </ThemedText>
          </View>
        </View>

        {/* Process Order Button */}
        <TouchableOpacity
          style={[
            styles.processButton,
            ((orderType === "Delivery" && !deliveryInfo.phoneNumber) ||
              isProcessing) &&
              styles.disabledButton,
          ]}
          disabled={
            (orderType === "Delivery" && !deliveryInfo.phoneNumber) ||
            isProcessing
          }
          onPress={handleProcessOrder}
        >
          <ThemedText style={styles.processButtonText}>
            {isProcessing ? "Processing..." : "Process Order"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,

    backgroundColor: "#FF922E",
    padding: 16,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },

  tabs: {
    flexDirection: "row",
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 20,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeTab: {
    backgroundColor: "#FF922E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "white",
  },
  tableInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  personsInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  personsText: {
    marginLeft: 4,
    color: "#666",
  },
  changeTable: {
    color: "#FF922E",
  },
  orderDetails: {
    marginBottom: 24,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  itemsList: {
    flex: 1,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantity: {
    marginRight: 12,
    fontSize: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemCategory: {
    color: "#666",
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "500",
  },
  summary: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF922E",
  },
  processButton: {
    backgroundColor: "#FF922E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  processButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  discountSection: {
    marginVertical: 16,
  },
  discountOptions: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  discountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeDiscountButton: {
    backgroundColor: "#FF922E",
    borderColor: "#FF922E",
  },
  discountButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeDiscountButtonText: {
    color: "white",
  },
  discountText: {
    color: "#FF922E",
  },
  deliverySection: {
    marginVertical: 16,
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    // color={isDarkMode ? "#999" : "#666"}
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default Checkout;
