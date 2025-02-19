import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useAuth } from "@/Context/AuthContext";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";

interface Category {
  category_id: string;
  category_name: string;
  icon: string;
}

interface CategoriesProps {
  setCategory: (id: string) => void;
  category: string;
  menuStatus?: string;
}

const Categories: React.FC<CategoriesProps> = ({ setCategory, category, menuStatus }) => {
  const [activeCategoryId, setActiveCategoryId] = useState("0");
  const [fetchedCategories, setFetchedCategories] = useState<Category[]>([]);
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  const handleCategoryClick = (id: string) => {
    setCategory(id);
    setActiveCategoryId(id);
  };

  useEffect(() => {
    const fetchCategoriesByVendorId = async () => {
      try {
        if (!user?.vendor_id) return;

        // Check cached categories
        const cachedCategories = await AsyncStorage.getItem('categories');
        if (cachedCategories) {
          setFetchedCategories(JSON.parse(cachedCategories));
        }

        // Fetch fresh categories
        const response = await axios.get(`/menu/category/vendor/${user.vendor_id}`);
        const categories = response.data;

        // Update cache and state
        await AsyncStorage.setItem('categories', JSON.stringify(categories));
        setFetchedCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    if (user?.vendor_id) {
      fetchCategoriesByVendorId();
    }
  }, [user?.vendor_id]);

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      onPress={() => handleCategoryClick(item.category_id)}
      style={[
        styles.categoryButton,
        colorScheme === 'dark' ? styles.darkButton : styles.lightButton,
        category === item.category_id && styles.activeButton
      ]}
    >
      <ThemedView style={styles.iconContainer}>
        <ThemedText>{item.icon || '🍽️'}</ThemedText>
      </ThemedView>

      <ThemedText style={[
        styles.categoryText,
        category === item.category_id && styles.activeText
      ]}>
        {item.category_name}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Categories</ThemedText>
      <View style={styles.content}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { category_id: "0", category_name: "All", icon: "🥪" },
            ...fetchedCategories
          ]}
          renderItem={renderCategory}
          keyExtractor={item => item.category_id}
          style={styles.list}
        />

       
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeButton: {
    backgroundColor: '#F6AD55',
    borderColor: '#F6AD55',
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#FEEBC8',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeText: {
    color: 'white',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6AD55',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  lightButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  darkButton: {
    backgroundColor: '#303030',
    borderColor: '#404040',
  },
});

export default Categories; 