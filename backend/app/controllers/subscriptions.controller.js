import * as svc from '../services/subscriptions.service.js';

export async function getSubscriptionsByMember(req, res, next) {
  try {
    const { memberId } = req.params;
    const subscriptions = await svc.getSubscriptionsByMemberId(Number(memberId));
    res.json(subscriptions);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const id = await svc.createSubscription(req.body);
    res.status(201).json({ subscription_id: id });
  } catch (e) {
    next(e);
  }
}

export async function findAllSubscriptions(req, res, next) {
  try {
    const subscriptions = await svc.findAllSubscriptions();
    res.json(subscriptions);
  } catch (e) {
    next(e);
  }
}

export async function pay(req, res, next) {
  try {
    const id = await svc.payAndAutoExtend(req.body);
    res
      .status(201)
      .json({
        payment_id: id,
        message: 'Payment recorded. Subscription auto-extended by trigger.',
      });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await svc.deleteSubscription(id);
    res.status(200).json({ message: "Subscription deleted successfully" });
  } catch (e) {
    next(e);
  }
}

export async function findOne(req, res, next) {
  try {
    const { id } = req.params;
    const subscription = await svc.findSubscriptionById(id);
    if (subscription) {
      res.json(subscription);
    } else {
      res.status(404).json({ message: "Subscription not found" });
    }
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const affectedRows = await svc.updateSubscription(id, req.body);
    if (affectedRows === 0) {
      res.status(404).json({ message: "Subscription not found" });
    } else {
      res.status(200).json({ message: "Subscription updated successfully" });
    }
  } catch (e) {
    next(e);
  }
}
