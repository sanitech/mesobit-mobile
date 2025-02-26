import * as SQLite from "expo-sqlite";
import { v4 as uuid } from "uuid";

// Open the database
export const openDB = async () => {
  const db = await SQLite.openDatabaseAsync("mesobitsdb3.db");

  // Create the necessary tables if they don't exist
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id CHAR(36) PRIMARY KEY,
      order_local_id VARCHAR(255),
      vendor_id TEXT,
      order_type TEXT,
      count_item INTEGER,
      staff_id TEXT,
      table_num TEXT,
      delivery_info TEXT,
      total_price REAL,
      status TEXT DEFAULT 'Pending',
      orderAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id CHAR(36),
      item_id CHAR(36),
      item_name VARCHAR(255),
      count INT,
      original_price DECIMAL(10, 2)
    );
  `);

  return db;
};

// Function to get today's dashboard statistics
export const getDashboardStats = async (vendorId: string, staffId: string) => {
  const db = await openDB();

  try {
    // Get today's orders with status counts and revenue
    const orderStats = await db.getAllAsync(
      `SELECT 
        COUNT(*) as todayOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'ready' OR status = 'In Progress' THEN 1 ELSE 0 END) as activeOrders,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as todayRevenue
      FROM orders 
      WHERE vendor_id = ? 
      AND staff_id = ? 
      AND DATE(orderAt) = DATE('now')`,
      [vendorId, staffId]
    );

    // Get popular items for today
    const popularItems = await db.getAllAsync(
      `SELECT 
        oi.item_name as name,
        SUM(oi.count) as count
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.vendor_id = ? 
      AND DATE(o.orderAt) = DATE('now')
      GROUP BY oi.item_name
      ORDER BY count DESC
      LIMIT 5`,
      [vendorId]
    );

    // Get recent orders
    const recentOrders = await db.getAllAsync(
      `SELECT 
        o.order_type as type,
        strftime('%H:%M', o.orderAt) as time,  -- Use strftime to format time
        o.status
      FROM orders o
      WHERE o.vendor_id = ? 
      AND o.staff_id = ? 
      AND DATE(o.orderAt) = DATE('now')
      ORDER BY o.orderAt DESC
      LIMIT 10`,
      [vendorId, staffId]
    );

    return {
      todayOrders: orderStats[0]?.todayOrders || 0,
      todayRevenue: parseFloat(orderStats[0]?.todayRevenue || 0),
      pendingOrders: orderStats[0]?.pendingOrders || 0,
      activeOrders: orderStats[0]?.activeOrders || 0,
      popularItems: popularItems.map((item) => ({
        name: item.name,
        count: parseInt(item.count),
      })),
      recentOrders: recentOrders.map((order) => ({
        type: order.type,
        time: order.time,
        status: order.status,
      })),
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    throw new Error("Failed to fetch dashboard statistics");
  }
};
