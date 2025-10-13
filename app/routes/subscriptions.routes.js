import { Router } from 'express';
import * as c from '../controllers/subscriptions.controller.js';

const r = Router();
r.post('/', c.create);
r.post('/pay', c.pay); // body: {subscription_id, amount, note?}
export default r;
