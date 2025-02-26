import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import Header from "@/components/Header";
import Categories from "@/components/Categories";
import ExtraOrderMenuCard from "@/components/MenuCard";
import axios from "axios";
import { useAuth } from "@/Context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from '@expo/vector-icons';
import { getMenuFromDb, addExtraOrderItems } from "@/utils/sqliteHelper";

interface MenuItem {
  item_id: string;
  item_name: string;
  original_price: string;
  price: number;
  image_url: string;
  category_name: string;
  category_id: string;
  available: boolean;
}

const ExtraOrder = () => {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [extraCart, setExtraCart] = useState<MenuItem[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [category, setCategory] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [refreshing, setRefreshing] = useState(false); // State for refreshing

  // Initialize extra cart from original order
  useEffect(() => {
    if (params.orderItems) {
      const initialItems = JSON.parse(params.orderItems as string);
      // Update the original_price to be the price per item
      const updatedItems = initialItems.map((item) => ({
        ...item,
        item_id: item.item_id,
        item_name: item.name,
        original_price: (item.price / item.count).toFixed(2),
        count: item.count, // Store count
        originalQuantity: item.count, // Store original quantity
      }));
      setExtraCart(updatedItems);
      setSelectedExtraIds(updatedItems.map((item) => item.item_id));
    }
  }, [params.orderItems]);

  // Fetch menus with caching
  const loadMenus = async () => {
    try {
      // Try to load from cache first
      const cachedMenus = await getMenuFromDb();
      if (cachedMenus) {
        setMenus(cachedMenus);
      }
    } catch (error) {
      setErrorMessage("Failed to load menus");
      console.error(error);
    } finally {
      setIsLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    if (user?.vendor_id) {
      loadMenus();
    }
  }, [user?.vendor_id]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenus(); // Reload menus
    setRefreshing(false);
  };

  // Toggle items in extra cart
  const toggleOrderItem = (id: string) => {
    setExtraCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.item_id === id);
      if (existingItem) {
        return prevCart.filter((item) => item.item_id !== id);
      } else {
        const item = menus.find((item) => item.item_id === id);
        return item ? [...prevCart, { ...item, count: 1 }] : prevCart;
      }
    });

    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Filter menu items based on category
  const filteredItems = useMemo(() => {
    return menus.filter((item) => {
      const matchesCategory = category === "0" || item.category_id === category;
      return matchesCategory && item.available;
    });
  }, [menus, category]);

  // Handle quantity changes
  const incrementItemCount = (id: string) => {
    setExtraCart((prev) =>
      prev.map((item) =>
        item.item_id === id ? { ...item, count: (item.count || 0) + 1 } : item
      )
    );
  };

  const decrementItemCount = (id: string) => {
    setExtraCart((prev) => {
      const updated = prev.map((item) =>
        item.item_id === id
          ? { ...item, count: Math.max((item.count || 0) - 1, 0) }
          : item
      );
      return updated.filter((item) => item.count > 0);
    });
  };

  const handleSubmit = async () => {
    try {
      const extraOrderData = {
        orderId: params.orderId,
        items: extraCart.map((item) => ({
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: item.count,
          original_price: parseFloat(item.original_price),
        })),
        count_items: extraCart.length,
        total_price: parseFloat(calculateTotal()),
      };

      // Save extra items to local SQLite database
      await addExtraOrderItems(
        params.orderId as string,
        extraOrderData.items,
        extraOrderData.total_price,
        extraOrderData.count_items
      );

      // // Optionally, you can also sync with the server
      // try {
      //   await axios.put(`/orders/extra/${params.orderId}`, extraOrderData);
      // } catch (error) {
      //   console.error('Failed to sync immediately:', error);
      // }

      Alert.alert(
        "Success", 
        "Extra items added successfully", 
        [
          { 
            text: "OK", 
            onPress: () => {
              router.back();
              router.setParams({ 
                refresh: 'true',
                timestamp: new Date().getTime().toString() 
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add extra items");
      console.error(error);
    }
  };

  const calculateItemTotal = (item: MenuItem) => {
    return item.count * parseFloat(item.original_price);
  };

  const calculateTotal = (): string => {
    return extraCart
      .reduce((sum, item) => sum + parseFloat(item.original_price) * item.count, 0)
      .toFixed(2);
  };

  const getDisplayedTitles = () => {
    const displayedItems = extraCart.slice(0, 2).map((item) => item.item_name);
    return displayedItems.join(", ") +
      (displayedItems.length === 2 ? " and " : "") +
      (extraCart.length > 2 ? "..." : "");
  };

  return (
    <ThemedView style={styles.container}>
      <Header title="Add Extra Items" />

      <View style={styles.searchContainer}>
        <Categories
          setCategory={setCategory}
          category={category}
          menuStatus="vendor"
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading menus...</Text>
        </View>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item) => item.item_id} // Use unique identifier for key prop
          renderItem={({ item }) => {
            const cartItem = extraCart.find(
              (ci) => ci.item_id === item.item_id
            );
            const originalItem = params.orderItems
              ? JSON.parse(params.orderItems as string).find(
                  (oi) => oi.item_id === item.item_id
                )
              : null;

            return (
              <ExtraOrderMenuCard
                item={{
                  id: item.item_id,
                  title: item.item_name,
                  price: parseFloat(item.original_price),
                  image: item.image_url,
                  category: item.category_name,
                }}
                isSelected={selectedExtraIds.includes(item.item_id)}
                onSelect={() => toggleOrderItem(item.item_id)}
                count={cartItem?.count || 0}
                onAdd={() => incrementItemCount(item.item_id)}
                onRemove={() => decrementItemCount(item.item_id)}
                cardStatus="Order"
                originalQuantity={originalItem?.count || 0}
              />
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {extraCart.length > 0 && (
        <ThemedView 
          style={[
            styles.cartInfo,
            { backgroundColor: isDark ? '#1F2937' : 'white' }
          ]}
        >
          <View style={{ flexDirection: "column" }}>
            <Text style={[
              styles.cartCount,
              { color: isDark ? '#E5E7EB' : '#374151' }
            ]}>
              {extraCart.length} Items selected
            </Text>
            <Text style={[
              styles.cartItems,
              { color: isDark ? '#9CA3AF' : '#6B7280' }
            ]}>
              {getDisplayedTitles()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.orderButton,
              { backgroundColor: isDark ? '#D97706' : '#FF922E' }
            ]}
          >
            <Text style={styles.orderButtonText}>
              {calculateTotal()}{" "}
              <Text style={[
                styles.currencyText,
                { color: isDark ? '#F3F4F6' : '#f2efef' }
              ]}>
                ETB
              </Text>
            </Text>
            <MaterialIcons 
              name="arrow-forward" 
              size={24} 
              color={isDark ? '#F3F4F6' : 'white'} 
            />
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    gap: 12,
  },
  errorText: {
    textAlign: "center",
    color: "#EF4444",
    margin: 16,
  },
  cartInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartItems: {
    fontSize: 14,
    marginTop: 4,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  currencyText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ExtraOrder;
