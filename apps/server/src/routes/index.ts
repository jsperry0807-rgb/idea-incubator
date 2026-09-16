import { Router, type Router as RouterType } from "express";

import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import ideaRoutes from "./idea.routes";
import notificationRoutes from "./notification.routes";
import tagRoutes from "./tag.routes";
import wireframeRoutes from "./wireframe.routes";

const router: RouterType = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ideas", ideaRoutes);
router.use("/notifications", notificationRoutes);
router.use("/tags", tagRoutes);
router.use("/ideas/:id/wireframes", wireframeRoutes);

export default router;