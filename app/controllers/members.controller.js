import * as svc from '../services/members.service.js';

export async function list(req, res, next) {
  try {
    res.json(await svc.getAllMembers());
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const member = await svc.createMember(req.body);
    res.status(201).json(member);
  } catch (e) {
    next(e);
  }
}

export async function checkExpiring(req, res, next) {
  try {
    const expiring = await svc.isExpiringIn7Days(Number(req.params.id));
    res.json({
      member_id: Number(req.params.id),
      expiring_in_7_days: expiring,
    });
  } catch (e) {
    next(e);
  }
}
