import { Router, type Router as RouterType } from "express";

import authRoutes from "./auth.routes";
import ideaRoutes from "./idea.routes";
import tagRoutes from "./tag.routes";

const router: RouterType = Router();

router.use("/auth", authRoutes);
router.use("/ideas", ideaRoutes);
router.use("/tags", tagRoutes);

export default router;