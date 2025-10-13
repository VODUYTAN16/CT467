import { pool } from '../config/db.js';

// Tạo thanh toán -> Trigger sẽ tự gia hạn subscription
export async function create(req, res, next) {
  try {
    const { subscription_id, amount, note } = req.body;
    const [rs] = await pool.query(
      `INSERT INTO payments(subscription_id, amount, note)
       VALUES(:subscription_id, :amount, :note)`,
      { subscription_id, amount, note }
    );
    res.status(201).json({
      payment_id: rs.insertId,
      message: 'Payment recorded. Subscription auto-extended by trigger.',
    });
  } catch (e) {
    next(e);
  }
}

// Danh sách thanh toán có filter ngày
export async function list(req, res, next) {
  try {
    const { from, to } = req.query; // YYYY-MM-DD
    let sql = `SELECT pay.*, s.member_id, s.package_id
               FROM payments pay
               JOIN subscriptions s ON s.subscription_id = pay.subscription_id
               WHERE 1=1`;
    const params = {};
    if (from) {
      sql += ' AND DATE(pay.paid_at) >= :from';
      params.from = from;
    }
    if (to) {
      sql += ' AND DATE(pay.paid_at) <= :to';
      params.to = to;
    }
    sql += ' ORDER BY pay.paid_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [[row]] = await pool.query(
      `SELECT pay.*, s.member_id, s.package_id
       FROM payments pay
       JOIN subscriptions s ON s.subscription_id = pay.subscription_id
       WHERE pay.payment_id = :id`,
      { id }
    );
    if (!row) return res.status(404).json({ message: 'Payment not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
}

export async function listBySubscription(req, res, next) {
  try {
    const subscriptionId = Number(req.params.subscriptionId);
    const [rows] = await pool.query(
      `SELECT * FROM payments WHERE subscription_id = :subscriptionId ORDER BY paid_at DESC`,
      { subscriptionId }
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [rs] = await pool.query(
      `DELETE FROM payments WHERE payment_id = :id`,
      { id }
    );
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Deleted', payment_id: id });
  } catch (e) {
    next(e);
  }
}
