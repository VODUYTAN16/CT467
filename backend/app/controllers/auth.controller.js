import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';

// Lưu tạm secret tại đây (hoặc .env)
const SECRET = 'gym_manager_secret';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Thiếu username hoặc password' });

    const [[user]] = await pool.query(
      'SELECT * FROM users WHERE username = :username AND password = :password',
      { username, password }
    );
    if (!user)
      return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      role: user.role,
    });
  } catch (e) {
    next(e);
  }
}

export async function profile(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Thiếu token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    res.json({ user: decoded });
  } catch (e) {
    next(e);
  }
}
