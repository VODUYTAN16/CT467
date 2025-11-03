import { Router } from 'express';
import * as c from '../controllers/equipment.controller.js';

const r = Router();

// CRUD Equipment
r.get('/', c.list); // ?status=Hoạt%20động (lọc tuỳ controller)
r.get('/:id', c.getOne);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);

// Cập nhật trạng thái nhanh
r.patch('/:id/status', c.updateStatus); // body: { status: 'Hoạt động'|'Bảo trì'|'Hỏng' }

export default r;
