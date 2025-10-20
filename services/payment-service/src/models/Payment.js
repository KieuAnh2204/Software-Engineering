const db = require('../config/db');

const createPayment = async ({ order_id, amount, status='pending', order_no }) => {
  const res = await db.query(
    `INSERT INTO payment (order_id, amount, status, order_no)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [order_id, amount, status, order_no]
  );
  return res.rows[0];
};

const updatePaymentByOrderNo = async (order_no, fields = {}) => {
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const key in fields) {
    setClauses.push(`${key} = $${i}`);
    values.push(fields[key]);
    i++;
  }
  if (setClauses.length === 0) return null;
  values.push(order_no);
  const q = `UPDATE payment SET ${setClauses.join(', ')}, updated_at = now() WHERE order_no = $${i} RETURNING *`;
  const res = await db.query(q, values);
  return res.rows[0];
};

const getPaymentByOrderNo = async (order_no) => {
  const res = await db.query('SELECT * FROM payment WHERE order_no = $1', [order_no]);
  return res.rows[0];
};

const getPaymentById = async (payment_id) => {
  const res = await db.query('SELECT * FROM payment WHERE payment_id = $1', [payment_id]);
  return res.rows[0];
};

module.exports = {
  createPayment,
  updatePaymentByOrderNo,
  getPaymentByOrderNo,
  getPaymentById
};
