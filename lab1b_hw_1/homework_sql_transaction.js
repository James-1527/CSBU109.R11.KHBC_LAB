const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',          // replace with your MySQL user
  password: 'AnhTuan@1502', // replace with your password
  database: 'store_transaction_db'
};

async function placeOrder(customerId, productId, quantity) {
  const conn = await mysql.createConnection(dbConfig);

  try {
    await conn.beginTransaction();

    // Read and lock the rows so two transactions can't corrupt the numbers at the same time
    const [customers] = await conn.query(
      'SELECT id, balance FROM customers WHERE id = ? FOR UPDATE',
      [customerId]
    );
    const [products] = await conn.query(
      'SELECT id, price, stock FROM products WHERE id = ? FOR UPDATE',
      [productId]
    );

    if (customers.length === 0) throw new Error('Customer not found');
    if (products.length === 0) throw new Error('Product not found');

    const customer = customers[0];
    const product = products[0];
    const price = Number(product.price);
    const total = Number((price * quantity).toFixed(2));

    // Step 1: Check balance and stock
    if (Number(customer.balance) < total) {
      throw new Error('Insufficient balance');
    }
    if (product.stock < quantity) {
      throw new Error('Out of stock');
    }

    // Step 2: Deduct the amount from the customer's balance
    await conn.query(
      'UPDATE customers SET balance = balance - ? WHERE id = ?',
      [total, customerId]
    );

    // Step 3: Deduct the quantity from the product's stock
    await conn.query(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [quantity, productId]
    );

    // Step 4: Insert the order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, total_amount, created_at) VALUES (?, ?, NOW())',
      [customerId, total]
    );
    const orderId = orderResult.insertId;

    // Step 5: Insert the order line item
    await conn.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [orderId, productId, quantity, price]
    );

    await conn.commit();
    console.log(`Order #${orderId} placed successfully. Total: ${total}`);
    return orderId;
  } catch (err) {
    await conn.rollback();
    console.error(`Transaction rolled back: ${err.message}`);
    return null;
  } finally {
    await conn.end();
  }
}

// Test runs
(async () => {
  // Valid order: An Tran (id 1) buys 2 keyboards (id 1)
  await placeOrder(1, 1, 2);

  // Invalid: Binh Le (id 2) has 50 but the keyboard costs 100 -> rollback
  await placeOrder(2, 1, 1);

  // Invalid: out of stock (USB-C Cable has 2, buying 5) -> rollback
  await placeOrder(1, 2, 5);
})();