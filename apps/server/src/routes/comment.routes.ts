import { Router, type Router as RouterType } from "express";
import {
  commentIdParamsSchema,
  createCommentSchema,
  idParamSchema,
  updateCommentSchema,
  type CreateCommentInput,
  type UpdateCommentInput,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from "../services/comment.service";

const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);

const commentRouteParamsSchema = idParamSchema.merge(commentIdParamsSchema);

router.get("/", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const data = await listComments(req.userId!, String(req.params.id));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  validate({ params: idParamSchema, body: createCommentSchema }),
  async (req, res, next) => {
    try {
      const data = await createComment(
        req.userId!,
        String(req.params.id),
        req.body as CreateCommentInput,
      );
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:commentId",
  validate({ params: commentRouteParamsSchema, body: updateCommentSchema }),
  async (req, res, next) => {
    try {
      const data = await updateComment(
        req.userId!,
        String(req.params.id),
        String(req.params.commentId),
        req.body as UpdateCommentInput,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:commentId",
  validate({ params: commentRouteParamsSchema }),
  async (req, res, next) => {
    try {
      await deleteComment(
        req.userId!,
        String(req.params.id),
        String(req.params.commentId),
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;