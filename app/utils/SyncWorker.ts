import { syncManager } from "./syncManager";

const SyncWorker = async () => {
  try {
    await syncManager.syncDataWithRetry();
  } catch (error) {
    console.error("Background sync failed:", error);
  }
};

export default SyncWorker;
