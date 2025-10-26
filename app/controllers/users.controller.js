import { pool } from '../config/db.js';

// GET /api/users  (admin)
export async function list(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, username, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

// POST /api/users  (admin)
// Body: { username, password, role }  (role: 'admin' | 'staff')
export async function create(req, res, next) {
  try {
    const { username, password, role = 'staff' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Thiếu username hoặc password' });
    }
    if (!['admin', 'staff'].includes(role)) {
      return res
        .status(400)
        .json({ message: "role phải là 'admin' hoặc 'staff'" });
    }

    // kiểm tra trùng username
    const [[exists]] = await pool.query(
      'SELECT user_id FROM users WHERE username = :username',
      { username }
    );
    if (exists) return res.status(409).json({ message: 'Username đã tồn tại' });

    const [rs] = await pool.query(
      `INSERT INTO users (username, password, role)
       VALUES (:username, :password, :role)`,
      { username, password, role }
    );

    res.status(201).json({
      user_id: rs.insertId,
      username,
      role,
    });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/users/:id  (admin)
export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);

    // Không cho xóa chính mình (an toàn cơ bản)
    if (req.user?.user_id === id) {
      return res
        .status(400)
        .json({ message: 'Không thể tự xóa tài khoản đang đăng nhập' });
    }

    const [rs] = await pool.query('DELETE FROM users WHERE user_id = :id', {
      id,
    });
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: 'User không tồn tại' });

    res.json({ message: 'Đã xóa', user_id: id });
  } catch (e) {
    next(e);
  }
}
