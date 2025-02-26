import { syncManager } from "@/app/utils/syncManager";
import * as SQLite from "expo-sqlite";
import "react-native-get-random-values";
import { v4 as uuid } from "uuid";

// Define the MenuItem type
export type MenuItem = {
  item_id: string;
  category_id: string;
  vendor_id: string;
  item_name: string;
  description?: string;
  original_price: number;
  price: number;
  image_url?: string;
  nutritional_info?: string;
  allergens?: string;
  availability_schedule?: string;
  available?: number;
  rating?: number;
};

export const openDB = async () => {
  const db = await SQLite.openDatabaseAsync("mesobitsdb4.db");

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id CHAR(36), 
        order_local_id VARCHAR(255),
        vendor_id TEXT,
        order_type TEXT,
        count_item INTEGER,
        staff_id TEXT,
        table_num TEXT,
        delivery_info TEXT,
        total_price REAL,
        discount_percent REAL,
        discount_amount REAL,
        cancel_reason REAL,
        cancel_at TEXT,
        tax REAL,
        delivery_fee REAL,
        takeaway_fee REAL,
        total_amount REAL,
        status TEXT DEFAULT 'Pending',
        synced INTEGER DEFAULT 0, 
        orderAt TEXT DEFAULT CURRENT_TIMESTAMP,
        completedAt TEXT
      );`
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS order_items (
        order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id CHAR(36),
        vendor_id CHAR(36),
        item_id CHAR(36),
        item_name VARCHAR(255),
        count INT,
        original_price DECIMAL(10, 2),
        options LONGTEXT,
        synced INTEGER DEFAULT 0
      );`
  );

  // Create the menu_items table with the specified schema
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS menu_items (
        item_id CHAR(36) PRIMARY KEY,
        category_id CHAR(36),
        vendor_id CHAR(36),
        item_name VARCHAR(255),
        description TEXT,
        original_price DECIMAL(10, 2),
        price DECIMAL(10, 2),
        image_url VARCHAR(255),
        nutritional_info LONGTEXT,
        allergens LONGTEXT,
        availability_schedule LONGTEXT,
        available TINYINT(1),
        rating DECIMAL(3, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
  );

  return db;
};

export const addMenuToDbFromApi = async (
  menuItems: {
    item_id: string;
    category_id: string;
    vendor_id: string;
    item_name: string;
    description?: string;
    original_price: number;
    price: number;
    image_url?: string;
    nutritional_info?: string;
    allergens?: string;
    availability_schedule?: string;
    available?: number;
    rating?: number;
  }[]
) => {
  const db = await openDB();

  for (const item of menuItems) {
    // Check if the item already exists
    const existingItem = await db.getFirstAsync(
      `SELECT * FROM menu_items WHERE item_id = ?`,
      [item.item_id]
    );

    if (!existingItem) {
      // Insert new item if it doesn't exist
      await db.runAsync(
        `INSERT INTO menu_items (item_id, category_id, vendor_id, item_name, description, original_price, price, image_url, nutritional_info, allergens, availability_schedule, available, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.item_id,
          item.category_id,
          item.vendor_id,
          item.item_name,
          item.description || null,
          item.original_price,
          item.price,
          item.image_url || null,
          item.nutritional_info || null,
          item.allergens || null,
          item.availability_schedule || null,
          item.available || 0,
          item.rating || null,
        ]
      );
      console.log(`Inserted ${item.item_name} into menu_items`);
    } else {
      console.log(`Item ${item.item_name} already exists, skipping insertion.`);
    }
  }
};

export const getMenuFromDb = async (): Promise<MenuItem[]> => {
  const db = await openDB();
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM menu_items ORDER BY created_at DESC"
    );
    return result as MenuItem[];
  } catch (error) {
    console.error("Error fetching menu from database:", error);
    throw new Error("Failed to fetch menu items: " + (error as Error).message);
  }
};

// Add order (stores locally first)
export const addOrder = async (
  vendorId: string,
  items: {
    item_id: string;
    item_name: string;
    count: number;
    original_price: number;
  }[],
  totalPrice: number,
  orderType: string,
  staffId: string,
  tableNum: string | null,
  deliveryInfo: string | null,
  discountPercent: number,
  discountAmount: number,
  tax: number,
  deliveryFee: number,
  takeawayFee: number,
  totalAmount: number
): Promise<string> => {
  const db = await openDB();

  // Validate required fields
  if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Missing required fields: vendor_id and items array");
  }

  // Generate new order local ID
  let newOrderLocalId = "#001";
  const lastOrder = await db.getAllAsync(
    `SELECT order_local_id 
     FROM orders 
     WHERE vendor_id = ? AND DATE(orderAt) = DATE('now') 
     ORDER BY orderAt DESC LIMIT 1`,
    [vendorId]
  );

  if (lastOrder && lastOrder.length > 0) {
    const lastId = parseInt(lastOrder[0].order_local_id.slice(2), 10);
    const nextId = lastId + 1;
    newOrderLocalId = `#${String(nextId).padStart(3, "0")}`;
  }

  const orderId = uuid(); // Use a library like uuid to generate a unique ID

  // Start transaction
  try {
    await db.runAsync(
      `INSERT INTO orders (order_id, order_local_id, vendor_id, order_type, count_item, staff_id, table_num, delivery_info, total_price, discount_percent, discount_amount, tax, delivery_fee, takeaway_fee, total_amount, status, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        newOrderLocalId,
        vendorId,
        orderType,
        items.length,
        staffId,
        tableNum,
        deliveryInfo,
        totalPrice,
        discountPercent,
        discountAmount,
        tax,
        deliveryFee,
        takeawayFee,
        totalAmount,
        "Pending", // Default status
        0, // Default synced value
      ]
    );

    for (const item of items) {
      await db.runAsync(
        `INSERT INTO order_items (order_id, vendor_id, item_id, item_name, count, original_price) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          vendorId,
          item.item_id,
          item.item_name,
          item.count,
          item.original_price,
        ]
      );
    }

    console.log(`Inserted order with ID: ${orderId}`);
  } catch (error) {
    console.error("Error inserting order:", error);
    throw new Error("Failed to create order: " + (error as Error).message);
  }

  return orderId; // Return the order ID or any other relevant information
};

