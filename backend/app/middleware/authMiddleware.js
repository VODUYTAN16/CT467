import jwt from 'jsonwebtoken';
const SECRET = 'gym_manager_secret';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Thiếu token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
  if (req.user.role !== 'admin')
    return res
      .status(403)
      .json({ message: 'Chỉ admin được phép thực hiện thao tác này' });
  next();
}
