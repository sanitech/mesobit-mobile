import { StyleSheet, Text, TextInput, View } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";

const SearchBox = ({ placeholder, setSearchText, searchValue }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Feather name="search" size={24} color="black" />
        <TextInput
          placeholder={placeholder}
          style={styles.searchInput}
          onChangeText={setSearchText}
          value={searchValue}
        />
      </View>
      <Feather
        name="filter"
        size={28}
        color="black"
        style={styles.filterIcon}
      />
    </View>
  );
};

export default SearchBox;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 18,
    alignItems: "center",

    gap: 10,
  },
  searchBox: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filterIcon: {
    marginLeft: "auto",
    backgroundColor: "white",
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
});
