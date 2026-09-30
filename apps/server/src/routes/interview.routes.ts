import { Router, type Router as RouterType } from "express";
import {
  answerInterviewSchema,
  deferInterviewSchema,
  idParamSchema,
  type AnswerInterviewInput,
  type DeferInterviewInput,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { interviewRateLimit } from "../middleware/rateLimit";
import {
  deferQuestion,
  getInterviewState,
  skipQuestion,
  startOrResumeInterview,
  submitAnswer,
} from "../services/interview.service";

const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);

function localeOf(req: { headers: Record<string, string | string[] | undefined> }) {
  const raw = req.headers["x-app-locale"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(value) ? value : "en";
}

router.post(
  "/",
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await startOrResumeInterview(
        req.userId!,
        String(req.params.id),
        localeOf(req),
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/",
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await getInterviewState(req.userId!, String(req.params.id));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/answer",
  validate({ params: idParamSchema, body: answerInterviewSchema }),
  interviewRateLimit,
  async (req, res, next) => {
    try {
      const data = await submitAnswer(
        req.userId!,
        String(req.params.id),
        req.body as AnswerInterviewInput,
        localeOf(req),
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/skip",
  validate({ params: idParamSchema }),
  interviewRateLimit,
  async (req, res, next) => {
    try {
      const data = await skipQuestion(req.userId!, String(req.params.id), localeOf(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/defer",
  validate({ params: idParamSchema, body: deferInterviewSchema }),
  interviewRateLimit,
  async (req, res, next) => {
    try {
      const body = req.body as DeferInterviewInput;
      const data = await deferQuestion(
        req.userId!,
        String(req.params.id),
        body.pointId,
        body.reason,
        localeOf(req),
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;