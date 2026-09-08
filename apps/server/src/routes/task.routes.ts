import { Router, type Router as RouterType } from "express";
import {
  createTaskSchema,
  idParamSchema,
  taskIdParamsSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "../services/task.service";

const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);

const taskRouteParamsSchema = idParamSchema.merge(taskIdParamsSchema);

router.get(
  "/",
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await listTasks(req.userId!, String(req.params.id));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/",
  validate({ params: idParamSchema, body: createTaskSchema }),
  async (req, res, next) => {
    try {
      const data = await createTask(
        req.userId!,
        String(req.params.id),
        req.body as CreateTaskInput,
      );
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:taskId",
  validate({ params: taskRouteParamsSchema, body: updateTaskSchema }),
  async (req, res, next) => {
    try {
      const data = await updateTask(
        req.userId!,
        String(req.params.id),
        String(req.params.taskId),
        req.body as UpdateTaskInput,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:taskId",
  validate({ params: taskRouteParamsSchema }),
  async (req, res, next) => {
    try {
      await deleteTask(
        req.userId!,
        String(req.params.id),
        String(req.params.taskId),
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;