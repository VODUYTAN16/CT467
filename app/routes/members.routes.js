import { Router } from 'express';
import * as c from '../controllers/members.controller.js';

const r = Router();
r.get('/', c.list);
r.post('/', c.create);
r.get('/:id/expiring7', c.checkExpiring);
export default r;
