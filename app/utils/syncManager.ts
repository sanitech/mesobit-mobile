import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Keys for storage
export const STORAGE_KEYS = {
  PENDING_ORDERS: 'pendingOrders',
  SYNCED_ORDERS: 'syncedOrders',
  SYNC_QUEUE: 'syncQueue',
} as const;

// Types for sync status
export type SyncStatus = 'pending' | 'synced' | 'failed';

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  type: 'order' | 'extraOrder';
  data: any;
  attempts: number;
  lastAttempt?: number;
  status: SyncStatus;
}

class SyncManager {
  private maxRetries = 3;

  // Store data locally and queue for sync
  async saveOrder(orderData: any): Promise<{ success: boolean; orderId: string; error?: string }> {
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const orderWithId = { ...orderData, id: orderId, syncStatus: 'pending' as SyncStatus };

      // Save to pending orders
      const pendingOrders = await this.getPendingOrders();
      pendingOrders.push(orderWithId);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(pendingOrders));

      // Add to sync queue
      await this.addToSyncQueue({
        id: orderId,
        action: 'create',
        type: 'order',
        data: orderWithId,
        attempts: 0,
        status: 'pending'
      });

      // Try immediate sync
      try {
        const response = await axios.post('/orders', orderWithId);
        if (response.data?.order_id) {
          await this.updateOrderStatus(orderId, 'synced', response.data.order_id);
        }
      } catch (error) {
        console.error('Failed immediate sync:', error);
      }

      return { success: true, orderId };
    } catch (error) {
      console.error('Error saving order:', error);
      return { 
        success: false, 
        orderId: '', 
        error: error instanceof Error ? error.message : 'Failed to save order' 
      };
    }
  }

  // Get all pending orders
  private async getPendingOrders(): Promise<any[]> {
    try {
      const orders = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ORDERS);
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error('Error getting pending orders:', error);
      return [];
    }
  }

  // Get all synced orders
  private async getSyncedOrders(): Promise<any[]> {
    try {
      const orders = await AsyncStorage.getItem(STORAGE_KEYS.SYNCED_ORDERS);
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error('Error getting synced orders:', error);
      return [];
    }
  }

  // Add item to sync queue
  private async addToSyncQueue(item: SyncQueueItem) {
    try {
      const queue = await this.getSyncQueue();
      queue.push(item);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  // Get sync queue
  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  // Update sync status of an item
  private async updateOrderStatus(id: string, status: SyncStatus, serverId?: string) {
    try {
      const queue = await this.getSyncQueue();
      const updatedQueue = queue.map(item => 
        item.id === id ? { ...item, status, server_id: serverId } : item
      );
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));

      // Move from pending to synced if status is synced
      if (status === 'synced') {
        const pendingOrders = await this.getPendingOrders();
        const syncedOrders = await this.getSyncedOrders();
        
        const orderIndex = pendingOrders.findIndex(o => o.id === id);
        if (orderIndex !== -1) {
          const [order] = pendingOrders.splice(orderIndex, 1);
          order.server_id = serverId;
          order.syncStatus = 'synced';
          syncedOrders.push(order);
          
          await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(pendingOrders));
          await AsyncStorage.setItem(STORAGE_KEYS.SYNCED_ORDERS, JSON.stringify(syncedOrders));
        }
      }
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  // Get all orders (both pending and synced)
  async getAllOrders() {
    try {
      const pendingOrders = await this.getPendingOrders();
      const syncedOrders = await this.getSyncedOrders();
      return [...pendingOrders, ...syncedOrders];
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  }
}

export const syncManager = new SyncManager(); 