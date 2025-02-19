import {
  Appearance,
  Button,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import MenuCard from "@/components/MenuCard";
import { ThemedView } from "@/components/ThemedView";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import SearchBox from "@/components/SearchBox";
import { router } from "expo-router";
import axios from "axios";
import { useAuth } from "@/Context/AuthContext";
import Categories from "@/components/Categories";
import Header from "@/components/Header";
import { addMenuToDbFromApi, getMenuFromDb } from "@/utils/sqliteHelper";

interface MenuItem {
  item_id: string;
  item_name: string;
  price: string;
  original_price: string;
  image_url: string;
  category_name: string;
  category_id: string;
  available: number;
  created_at: string;
}

interface CartItem extends MenuItem {
  count: number;
}

const AddOrder = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState("0");
  const { user } = useAuth();
  console.log(user?.vendor_id);

  const fetchMenuItems = async () => {
    try {
      const cachedMenu = await getMenuFromDb(); // Fetch from SQLite
      if (cachedMenu) {
        setMenu(cachedMenu as MenuItem[]); // Type assertion
      }
      
      setIsLoading(true);
      const response = await axios.get(`/menus/vendor/${user?.vendor_id}`);
      const menuData = response.data;

      // Update the database and state only if we got new data
      if (menuData && menuData.length > 0) {
        await addMenuToDbFromApi(menuData); // Add new menu items to SQLite
        setMenu(menuData as MenuItem[]); // Type assertion
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.vendor_id) {
      fetchMenuItems();
    }
  }, [user?.vendor_id]);

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    AsyncStorage.removeItem("menuItems") // Clear cache
      .then(() => fetchMenuItems());
  }, []);

  const handleToggleOrder = (item_id: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.item_id === item_id
      );

      if (existingItem) {
        const newCart = prevCart.filter(
          (cartItem) => cartItem.item_id !== item_id
        );
        return newCart;
      } else {
        const item = menu.find((item) => item.item_id === item_id);
        return item ? [...prevCart, { ...item, count: 1 }] : prevCart;
      }
    });
  };

  const updateItemCount = (item_id: string, action: "add" | "remove") => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((cartItem) => {
        if (cartItem.item_id === item_id) {
          const newCount =
            action === "add" ? cartItem.count + 1 : cartItem.count - 1;
          return { ...cartItem, count: Math.max(newCount, 0) };
        }
        return cartItem;
      });
      return updatedCart.filter((cartItem) => cartItem.count > 0);
    });
  };

  const calculateTotal = (): string => {
    return cart
      .reduce(
        (sum, item) => sum + parseFloat(item.original_price) * item.count,
        0
      )
      .toFixed(2);
  };

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      // First check if item has name
      if (!item?.item_name) return false;

      // Apply search filter
      const matchesSearch = item.item_name
        .toLowerCase()
        .includes((searchText || "").toLowerCase());

      // Apply category filter
      const matchesCategory = category === "0" || item.category_id === category;

      // Item must match both search and category filters
      return matchesSearch && matchesCategory;
    });
  }, [searchText, menu, category]);

  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const handleCheckout = () => {
    if (cart.length > 0) {
      router.push({
        pathname: "/(order)/Checkout",
        params: {
          cart: JSON.stringify(cart),
        },
      });
    }
  };

  const displayedItems = cart.slice(0, 2).map((item) => item.item_name);

  const displayedTitles =
    displayedItems.join(", ") +
    (displayedItems.length === 2 ? " and " : "") +
    (cart.length > 2 ? "..." : "");

  return (
    <ThemedView style={styles.container}>
      <StatusBar
        backgroundColor={colorScheme === "dark" ? "#303030" : "#F9F9F9"}
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <Header title="" />

      <View style={styles.searchContainer}>
        <SearchBox
          placeholder="Search for dishes"
          setSearchText={setSearchText}
          searchValue={searchText}
        />
      </View>
      <View style={styles.categoryContainer}>
        <Categories
          setCategory={setCategory}
          category={category}
          menuStatus="vendor"
        />
      </View>

      <View style={styles.itemsContainer}>
        <FlatList
          data={filteredMenu}
          keyExtractor={(item) => item.item_id}
          numColumns={2}
          scrollEnabled={true}
          refreshing={isLoading}
          onRefresh={onRefresh}
          renderItem={({ item }) => {
            const cartItem = cart.find(
              (cartItem) => cartItem.item_id === item.item_id
            );
            const itemCount = cartItem ? cartItem.count : 0;

            return (
              <MenuCard
                item={{
                  ...item,
                  id: item.item_id,
                  title: item.item_name,
                  price: parseFloat(item.original_price),
                  image: item.image_url,
                  category: item.category_name,
                }}
                isSelected={itemCount > 0}
                onSelect={() => handleToggleOrder(item.item_id)}
                count={itemCount}
                onRemove={() => updateItemCount(item.item_id, "remove")}
                onAdd={() => updateItemCount(item.item_id, "add")}
                cardStatus={"Order"}
              />
            );
          }}
        />
      </View>
      {cart.length > 0 && (
        <ThemedView style={styles.cartInfo}>
          <View style={{ flexDirection: "column" }}>
            <ThemedText>{cart.length} Items selected</ThemedText>
            <Text style={{ color: "gray" }}>{displayedTitles}</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleCheckout()}
            style={styles.orderButton}
          >
            <ThemedText style={{ color: "white", fontSize: 19 }}>
              {calculateTotal()}{" "}
              <ThemedText style={{ color: "#f2efef", fontSize: 13 }}>
                ETB
              </ThemedText>
              <AntDesign name="arrowright" size={24} color="white" />
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
};

export default AddOrder;

const styles = StyleSheet.create({
  dark: {
    backgroundColor: "#303030",
    color: "#fff",
  },
  light: {
    backgroundColor: "#F9F9F9",
    color: "#000",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    flexGrow: 1,
    overflow: "scroll",
  },
  itemsContainer: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    top: 80, // Adjust this value to position the search box
    left: 0,
    right: 0,
    zIndex: 1,
  },

  cartInfo: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    borderRadius: 15,
  },
  container: {
    flex: 1,
  },
  orderButton: {
    backgroundColor: "#FF922E",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    gap: 40,
  },
  categoryContainer: {
    marginTop: 10,
  },
  categoryCard: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
  },
  itemTitle: {
    fontWeight: "bold",
  },
  categories: {},
});
