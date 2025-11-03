import { Router } from 'express';
import * as c from '../controllers/usage.controller.js';

const r = Router();

// Ghi nhận sử dụng thiết bị
r.post('/', c.create); // body: { member_id, equipment_id, use_date, start_time, end_time }

// Tra cứu
r.get('/', c.list); // hỗ trợ query: ?member_id=&equipment_id=&date=
r.get('/:id', c.getOne);
r.get('/member/:memberId', c.listByMember);
r.get('/equipment/:equipmentId', c.listByEquipment);

// Xoá bản ghi sử dụng (nếu cần chỉnh sửa thì xoá rồi tạo lại)
r.delete('/:id', c.remove);

export default r;
