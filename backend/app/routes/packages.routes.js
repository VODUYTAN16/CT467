import { Router } from 'express';
import * as c from '../controllers/packages.controller.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const r = Router();

r.use(requireAuth); // yêu cầu đăng nhập cho toàn bộ route dưới
r.get('/', c.list);
r.get('/:id', c.getOne);

// Chỉ admin được thêm, sửa, xóa
r.post('/', requireAdmin, c.create);
r.put('/:id', requireAdmin, c.update);
r.delete('/:id', requireAdmin, c.remove);

export default r;
