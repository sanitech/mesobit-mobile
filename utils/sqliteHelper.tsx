import * as SQLite from 'expo-sqlite';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

export const openDB = async () => {
  const db = await SQLite.openDatabaseAsync('mesobitsdb2.db');

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
        tax REAL,
        delivery_fee REAL,
        takeaway_fee REAL,
        total_amount REAL,
        status TEXT DEFAULT 'Pending',
        synced INTEGER DEFAULT 0, 
        orderAt TEXT DEFAULT CURRENT_TIMESTAMP
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
        options LONGTEXT
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

export const addMenuToDbFromApi = async (menuItems: { 
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
}[]) => {
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
          item.rating || null
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
  const result = await db.getAllAsync('SELECT * FROM menu_items ORDER BY created_at DESC');
  return result as MenuItem[];
};

// Add order (stores locally first)
export const addOrder = async (
  vendorId: string,
  items: { 
    item_id: string; 
    item_name: string; 
    count: number; 
    original_price: number; 
  }[], // Define a more specific type for items
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
  const [lastOrder] = await db.getAllAsync(
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

  // Generate order ID
  const orderId = uuid(); // Use a library like uuid to generate a unique ID

  // Start transaction
    try {
      // Insert the order into the orders table
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
          'Pending', // Default status
          0 // Default synced value
        ]
      );

      // Insert each item into the order_items table
      for (const item of items) {
        await db.runAsync(
          `INSERT INTO order_items (order_id, vendor_id, item_id, item_name, count, original_price) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            vendorId,
            item.item_id,
            item.item_name,
            item.count,
            item.original_price
          ]
        );
      }

      console.log(`Inserted order with ID: ${orderId}`);
    } catch (error) {
      console.error('Error inserting order:', error.message); // Log the specific error message
      throw new Error("Failed to create order: " + error.message); // Include the error message in the thrown error
    }

  return orderId; // Return the order ID or any other relevant information
};

// Get all orders for today
export const getOrdersToday = async (): Promise<any[]> => {
  const db = await openDB();

  try {
    const orders = await db.getAllAsync(
      `SELECT * FROM orders 
       WHERE DATE(orderAt) = DATE('now')`
    );
    return orders; // Return the list of orders for today
  } catch (error) {
    console.error('Error fetching orders for today:', error);
    throw new Error("Failed to fetch today's orders: " + error.message);
  }
};
