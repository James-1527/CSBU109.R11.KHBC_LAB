const pool = require('../config/db');
const httpError = require('../utils/httpError');

// Hoàn trả stock cho mọi item của một đơn (dùng bên trong transaction)
const restoreStock = async (conn, orderId) => {
  const [items] = await conn.query(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );
  for (const it of items) {
    await conn.query(
      'UPDATE products SET stock = stock + ? WHERE id = ?',
      [it.quantity, it.product_id]
    );
  }
};

const getOrderById = async (id) => {
  const [[order]] = await pool.query(
    `SELECT o.id, o.status, o.total_amount, o.created_at,
            c.id AS customer_id, c.full_name, c.email, c.phone
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.id = ?`,
    [id]
  );
  if (!order) throw httpError(404, 'Order not found');

  const [items] = await pool.query(
    `SELECT p.product_name, oi.quantity, oi.unit_price,
            (oi.quantity * oi.unit_price) AS subtotal
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [id]
  );

  return {
    id: order.id,
    status: order.status,
    total_amount: order.total_amount,
    created_at: order.created_at,
    customer: {
      id: order.customer_id,
      full_name: order.full_name,
      email: order.email,
      phone: order.phone,
    },
    items,
  };
};

const createOrder = async (customerId, items) => {
  // Gộp các dòng trùng productId để kiểm tra stock đúng
  const merged = new Map();
  for (const it of items) {
    merged.set(it.productId, (merged.get(it.productId) || 0) + it.quantity);
  }
  const productIds = [...merged.keys()];

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [customers] = await conn.query('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (customers.length === 0) throw httpError(404, 'Customer not found');

    const [products] = await conn.query(
      'SELECT id, product_name, price, stock FROM products WHERE id IN (?) FOR UPDATE',
      [productIds]
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    for (const [productId, qty] of merged) {
      const p = byId.get(productId);
      if (!p) throw httpError(404, `Product ${productId} not found`);
      if (p.stock < qty) throw httpError(400, `${p.product_name} is out of stock`);
      total += Number(p.price) * qty;
    }

    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, status, total_amount) VALUES (?, ?, ?)',
      [customerId, 'pending', total.toFixed(2)]
    );
    const orderId = orderResult.insertId;

    for (const [productId, qty] of merged) {
      const p = byId.get(productId);
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, productId, qty, p.price]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, productId]);
    }

    await conn.commit();
    return getOrderById(orderId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const listOrders = async ({ status, customerId, page, limit }) => {
  const where = [];
  const params = [];
  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  if (customerId) {
    where.push('o.customer_id = ?');
    params.push(customerId);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o ${whereSql}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT o.id AS order_id, c.full_name AS customer_name, c.email, o.status,
            o.total_amount, COALESCE(SUM(oi.quantity), 0) AS total_items_count, o.created_at
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${whereSql}
     GROUP BY o.id, c.full_name, c.email, o.status, o.total_amount, o.created_at
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const updateStatus = async (id, newStatus) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[order]] = await conn.query(
      'SELECT id, status FROM orders WHERE id = ? FOR UPDATE',
      [id]
    );
    if (!order) throw httpError(404, 'Order not found');
    if (order.status === 'cancelled') throw httpError(400, 'Order is already cancelled');

    if (newStatus === 'cancelled') {
      await restoreStock(conn, id);
    }

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, id]);
    await conn.commit();
    return getOrderById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const deleteOrder = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[order]] = await conn.query(
      'SELECT id, status FROM orders WHERE id = ? FOR UPDATE',
      [id]
    );
    if (!order) throw httpError(404, 'Order not found');

    if (order.status !== 'cancelled') {
      await restoreStock(conn, id);
    }

    // order_items bị xóa tự động nhờ ON DELETE CASCADE
    await conn.query('DELETE FROM orders WHERE id = ?', [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const salesSummary = async () => {
  const [[summary]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue,
            COUNT(*) AS completedOrdersCount,
            COALESCE(AVG(total_amount), 0) AS averageOrderValue
     FROM orders
     WHERE status = 'completed'`
  );

  const [top] = await pool.query(
    `SELECT p.id AS productId, p.product_name AS productName,
            SUM(oi.quantity) AS totalQuantitySold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.status = 'completed'
     GROUP BY p.id, p.product_name
     ORDER BY totalQuantitySold DESC
     LIMIT 3`
  );

  return {
    totalRevenue: Number(summary.totalRevenue),
    completedOrdersCount: summary.completedOrdersCount,
    averageOrderValue: Number(summary.averageOrderValue),
    topSellingProducts: top.map((r) => ({
      ...r,
      totalQuantitySold: Number(r.totalQuantitySold),
    })),
  };
};

module.exports = {
  createOrder,
  getOrderById,
  listOrders,
  updateStatus,
  deleteOrder,
  salesSummary,
};