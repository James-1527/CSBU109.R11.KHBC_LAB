const pool = require('../config/db');
const httpError = require('../utils/httpError');

const getOrderHistory = async (id) => {
  const [[customer]] = await pool.query(
    'SELECT id, full_name, email, phone FROM customers WHERE id = ?',
    [id]
  );
  if (!customer) throw httpError(404, 'Customer not found');

  const [orders] = await pool.query(
    `SELECT id AS order_id, status, total_amount, created_at
     FROM orders
     WHERE customer_id = ?
     ORDER BY created_at DESC`,
    [id]
  );

  const [[{ totalLifetimeSpent }]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalLifetimeSpent
     FROM orders
     WHERE customer_id = ? AND status = 'completed'`,
    [id]
  );

  return {
    customer,
    orders,
    totalLifetimeSpent: Number(totalLifetimeSpent),
  };
};

module.exports = { getOrderHistory };