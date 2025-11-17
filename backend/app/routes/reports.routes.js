import { Router } from 'express';
import * as controller from '../controllers/reports.controller.js';

const router = Router();

// Equipment usage (top)
router.get('/equipment/top', controller.getTopEquipment);

// Revenue by package
router.get('/revenue/packages', controller.getRevenueByPackage);
router.get('/members/expiring', controller.expiringSoon);
// Export PDF
router.get('/export/pdf', controller.exportPdf);

// Export Word
router.get('/export/word', controller.exportWord);

export default router;
