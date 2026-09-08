import { Router, type Router as RouterType } from "express";
import {
  createIdeaSchema,
  idParamSchema,
  ideaListQuerySchema,
  updateIdeaSchema,
  updateIdeaStatusSchema,
  type IdeaListQuery,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  createIdea,
  deleteIdea,
  getIdea,
  getPipeline,
  listIdeas,
  updateIdea,
} from "../services/idea.service";
import planningRoutes from "./planning.routes";
import taskRoutes from "./task.routes";

const router: RouterType = Router();

router.use(authenticate);

router.get("/", validate({ query: ideaListQuerySchema }), async (req, res, next) => {
  try {
    const result = await listIdeas(req.userId!, req.query as unknown as IdeaListQuery);
    res.json({ data: result.items, meta: result.meta });
  } catch (err) {
    next(err);
  }
});

router.get("/pipeline", async (req, res, next) => {
  try {
    res.json({ data: await getPipeline(req.userId!) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json({ data: await getIdea(req.userId!, String(req.params.id)) });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createIdeaSchema), async (req, res, next) => {
  try {
    const idea = await createIdea(req.userId!, req.body);
    res.status(201).json({ data: idea });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", validate({ params: idParamSchema, body: updateIdeaSchema }), async (req, res, next) => {
  try {
    res.json({ data: await updateIdea(req.userId!, String(req.params.id), req.body) });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", validate({ params: idParamSchema, body: updateIdeaStatusSchema }), async (req, res, next) => {
  try {
    res.json({ data: await updateIdea(req.userId!, String(req.params.id), req.body) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await deleteIdea(req.userId!, String(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.use("/:id/planning", planningRoutes);
router.use("/:id/tasks", taskRoutes);

export default router;