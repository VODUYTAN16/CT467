import * as svc from '../services/reports.service.js';

export async function topEquipment(req, res, next) {
  try {
    res.json(await svc.topEquipmentUsage(req.query.limit || 10));
  } catch (e) {
    next(e);
  }
}

export async function revenueByPackage(req, res, next) {
  try {
    res.json(await svc.revenueByPackageMonthly());
  } catch (e) {
    next(e);
  }
}

export async function expiringSoon(req, res, next) {
  try {
    res.json(await svc.membersExpiringSoon(req.query.days || 7));
  } catch (e) {
    next(e);
  }
}
