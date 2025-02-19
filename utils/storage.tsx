import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function setStorageItemAsync(key: any, value: any) {
  if (value == null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getStorageItemAsync(key: any) {
  return await SecureStore.getItemAsync(key);
}

export async function removeStorageItemAsync(key: any) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.error("Error removing item from secure store:", err);
    throw err;
  }
}

export async function clearStorageAsync() {
  try {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userPin");
    await AsyncStorage.clear();
  } catch (err) {
    console.error("Error clearing secure store:", err);
    throw err;
  }
}