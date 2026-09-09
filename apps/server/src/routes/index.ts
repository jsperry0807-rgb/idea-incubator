import { Router, type Router as RouterType } from "express";

import authRoutes from "./auth.routes";

const router: RouterType = Router();

router.use("/auth", authRoutes);

export default router;
