import { Router, type Router as RouterType } from "express";
import {
  createShareSchema,
  idParamSchema,
  shareIdParamsSchema,
  updateShareSchema,
  type CreateShareInput,
  type UpdateShareInput,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  createShare,
  listShares,
  removeShare,
  updateShareRole,
} from "../services/share.service";

const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);

const shareRouteParamsSchema = idParamSchema.merge(shareIdParamsSchema);

router.get("/", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const data = await listShares(req.userId!, String(req.params.id));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  validate({ params: idParamSchema, body: createShareSchema }),
  async (req, res, next) => {
    try {
      const data = await createShare(
        req.userId!,
        String(req.params.id),
        req.body as CreateShareInput,
      );
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:shareId",
  validate({ params: shareRouteParamsSchema, body: updateShareSchema }),
  async (req, res, next) => {
    try {
      const data = await updateShareRole(
        req.userId!,
        String(req.params.id),
        String(req.params.shareId),
        req.body as UpdateShareInput,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:shareId",
  validate({ params: shareRouteParamsSchema }),
  async (req, res, next) => {
    try {
      await removeShare(
        req.userId!,
        String(req.params.id),
        String(req.params.shareId),
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;