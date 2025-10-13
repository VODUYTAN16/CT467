import { Router } from 'express';
import * as c from '../controllers/payments.controller.js';

const r = Router();

// Tạo thanh toán -> Trigger tự gia hạn subscription
r.post('/', c.create); // body: { subscription_id, amount, note? }

// Tra cứu
r.get('/', c.list); // ?from=YYYY-MM-DD&to=YYYY-MM-DD
r.get('/:id', c.getOne);
r.get('/subscription/:subscriptionId', c.listBySubscription);

// Hủy (nếu nghiệp vụ cho phép)
r.delete('/:id', c.remove);

export default r;
