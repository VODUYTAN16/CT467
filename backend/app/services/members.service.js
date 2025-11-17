import { pool } from '../config/db.js';

export async function getMemberByPhone(phone) {
  const [[row]] = await pool.query(
    'SELECT * FROM members WHERE phone = :phone',
    { phone }
  );
  return row || null;
}

export async function getAllMembers() {
  const [rows] = await pool.query(
    'SELECT * FROM members ORDER BY created_at DESC'
  );
  return rows;
}

export async function getMemberById(memberId) {
  const [[row]] = await pool.query(
    'SELECT * FROM members WHERE member_id = :id',
    { id: memberId }
  );
  return row || null;
}

export async function updateMember(memberId, payload) {
  const { full_name, dob, gender, phone, address } = payload;
  await pool.query(
    `UPDATE members SET full_name = :full_name, dob = :dob, gender = :gender, phone = :phone, address = :address WHERE member_id = :member_id`,
    { full_name, dob, gender, phone, address, member_id: memberId }
  );
  return { member_id: memberId, ...payload };
}

export async function deleteMember(memberId) {
  const [rs] = await pool.query('DELETE FROM members WHERE member_id = :id', {
    id: memberId,
  });
  return rs.affectedRows > 0;
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

export async function checkMemberExpiringIn7Days(memberId) {
  const [[row]] = await pool.query(
    'SELECT fn_is_member_expiring_7(:id) AS expiring',
    { id: memberId }
  );
  return !!row.expiring;
}

export function isSubscriptionExpiringSoon(endDate, days) {
  const now = new Date();
  const expiryDate = new Date(endDate);
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
}
