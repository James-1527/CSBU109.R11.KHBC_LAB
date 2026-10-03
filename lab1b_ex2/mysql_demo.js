require('dotenv').config();
const mysql = require('mysql2/promise');

// === Initialize Connection Pool ===
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// === Function to Setup Sample Data ===
async function setupDatabaseAndSeedData(pool) {
  console.log("\n📊 === SETUP SAMPLE DATA ===\n");

  try {
    // Create categories table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        item_name VARCHAR(150) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        quantity INT DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      )
    `);

    // Clear old data
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('TRUNCATE TABLE items');
    await pool.execute('TRUNCATE TABLE categories');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Insert categories
    await pool.execute(`
      INSERT INTO categories (name, description) VALUES
      ('Food', 'Daily essentials and groceries'),
      ('Electronics', 'Gadgets, phones and computers'),
      ('Clothing', 'Apparel and fashion items'),
      ('Books', 'Educational and entertainment books'),
      ('Home & Living', 'Furniture and home appliances'),
      ('Sports & Outdoors', 'Sporting goods and outdoor equipment')
    `);

    // Insert items
    await pool.execute(`
      INSERT INTO items (category_id, item_name, price, quantity) VALUES
      (1, 'Apple', 25000.00, 100),
      (1, 'Milk', 32000.00, 50),
      (1, 'Bread', 15000.00, 30),
      (2, 'Smartphone', 5500000.00, 15),
      (2, 'Wireless Mouse', 250000.00, 40),
      (3, 'T-Shirt', 120000.00, 60),
      (3, 'Jeans', 350000.00, 25),
      (4, 'Node.js Programming', 180000.00, 20),
      (5, 'Desk Lamp', 150000.00, 35),
      (5, 'Coffee Mug', 45000.00, 80)
    `);

    console.log("✅ Sample data has been set up\n");

  } catch (error) {
    console.error("❌ Error setting up data:", error.message);
  }
}

// ============================================
// === QUESTION 1: Filter & Sort ===
// ============================================
async function question1(pool) {
  console.log("\n" + "=".repeat(80));
  console.log("❓ QUESTION 1: Filter & Sort");
  console.log("=".repeat(80));
  console.log("📋 Requirement: Get products with price >= 500,000 AND quantity > 0");
  console.log("              Sort by price in descending order (ORDER BY price DESC)\n");

  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        item_name,
        price,
        quantity,
        (price * quantity) as inventory_value
      FROM items 
      WHERE price >= 500000 AND quantity > 0 
      ORDER BY price DESC
    `);

    console.log("✅ Query Results:");
    console.table(rows);

    console.log("📌 Explanation:");
    console.log("   - WHERE price >= 500000: Filter products with price >= 500,000");
    console.log("   - AND quantity > 0: Only get in-stock products (quantity > 0)");
    console.log("   - ORDER BY price DESC: Sort by price from highest to lowest\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// ============================================
// === QUESTION 2: Wildcard / LIKE Search ===
// ============================================
async function question2(pool, keyword) {
  console.log("\n" + "=".repeat(80));
  console.log("❓ QUESTION 2: Search with LIKE (Wildcard Search)");
  console.log("=".repeat(80));
  console.log(`📋 Requirement: Find products with name containing keyword: "${keyword}"\n`);

  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        item_name,
        price,
        quantity
      FROM items 
      WHERE item_name LIKE ?
      ORDER BY item_name ASC
    `, [`%${keyword}%`]);

    if (rows.length === 0) {
      console.log(`⚠️ No products found containing keyword "${keyword}"\n`);
    } else {
      console.log("✅ Query Results:");
      console.table(rows);

      console.log("📌 Explanation:");
      console.log(`   - WHERE item_name LIKE '%${keyword}%': Find products with keyword in name`);
      console.log("   - % is a wildcard: %keyword% = contains keyword at any position");
      console.log("   - Using Prepared Statement (?) to prevent SQL injection\n");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// ============================================
// === QUESTION 3: Aggregate Functions ===
// ============================================
async function question3(pool) {
  console.log("\n" + "=".repeat(80));
  console.log("❓ QUESTION 3: Aggregate Functions (SUM, AVG, COUNT)");
  console.log("=".repeat(80));
  console.log("📋 Requirement: Calculate total quantity, average price, total products\n");
 
  try {
    // Check data first
    const [checkData] = await pool.execute('SELECT COUNT(*) as count FROM items');
    console.log(`ℹ️ Debug: Total items in DB: ${checkData[0].count}`);
 
    // Get aggregate data
    const [rows] = await pool.execute(`
      SELECT 
        SUM(quantity) as total_stock_quantity,
        AVG(price) as average_price,
        COUNT(*) as total_number_of_items,
        MIN(price) as min_price,
        MAX(price) as max_price,
        SUM(price * quantity) as total_inventory_value
      FROM items
    `);
 
    console.log("✅ Query Results:\n");
    const result = rows[0];
    
    // Display results in readable format
    console.log("📊 GENERAL STATISTICS:");
    console.log(`   Total Quantity (SUM): ${result.total_stock_quantity}`);
    console.log(`   Total Products (COUNT): ${result.total_number_of_items}`);
    console.log(`   Average Price (AVG): ${parseFloat(result.average_price).toFixed(2)}`);
    console.log(`   Minimum Price (MIN): ${parseFloat(result.min_price).toFixed(2)}`);
    console.log(`   Maximum Price (MAX): ${parseFloat(result.max_price).toFixed(2)}`);
    console.log(`   Total Inventory Value: ${parseFloat(result.total_inventory_value).toFixed(2)}`);
 
    console.log("\n📌 Explanation:");
    console.log("   - SUM(quantity): Add all quantities of items");
    console.log("   - AVG(price): Calculate average price = Total price / Number of items");
    console.log("   - COUNT(*): Count total number of rows (items) in the table");
    console.log("   - MIN(price) & MAX(price): Find the lowest and highest prices");
    console.log("   - SUM(price * quantity): Total value = price × quantity\n");
 
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// ============================================
// === QUESTION 4: GROUP BY & HAVING ===
// ============================================
async function question4(pool) {
  console.log("\n" + "=".repeat(80));
  console.log("❓ QUESTION 4: GROUP BY & HAVING (Category Statistics)");
  console.log("=".repeat(80));
  console.log("📋 Requirement: Statistics by category:");
  console.log("              - Total number of items");
  console.log("              - Total inventory value (SUM(price * quantity))");
  console.log("              - Only show categories with total value > 10,000,000\n");

  try {
    const [rows] = await pool.execute(`
      SELECT 
        c.id,
        c.name as category_name,
        COUNT(i.id) as total_number_of_items,
        SUM(i.quantity) as total_quantity,
        AVG(i.price) as avg_price,
        SUM(i.price * i.quantity) as total_inventory_value
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id
      GROUP BY c.id, c.name
      HAVING SUM(i.price * i.quantity) > 10000000
      ORDER BY total_inventory_value DESC
    `);

    if (rows.length === 0) {
      console.log("⚠️ No category has total inventory value > 10,000,000\n");
    } else {
      console.log("✅ Query Results:");
      console.table(rows);

      console.log("📌 Explanation:");
      console.log("   - GROUP BY c.id, c.name: Group data by each category");
      console.log("   - LEFT JOIN: Keep all categories, even if they have no items");
      console.log("   - COUNT(i.id): Count the number of items in each category");
      console.log("   - SUM(i.price * i.quantity): Calculate total inventory value");
      console.log("   - HAVING: Filter groups with total value > 10,000,000");
      console.log("             (Note: HAVING is used after GROUP BY, WHERE is used before)\n");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// ============================================
// === Main Function ===
// ============================================
async function main() {
  try {
    console.log("\n🔄 Connecting to MySQL Database...");
    console.log("✓ Connection successful!\n");

    // Setup sample data
    await setupDatabaseAndSeedData(pool);

    // Run questions 1-4
    await question1(pool);
    
    // Q2: Search with 2 keywords
    await question2(pool, 'Wireless');
    await question2(pool, 'Gaming');
    
    await question3(pool);
    await question4(pool);

  } catch (error) {
    console.error("❌ Main error:", error.message);
  } finally {
    await pool.end();
    console.log("\n✓ MySQL connection closed.\n");
  }
}

// Run
main();