// Get all orders for today along with their items
export const getOrdersToday = async (): Promise<any[]> => {
  const db = await openDB();

  try {
    const orders = await db.getAllAsync(
      `SELECT o.*, oi.item_id, oi.item_name, oi.count, oi.original_price 
       FROM orders o
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       WHERE DATE(o.orderAt) = DATE('now')
       ORDER BY o.orderAt DESC`
    );

    // Structure the results to group items by order
    const structuredOrders = orders.reduce((acc: any[], order: any) => {
      const existingOrder = acc.find((o) => o.order_id === order.order_id);
      if (existingOrder) {
        // If the order already exists, push the item to its items array
        existingOrder.items.push({
          item_id: order.item_id,
          item_name: order.item_name,
          count: order.count,
          original_price: order.original_price,
        });
      } else {
        // If the order does not exist, create a new order object
        acc.push({
          order_id: order.order_id,
          order_local_id: order.order_local_id,
          vendor_id: order.vendor_id,
          order_type: order.order_type,
          count_item: order.count_item,
          staff_id: order.staff_id,
          table_num: order.table_num,
          delivery_info: order.delivery_info,
          total_price: order.total_price,
          discount_percent: order.discount_percent,
          discount_amount: order.discount_amount,
          cancel_reason: order.cancel_reason,
          cancel_at: order.cancel_at,
          tax: order.tax,
          delivery_fee: order.delivery_fee,
          takeaway_fee: order.takeaway_fee,
          total_amount: order.total_amount,
          status: order.status,
          synced: order.synced,
          orderAt: order.orderAt,
          completedAt: order.completedAt,
          items: [
            {
              item_id: order.item_id,
              item_name: order.item_name,
              count: order.count,
              original_price: order.original_price,
            },
          ],
        });
      }
      return acc;
    }, []);

    return structuredOrders; // Return the structured orders with items
  } catch (error) {
    console.error("Error fetching orders for today:", error);
    throw new Error("Failed to fetch today's orders: " + error.message);
  }
};

//
export const getOrdersOnDay = async (): Promise<any[]> => {
  const db = await openDB();
  const result = await db.getAllAsync(
    `SELECT * FROM orders WHERE DATE(orderAt) = DATE('now')`
  );
  return result as any[];
};

