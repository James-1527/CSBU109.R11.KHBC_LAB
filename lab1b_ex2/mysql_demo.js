require('dotenv').config();
const mysql = require('mysql2/promise');

// === Khởi tạo Connection Pool ===
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

// === Hàm setup dữ liệu mẫu ===
async function setupDatabaseAndSeedData(pool) {
  console.log("\n📊 === SETUP DỮ LIỆU MẪU ===\n");

  try {
    // Tạo bảng categories
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng items
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

    // Xóa dữ liệu cũ
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('TRUNCATE TABLE items');
    await pool.execute('TRUNCATE TABLE categories');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Thêm categories
    await pool.execute(`
      INSERT INTO categories (name, description) VALUES
      ('Food', 'Daily essentials and groceries'),
      ('Electronics', 'Gadgets, phones and computers'),
      ('Clothing', 'Apparel and fashion items'),
      ('Books', 'Educational and entertainment books'),
      ('Home & Living', 'Furniture and home appliances'),
      ('Sports & Outdoors', 'Sporting goods and outdoor equipment')
    `);

    // Thêm items
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

    console.log("✅ Dữ liệu mẫu đã được setup\n");

  } catch (error) {
    console.error("❌ Lỗi setup dữ liệu:", error.message);
  }
}

// ============================================
// === QUESTION 1: Filter & Sort ===
// ============================================
async function question1(pool) {
  console.log("\n" + "=".repeat(80));
  console.log("❓ QUESTION 1: Lọc & Sắp xếp");
  console.log("=".repeat(80));
  console.log("📋 Yêu cầu: Lấy sản phẩm có giá >= 500,000 VND AND số lượng > 0");
  console.log("           Sắp xếp theo giá giảm dần (ORDER BY price DESC)\n");

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

    console.log("✅ Kết quả Query:");
    console.table(rows);

    console.log("📌 Giải thích:");
    console.log("   - WHERE price >= 500000: Lọc sản phẩm có giá >= 500,000 VND");
    console.log("   - AND quantity > 0: Chỉ lấy sản phẩm còn hàng (số lượng > 0)");
    console.log("   - ORDER BY price DESC: Sắp xếp theo giá từ cao đến thấp\n");

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ============================================
// === QUESTION 2: Wildcard / LIKE Search ===
// ============================================
async function question2(pool, keyword) {
  console.log("\n" + "=".repeat(80));
  console.log("❓ QUESTION 2: Tìm kiếm với LIKE (Wildcard Search)");
  console.log("=".repeat(80));
  console.log(`📋 Yêu cầu: Tìm sản phẩm có tên chứa từ khóa: "${keyword}"\n`);

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
      console.log(`⚠️ Không tìm thấy sản phẩm chứa từ khóa "${keyword}"\n`);
    } else {
      console.log("✅ Kết quả Query:");
      console.table(rows);

      console.log("📌 Giải thích:");
      console.log(`   - WHERE item_name LIKE '%${keyword}%': Tìm sản phẩm có tên chứa từ khóa`);
      console.log("   - % là wildcard: %keyword% = chứa keyword ở vị trí bất kỳ");
      console.log("   - Dùng Prepared Statement (?) để tránh SQL injection\n");
    }

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ============================================
// === QUESTION 3: Aggregate Functions ===
// ============================================
async function question3(pool) {
  console.log("\n" + "=".repeat(80));
  console.log("❓ QUESTION 3: Hàm Aggregate (SUM, AVG, COUNT)");
  console.log("=".repeat(80));
  console.log("📋 Yêu cầu: Tính tổng số lượng, giá trung bình, tổng số sản phẩm\n");
 
  try {
    // Kiểm tra dữ liệu trước
    const [checkData] = await pool.execute('SELECT COUNT(*) as count FROM items');
    console.log(`ℹ️ Debug: Tổng items trong DB: ${checkData[0].count}`);
 
    // Lấy dữ liệu aggregate
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
 
    console.log("✅ Kết quả Query:\n");
    const result = rows[0];
    
    // Hiển thị kết quả dễ đọc
    console.log("📊 THỐNG KÊ TỔNG QUÁT:");
    console.log(`   Tổng số lượng (SUM): ${result.total_stock_quantity}`);
    console.log(`   Tổng số sản phẩm (COUNT): ${result.total_number_of_items}`);
    console.log(`   Giá trung bình (AVG): ${parseFloat(result.average_price).toFixed(2)} VND`);
    console.log(`   Giá thấp nhất (MIN): ${parseFloat(result.min_price).toFixed(2)} VND`);
    console.log(`   Giá cao nhất (MAX): ${parseFloat(result.max_price).toFixed(2)} VND`);
    console.log(`   Tổng giá trị kho: ${parseFloat(result.total_inventory_value).toFixed(2)} VND`);
 
    console.log("\n📌 Giải thích:");
    console.log("   - SUM(quantity): Cộng tất cả số lượng items");
    console.log("   - AVG(price): Tính giá trung bình = Tổng giá / Số lượng item");
    console.log("   - COUNT(*): Đếm tổng số dòng (items) trong bảng");
    console.log("   - MIN(price) & MAX(price): Tìm giá thấp nhất và cao nhất");
    console.log("   - SUM(price * quantity): Tổng giá trị = giá × số lượng\n");
 
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ============================================
// === QUESTION 4: GROUP BY & HAVING ===
// ============================================
async function question4(pool) {
  console.log("\n" + "=".repeat(80));
  console.log("❓ QUESTION 4: GROUP BY & HAVING (Category Statistics)");
  console.log("=".repeat(80));
  console.log("📋 Yêu cầu: Thống kê theo từng category:");
  console.log("           - Tổng số items");
  console.log("           - Tổng giá trị kho (SUM(price * quantity))");
  console.log("           - Chỉ hiển thị category có tổng giá trị > 10,000,000 VND\n");

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
      console.log("⚠️ Không có category nào có tổng giá trị kho > 10,000,000 VND\n");
    } else {
      console.log("✅ Kết quả Query:");
      console.table(rows);

      console.log("📌 Giải thích:");
      console.log("   - GROUP BY c.id, c.name: Nhóm dữ liệu theo từng category");
      console.log("   - LEFT JOIN: Giữ tất cả category, ngay cả khi không có items");
      console.log("   - COUNT(i.id): Đếm số items trong mỗi category");
      console.log("   - SUM(i.price * i.quantity): Tính tổng giá trị kho");
      console.log("   - HAVING: Lọc những GROUP có tổng giá trị > 10,000,000");
      console.log("             (Chú ý: HAVING dùng sau GROUP BY, WHERE dùng trước)\n");
    }

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ============================================
// === Hàm chính ===
// ============================================
async function main() {
  try {
    console.log("\n🔄 Đang kết nối tới MySQL Database...");
    console.log("✓ Kết nối thành công!\n");

    // Setup dữ liệu
    await setupDatabaseAndSeedData(pool);

    // Chạy các question 1-4
    await question1(pool);
    
    // Q2: Tìm kiếm với 2 từ khóa
    await question2(pool, 'Wireless');
    await question2(pool, 'Gaming');
    
    await question3(pool);
    await question4(pool);

  } catch (error) {
    console.error("❌ Lỗi chính:", error.message);
  } finally {
    await pool.end();
    console.log("\n✓ Đã đóng kết nối MySQL.\n");
  }
}

// Chạy
main();