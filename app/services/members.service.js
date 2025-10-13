import { pool } from '../config/db.js';

export async function getAllMembers() {
  const [rows] = await pool.query(
    'SELECT * FROM members ORDER BY created_at DESC'
  );
  return rows;
}

export async function createMember(payload) {
  const { full_name, dob, gender, phone, address } = payload;
  const [rs] = await pool.query(
    `INSERT INTO members(full_name, dob, gender, phone, address)
     VALUES(:full_name, :dob, :gender, :phone, :address)`,
    { full_name, dob, gender, phone, address }
  );
  return { member_id: rs.insertId, ...payload };
}

export async function isExpiringIn7Days(memberId) {
  const [[row]] = await pool.query(
    'SELECT fn_is_member_expiring_7(:id) AS expiring',
    { id: memberId }
  );
  return !!row.expiring;
}
