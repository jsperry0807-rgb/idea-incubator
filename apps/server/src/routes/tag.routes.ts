import { Router, type Router as RouterType } from "express";
import {
  createTagSchema,
  idParamSchema,
  updateTagSchema,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  createTag,
  deleteTag,
  listTags,
  updateTag,
} from "../services/tag.service";

const router: RouterType = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    res.json({ data: await listTags(req.userId!) });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createTagSchema), async (req, res, next) => {
  try {
    const tag = await createTag(req.userId!, req.body);
    res.status(201).json({ data: tag });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateTagSchema }),
  async (req, res, next) => {
    try {
      res.json({ data: await updateTag(req.userId!, String(req.params.id), req.body) });
    } catch (err) {
      next(err);
    }
  },
);

router.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await deleteTag(req.userId!, String(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;