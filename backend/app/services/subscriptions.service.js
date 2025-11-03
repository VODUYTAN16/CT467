import { pool } from "../config/db.js";

export async function getSubscriptionsByMemberId(memberId) {
  const [rows] = await pool.query(
    `SELECT
      s.*,
      p.name AS package_name,
      p.price AS package_price
    FROM subscriptions s
    LEFT JOIN packages p ON s.package_id = p.package_id
    WHERE s.member_id = :memberId`,
    { memberId }
  );
  return rows;
}

export async function createSubscription({ member_id, package_id, start_date }) {
  // Tính end_date theo duration_months của package
  const [[pkg]] = await pool.query("SELECT duration_months FROM packages WHERE package_id = :pid", { pid: package_id });
  if (!pkg) throw Object.assign(new Error("Package not found"), { status: 404 });

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
  const [rs] = await pool.query(`INSERT INTO payments(subscription_id, amount, note) VALUES(:sid, :amount, :note)`, { sid: subscription_id, amount, note });
  return rs.insertId;
}

export async function findAllSubscriptions() {
  const [rows] = await pool.query(
    `SELECT
      s.*,
      m.full_name AS member_full_name,
      p.name AS package_name,
      p.duration_months AS package_duration,
      p.price AS package_price
    FROM subscriptions s
    LEFT JOIN members m ON s.member_id = m.member_id
    LEFT JOIN packages p ON s.package_id = p.package_id`
  );

  return rows.map(row => ({
    ...row,
    member: row.member_full_name ? {
      member_id: row.member_id,
      full_name: row.member_full_name,
    } : null,
    package: row.package_name ? {
      package_id: row.package_id,
      name: row.package_name,
      duration: row.package_duration,
      price: row.package_price,
    } : null,
  }));
}

export async function deleteSubscription(id) {
  const [rs] = await pool.query("DELETE FROM subscriptions WHERE subscription_id = :id", { id });
  return rs.affectedRows;
}

export async function findSubscriptionById(id) {
  const [rows] = await pool.query(
    `SELECT
      s.*,
      m.full_name AS member_full_name,
      p.name AS package_name,
      p.duration_months AS package_duration,
      p.price AS package_price,
      p.sessions_per_week AS package_sessions_per_week
    FROM subscriptions s
    LEFT JOIN members m ON s.member_id = m.member_id
    LEFT JOIN packages p ON s.package_id = p.package_id
    WHERE s.subscription_id = :id`,
    { id }
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    ...row,
    member: row.member_full_name ? {
      member_id: row.member_id,
      full_name: row.member_full_name,
    } : null,
    package: row.package_name ? {
      package_id: row.package_id,
      name: row.package_name,
      duration_months: row.package_duration,
      price: row.package_price,
      sessions_per_week: row.package_sessions_per_week,
    } : null,
  };
}

export async function updateSubscription(id, { member_id, package_id, start_date }) {
  let updateFields = [];
  let params = { id };

  if (member_id !== undefined) {
    updateFields.push("member_id = :member_id");
    params.member_id = member_id;
  }
  if (package_id !== undefined) {
    updateFields.push("package_id = :package_id");
    params.package_id = package_id;
  }
  if (start_date !== undefined) {
    updateFields.push("start_date = :start_date");
    params.start_date = start_date;
  }

  // Recalculate end_date if package_id or start_date is updated
  if (package_id !== undefined || start_date !== undefined) {
    const currentSubscription = await findSubscriptionById(id);
    const newPackageId = package_id !== undefined ? package_id : currentSubscription.package_id;
    const newStartDate = start_date !== undefined ? start_date : currentSubscription.start_date;

    if (newPackageId && newStartDate) {
      const [[pkg]] = await pool.query("SELECT duration_months FROM packages WHERE package_id = :pid", { pid: newPackageId });
      if (!pkg) throw Object.assign(new Error("Package not found"), { status: 404 });

      updateFields.push("end_date = DATE_ADD(:newStartDate, INTERVAL :months MONTH)");
      params.newStartDate = newStartDate;
      params.months = pkg.duration_months;
    }
  }

  if (updateFields.length === 0) {
    return 0; // No fields to update
  }

  const [rs] = await pool.query(
    `UPDATE subscriptions SET ${updateFields.join(", ")} WHERE subscription_id = :id`,
    params
  );
  return rs.affectedRows;
}
