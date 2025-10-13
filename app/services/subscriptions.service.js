import { pool } from '../config/db.js';

export async function createSubscription({
  member_id,
  package_id,
  start_date,
}) {
  // Tính end_date theo duration_months của package
  const [[pkg]] = await pool.query(
    'SELECT duration_months FROM packages WHERE package_id = :pid',
    { pid: package_id }
  );
  if (!pkg)
    throw Object.assign(new Error('Package not found'), { status: 404 });

  const [rs] = await pool.query(
    `INSERT INTO subscriptions(member_id, package_id, start_date, end_date, status)
     VALUES(:mid, :pid, :start, DATE_ADD(:start, INTERVAL :months MONTH), 'Đang hoạt động')`,
    {
      mid: member_id,
      pid: package_id,
      start: start_date,
      months: pkg.duration_months,
    }
  );
  return rs.insertId;
}

export async function payAndAutoExtend({ subscription_id, amount, note }) {
  // Trigger sẽ tự gia hạn khi insert vào payments
  const [rs] = await pool.query(
    `INSERT INTO payments(subscription_id, amount, note) VALUES(:sid, :amount, :note)`,
    { sid: subscription_id, amount, note }
  );
  return rs.insertId;
}