// Get order by order_id
export const getOrderById = async (orderId: string): Promise<any> => {
  const db = await openDB();

  try {
    const order = await db.getAllAsync(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderId]
    );
    return order; // Return the order object
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw new Error("Failed to fetch order: " + error.message);
  }
};

// Get order details by order_id
export const getOrderDetailsById = async (orderId: string): Promise<any> => {
  const db = await openDB();

  try {
    // Fetch the order details
    const order = await db.getFirstAsync(
      `SELECT * FROM orders WHERE order_id = ?`,
      [orderId]
    );

    // Fetch the associated order items
    const items = await db.getAllAsync(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    // Combine order details with items
    return { ...order, items }; // Return the order object with items
  } catch (error) {
    console.error("Error fetching order details by ID:", error);
    throw new Error("Failed to fetch order details: " + error.message);
  }
};

// Update order status by order_id
export const updateOrderStatus = async (
  orderId: string,
  newStatus: string
): Promise<void> => {
  const db = await openDB();

  try {
    const completedAt =
      newStatus === "completed" ? new Date().toISOString() : null;

    await db.runAsync(
      `UPDATE orders 
       SET status = ?, completedAt = ?, synced = 0
       WHERE order_id = ?`,
      [newStatus, completedAt, orderId]
    );
    if (completedAt) {
      await syncManager.syncDataWithRetry();
    }

    console.log(`Updated order ID: ${orderId} to status: ${newStatus}`);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Failed to update order status: " + error.message);
  }
};

// Add extra items to an existing order
export const addExtraOrderItems = async (
  orderId: string,
  items: {
    item_id: string;
    item_name: string;
    quantity: number;
    original_price: number;
  }[],
  totalPrice: number,
  countItems: number
): Promise<void> => {
  const db = await openDB();

  try {
    // Start transaction
    await db.runAsync("BEGIN TRANSACTION");

    // Delete existing items for this order
    await db.runAsync(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);

    // Update order total and count
    await db.runAsync(
      `UPDATE orders 
       SET total_price = ?, count_item =  ?, synced =  0
       WHERE order_id = ?`,
      [totalPrice, countItems, orderId]
    );

    // Insert each new item into the order_items table
    const insertOrderItemQuery = `
      INSERT INTO order_items   
      (order_id, item_id, item_name, count, original_price) 
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const item of items) {
      await db.runAsync(insertOrderItemQuery, [
        orderId,
        item.item_id,
        item.item_name,
        item.quantity,
        item.original_price,
      ]);
    }

    // Commit transaction
    await db.runAsync("COMMIT");
    console.log(`Added ${items.length} extra items to order ID: ${orderId}`);
  } catch (error) {
    // Rollback in case of error
    await db.runAsync("ROLLBACK");
    console.error("Error adding extra items to order:", error);
    throw new Error("Failed to add extra items to order: " + error.message);
  }
};

// Cancel an order by order_id with a reason
export const cancelOrder = async (
  orderId: string,
  reason: string
): Promise<void> => {
  const db = await openDB();

  try {
    await db.runAsync(
      `UPDATE orders SET status = 'cancelled', cancel_reason = ?, cancel_at = ?, synced = 0 WHERE order_id = ?`,
      [reason, new Date().toISOString(), orderId]
    );
    console.log(`Cancelled order with ID: ${orderId} for reason: ${reason}`);
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw new Error("Failed to cancel order: " + error.message);
  }
};

// Function to add dashboard stats
export const addDashboardStats = async (stats: {
  today_orders: number;
  today_revenue: number;
  pending_orders: number;
  active_orders: number;
}) => {
  const db = await openDB();
  const id = uuid(); // Generate a unique ID

  await db.runAsync(
    `INSERT INTO dashboard_stats (id, today_orders, today_revenue, pending_orders, active_orders) VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      stats.today_orders,
      stats.today_revenue,
      stats.pending_orders,
      stats.active_orders,
    ]
  );

  console.log(`Inserted dashboard stats with ID: ${id}`);
};

// Function to get today's dashboard statistics
export const getDashboardStats = async (vendorId: string, staffId: string) => {
  const db = await openDB();

  try {
    // Get today's orders with status counts and revenue
    const orderStats = await db.getAllAsync(
      `SELECT 
        COUNT(*) as todayOrders,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingOrders,
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
        strftime('%H:%M', o.orderAt) as time,   
        o.status,
        o.order_id
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
        orderId: order.order_id,
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
