import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';

const r = Router();

r.post('/login', c.login); // Đăng nhập
r.get('/profile', c.profile); // Xem thông tin tài khoản từ token

export default r;
