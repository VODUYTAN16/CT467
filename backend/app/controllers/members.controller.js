import * as svc from "../services/members.service.js";

export async function getMemberByPhone(req, res, next) {
  try {
    const { phone } = req.params;
    const member = await svc.getMemberByPhone(phone);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (e) {
    next(e);
  }
}

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

export async function get(req, res, next) {
  try {
    const id = Number(req.params.id);
    const member = await svc.getMemberById(id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const updated = await svc.updateMember(id, req.body);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const ok = await svc.deleteMember(id);
    if (!ok) return res.status(404).json({ message: "Member not found" });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
}
