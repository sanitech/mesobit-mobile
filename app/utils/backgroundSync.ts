import { syncManager } from "./syncManager";

const startBackgroundSync = () => {
  setInterval(async () => {
    try {
      await syncManager.syncDataWithRetry();
      console.log("Background sync executed.");
    } catch (error) {
      console.error("Background sync failed:", error);
    }
  }, 15 * 60 * 1000); // 15 minutes
};

export default startBackgroundSync;
