import * as svc from '../services/subscriptions.service.js';

export async function create(req, res, next) {
  try {
    const id = await svc.createSubscription(req.body);
    res.status(201).json({ subscription_id: id });
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
