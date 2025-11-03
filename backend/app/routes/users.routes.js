import { Router } from 'express';
import * as c from '../controllers/users.controller.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const r = Router();

// Toàn bộ đường dẫn dưới đây yêu cầu: đăng nhập + quyền admin
r.use(requireAuth, requireAdmin);

r.get('/', c.list); // GET /api/users
r.post('/', c.create); // POST /api/users
r.delete('/:id', c.remove); // DELETE /api/users/:id

export default r;
