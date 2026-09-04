import { Router, type Router as RouterType } from "express";
import {
  idParamSchema,
  planningSectionParamsSchema,
  updatePlanningSectionSchema,
  type UpdatePlanningSectionInput,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  listPlanningSections,
  readPlanningSection,
  writePlanningSection,
} from "../services/planning.service";

const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);

const planningParamsSchema = idParamSchema.merge(planningSectionParamsSchema);

router.get(
  "/",
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await listPlanningSections(
        req.userId!,
        String(req.params.id),
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:section",
  validate({ params: planningParamsSchema }),
  async (req, res, next) => {
    try {
      const data = await readPlanningSection(
        req.userId!,
        String(req.params.id),
        String(req.params.section),
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/:section",
  validate({
    params: planningParamsSchema,
    body: updatePlanningSectionSchema,
  }),
  async (req, res, next) => {
    try {
      const data = await writePlanningSection(
        req.userId!,
        String(req.params.id),
        String(req.params.section),
        (req.body as UpdatePlanningSectionInput).content,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
