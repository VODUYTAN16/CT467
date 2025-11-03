import { Router } from 'express';
import * as c from '../controllers/reports.controller.js';

const r = Router();
r.get('/equipment/top', c.topEquipment);
r.get('/revenue/packages', c.revenueByPackage);
r.get('/members/expiring', c.expiringSoon);
r.get('/export/pdf', c.exportPdfReport);
r.get('/export/word', c.exportWordReport);
export default r;
