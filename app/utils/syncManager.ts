import axios from "axios";
import { openDB } from "@/utils/sqliteHelper"; // Adjust the import based on your structure

class SyncManager {
  private maxRetries = 3;
  private API_URL = "/orders/sync"; // Replace with your actual API URL

  // Implement background sync
  async syncData() {
    const db = await openDB();

    try {
      // Step 3: Push local changes to the server
      const unsyncedOrders = await db.getAllAsync(
        `SELECT * FROM orders WHERE synced = false`
      );
      const unsyncedOrderItems = await db.getAllAsync(
        `SELECT * FROM order_items WHERE synced = false`
      );

      console.log(unsyncedOrderItems);

      // Only sync if there are unsynced items
      if (unsyncedOrders.length > 0 || unsyncedOrderItems.length > 0) {
        const res = await axios.post(this.API_URL, {
          orders: unsyncedOrders,
          items: unsyncedOrderItems,
        });

        // Update local sync status
        await db.runAsync(
          `UPDATE orders SET synced = true WHERE synced = false`
        );
        await db.runAsync(
          `UPDATE order_items SET synced = true WHERE synced = false`
        );
        console.log("sync msg", res.data.message);
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      throw new Error("Sync failed: " + error.message);
    }
  }

  // Retry logic for sync
  async syncDataWithRetry(retries = 0) {
    try {
      await this.syncData();
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`Retrying sync... Attempt ${retries + 1}`);
        await new Promise((res) =>
          setTimeout(res, Math.pow(2, retries) * 1000)
        ); // Exponential backoff
        await this.syncDataWithRetry(retries + 1);
      } else {
        console.error("Max retries reached. Sync failed:", error);
      }
    }
  }
}

export const syncManager = new SyncManager();
