import { Router } from 'express';
import * as c from '../controllers/packages.controller.js';

const r = Router();

// CRUD Packages
r.get('/', c.list); // ?q=search (tùy bạn xử lý ở controller)
r.get('/:id', c.getOne);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);

export default r;
