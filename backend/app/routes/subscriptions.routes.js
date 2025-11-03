import { Router } from "express";
import * as c from "../controllers/subscriptions.controller.js";

const r = Router();
r.get("/by-member/:memberId", c.getSubscriptionsByMember);
r.post("/", c.create);
r.get('/', c.findAllSubscriptions);
r.post("/pay", c.pay); // body: {subscription_id, amount, note?}
r.delete("/:id", c.remove);
r.get("/:id", c.findOne);
r.put("/:id", c.update);
export default r;
