import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Entypo, AntDesign } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Image } from "expo-image";

interface MenuCardProps {
  item: {
    id: string;
    title: string;
    price: number;
    image: string;
    category: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  cardStatus: string;
  originalQuantity?: number;
}

const ExtraOrderMenuCard: React.FC<MenuCardProps> = ({
  item,
  isSelected,
  onSelect,
  count,
  onAdd,
  onRemove,
  cardStatus,
  originalQuantity,
}) => {
  const colorScheme = useColorScheme();

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.card,
        colorScheme === "dark" ? styles.darkCard : styles.lightCard,
        isSelected && styles.selectedCard,
      ]}
    >
      {originalQuantity > 0 && (
        <View style={styles.originalQuantityBadge}>
          <Text style={styles.originalQuantityText}>
            Original: x{originalQuantity}
          </Text>
        </View>
      )}

      <Image
        source={{ uri: process.env.EXPO_PUBLIC_IMAGE_URL + item.image }}
        style={styles.image}
        cachePolicy={"disk"}
      />

      <View style={styles.infoContainer}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <Text style={styles.category}>{item.category}</Text>
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
          {item.price} <Text style={styles.currency}>ETB</Text>
        </ThemedText>

        <View style={styles.counterContainer}>
          {(count > 0 || originalQuantity > 0) && (
            <>
              <TouchableOpacity
                onPress={onRemove}
                style={[
                  styles.iconButton,
                  originalQuantity > 0 && !count && styles.disabledButton,
                ]}
                disabled={originalQuantity > 0 && !count}
              >
                <Entypo name="minus" size={18} color="white" />
              </TouchableOpacity>
              <ThemedText style={styles.countText}>
                {originalQuantity > 0
                  ? count > 0
                    ? `${originalQuantity} + ${count}`
                    : originalQuantity
                  : count}
              </ThemedText>
            </>
          )}
          <TouchableOpacity onPress={onAdd} style={styles.iconButton}>
            <AntDesign name="plus" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ExtraOrderMenuCard;

// Move styles outside of component
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
    fontSize: 12,
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
    minWidth: 30,
    textAlign: "center",
  },
  currency: {
    fontSize: 13,
    color: "#777",
  },
  originalQuantityBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#6B7280",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  originalQuantityText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
});
