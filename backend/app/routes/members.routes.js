import { Router } from "express";
import * as c from "../controllers/members.controller.js";

const r = Router();
r.get("/by-phone/:phone", c.getMemberByPhone);
r.get("/", c.list);
r.post("/", c.create);
r.get("/:id/expiring7", c.checkExpiring);
r.get("/:id", c.get);
r.put("/:id", c.update);
r.delete("/:id", c.remove);
export default r;
