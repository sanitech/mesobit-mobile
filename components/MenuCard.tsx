import { AntDesign, Entypo, Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Appearance,
  useColorScheme,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { Image } from "expo-image";

const MenuCard = ({
  item,
  onAdd,
  onRemove,
  count,
  onSelect,
  isSelected,
  cardStatus,
}: {
  item: {
    id: string;
    title: string;
    image: string;
    category: string;
    price: number;
  };
  onAdd: () => void;
  onRemove: () => void;
  count: number;
  onSelect: () => void;
  isSelected: boolean;
  cardStatus: "Order" | "Menu"; // Specify expected types
}) => {
  const colorScheme = useColorScheme();

  const cardStyle = {
    backgroundColor: isSelected
      ? colorScheme === "dark"
        ? "#181818"
        : "#EEEEF1"
      : colorScheme === "dark"
      ? "#303030"
      : "#fff",
    shadowColor: isSelected
      ? colorScheme === "dark"
        ? "orange"
        : "#EEEEF1"
      : colorScheme === "dark"
      ? "#303030"
      : "#fff",
    borderColor: isSelected ? "rgba(255, 146, 46, 0.2)" : "rgba(0,0,0,0.1)",
    borderWidth: isSelected ? 1 : 0,
  };

  return (
    <TouchableOpacity
      onPress={cardStatus === "Order" ? onSelect : undefined}
      style={[
        styles.card,
        colorScheme === "dark" ? styles.darkCard : styles.lightCard,
        isSelected && styles.selectedCard,
      ]}
    >
      <Image
        source={{ uri: process.env.EXPO_PUBLIC_IMAGE_URL + item.image }}
        style={styles.image}
        cachePolicy="disk" 
      />
      <View style={styles.infoContainer}>
        <ThemedText style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </ThemedText>
        <Text style={styles.category}>{item.category} </Text>
      </View>
      <View
        style={[
          styles.footer,
          {
            backgroundColor:
              colorScheme === "dark" ? "#202020" : "rgb(245, 245, 245)",
          },
        ]}
      >
        <ThemedText style={styles.price}>
          {item.price}
          <Text style={styles.currency}> ETB</Text>
        </ThemedText>
        {cardStatus === "Order" && (
          <View style={styles.counterContainer}>
            {count > 0 && (
              <>
                <TouchableOpacity onPress={onRemove} style={styles.iconButton}>
                  <Entypo name="minus" size={18} color="white" />
                </TouchableOpacity>
                <ThemedText style={styles.countText}>{count}</ThemedText>
              </>
            )}
            <TouchableOpacity onPress={onAdd} style={styles.iconButton}>
              <AntDesign size={18} name="plus" color="white" />
            </TouchableOpacity>
          </View>
        )}

        {cardStatus === "Menu" && (
          <TouchableOpacity
            onPress={onAdd}
            style={[styles.iconButton, { backgroundColor: "green" }]}
          >
            <Feather name="edit" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  lightCard: {
    backgroundColor: "#FFFFFF",
  },
  darkCard: {
    backgroundColor: "#303030",
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#F6AD55",
  },
  image: {
    width: "100%",
    height: 130,
  },
  infoContainer: {
    padding: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  category: {
    color: "#777",
    fontSize: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    borderRadius: 20,
  },
  price: {
    fontWeight: "bold",
    fontSize: 16,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "#FFA500",
    marginHorizontal: 5,
    width: 25,
    height: 25,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  currency: {
    fontSize: 13,
    color: "#777",
  },
});

export default MenuCard;
