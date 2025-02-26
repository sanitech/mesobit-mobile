import * as TaskManager from "expo-task-manager";
import { syncManager } from "./syncManager";

TaskManager.defineTask("BACKGROUND_SYNC_TASK", async () => {
  try {
    await syncManager.syncDataWithRetry();
    console.log("Background sync executed successfully.");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
});
