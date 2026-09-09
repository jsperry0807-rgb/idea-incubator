import { Router, type Router as RouterType } from "express";

import { authenticate } from "../middleware/auth";
import { getStats, getActivity } from "../services/dashboard.service";

const router: RouterType = Router();

router.use(authenticate);

router.get("/stats", async (req, res, next) => {
  try {
    res.json({ data: await getStats(req.userId!) });
  } catch (err) {
    next(err);
  }
});

router.get("/activity", async (req, res, next) => {
  try {
    res.json({ data: await getActivity(req.userId!) });
  } catch (err) {
    next(err);
  }
});

export default router;