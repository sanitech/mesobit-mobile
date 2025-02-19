import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Export as individual constants
export const ORDERS = 'orders';
export const MENU_ITEMS = 'menuItems';
export const CATEGORIES = 'categories';
export const PENDING_SYNC = 'pendingSyncOperations';
export const EXTRA_ORDERS = 'extraOrders';
export const USER_TOKEN = 'userToken';
export const USER_INFO = 'userInfo';

// Then create the object
export const STORAGE_KEYS = {
  ORDERS,
  MENU_ITEMS,
  CATEGORIES,
  PENDING_SYNC,
  EXTRA_ORDERS,
  USER_TOKEN,
  USER_INFO,
} as const;

// Add debug logging
const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log(...args);

interface PendingSyncOperation {
  id: string;
  type: 'order' | 'extraOrder' | 'statusUpdate';
  data: any;
  timestamp: number;
}

export const storeData = async (key: string, value: any) => {
  try {
    log('Storing data for key:', key);
    
    if (!key) {
      throw new Error('Storage key is required');
    }
    
    // Store directly with the key string
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    log('Successfully stored data for key:', key);
    
    return true;
  } catch (error) {
    console.error('Error in storeData:', error);
    throw error;
  }
};

export const getData = async (key: string) => {
  try {
    log('Getting data for key:', key);
    
    if (!key) {
      throw new Error('Storage key is required');
    }
    
    const jsonValue = await AsyncStorage.getItem(key);
    log('Retrieved value:', jsonValue);
    
    return jsonValue ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error in getData:', error);
    throw error;
  }
};

export const addPendingSync = async (operation: PendingSyncOperation) => {
  try {
    const pending = await getData(PENDING_SYNC) || [];
    pending.push(operation);
    await storeData(PENDING_SYNC, pending);
  } catch (error) {
    console.error('Error adding pending sync:', error);
  }
};

export const removePendingSync = async (id: string) => {
  try {
    const pending = await getData(PENDING_SYNC) || [];
    const updated = pending.filter((op: PendingSyncOperation) => op.id !== id);
    await storeData(PENDING_SYNC, updated);
  } catch (error) {
    console.error('Error removing pending sync:', error);
  }
};

export const syncWithServer = async () => {
  try {
    const pending = await getData(PENDING_SYNC) || [];
    
    for (const operation of pending) {
      try {
        switch (operation.type) {
          case 'order':
            await axios.post('/orders', operation.data);
            break;
          case 'extraOrder':
            await axios.put(`/orders/extra/${operation.data.orderId}`, operation.data);
            break;
          case 'statusUpdate':
            await axios.put(`/orders/status/${operation.data.orderId}`, operation.data);
            break;
        }
        await removePendingSync(operation.id);
      } catch (error) {
        console.error('Error syncing operation:', error);
      }
    }
  } catch (error) {
    console.error('Error during sync:', error);
  }
};

export const clearAllData = async () => {
  try {
    const keys = [
      ORDERS,
      MENU_ITEMS,
      CATEGORIES,
      PENDING_SYNC,
      EXTRA_ORDERS,
    ];
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}; 