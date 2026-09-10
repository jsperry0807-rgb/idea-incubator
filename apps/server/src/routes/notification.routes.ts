import { Router, type Router as RouterType } from "express";
import {
  notificationIdParamsSchema,
  notificationListQuerySchema,
  type NotificationListQuery,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service";

const router: RouterType = Router();

router.use(authenticate);

router.get(
  "/",
  validate({ query: notificationListQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await listNotifications(
        req.userId!,
        req.query as unknown as NotificationListQuery,
      );
      res.json({ data: result.items, meta: { unreadCount: result.unreadCount } });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:id/read",
  validate({ params: notificationIdParamsSchema }),
  async (req, res, next) => {
    try {
      const data = await markNotificationRead(req.userId!, String(req.params.id));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post("/read-all", async (req, res, next) => {
  try {
    res.json({ data: await markAllNotificationsRead(req.userId!) });
  } catch (err) {
    next(err);
  }
});

export default router;