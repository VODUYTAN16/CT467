import { pool } from '../config/db.js';

export async function topEquipmentUsage(limit = 10) {
  const [rows] = await pool.query(
    `SELECT eu.equipment_id, e.name, COUNT(*) AS usage_count
     FROM equipment_usage eu
     JOIN equipment e ON e.equipment_id = eu.equipment_id
     GROUP BY eu.equipment_id, e.name
     ORDER BY usage_count DESC
     LIMIT :lim`,
    { lim: Number(limit) }
  );
  return rows;
}

export async function revenueByPackageMonthly() {
  const [rows] = await pool.query(
    `SELECT p.name AS package_name,
            DATE_FORMAT(pay.paid_at, '%Y-%m') AS ym,
            SUM(pay.amount) AS total_revenue
     FROM payments pay
     JOIN subscriptions s ON s.subscription_id = pay.subscription_id
     JOIN packages p ON p.package_id = s.package_id
     GROUP BY p.name, ym
     ORDER BY ym DESC, total_revenue DESC`
  );
  return rows;
}

export async function membersExpiringSoon(days = 7) {
  const [rows] = await pool.query(`CALL sp_members_expiring_soon(:d)`, {
    d: Number(days),
  });
  // mysql2 returns [ [rows], [metadata] ] for CALL, take first result set:
  return rows[0] ?? [];
}
