import { Router, type Router as RouterType } from 'express';
import {
  idParamSchema,
  uploadWireframeSchema,
  wireframeNameSchema,
  type UploadWireframeInput,
} from '@repo/shared';

import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { storage } from '../services/storage.service';
import { assertIdeaOwnership } from '../services/idea.service';

const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);

const wireframeParamsSchema = idParamSchema.extend({
  name: wireframeNameSchema,
});

router.get('/', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await assertIdeaOwnership(req.userId!, String(req.params.id));
    const filenames = await storage.listWireframes(req.userId!, String(req.params.id));
    res.json({ data: filenames.map((filename) => ({ filename })) });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  validate({ params: idParamSchema, body: uploadWireframeSchema }),
  async (req, res, next) => {
    try {
      await assertIdeaOwnership(req.userId!, String(req.params.id));
      const input = req.body as UploadWireframeInput;
      const filename = `${input.name}.html`;
      await storage.writeWireframe(req.userId!, String(req.params.id), filename, input.html);
      res.status(201).json({ data: { filename } });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:name', validate({ params: wireframeParamsSchema }), async (req, res, next) => {
  try {
    await assertIdeaOwnership(req.userId!, String(req.params.id));
    const filename = `${String(req.params.name)}.html`;
    const html = await storage.readWireframe(req.userId!, String(req.params.id), filename);
    res.json({ data: { filename, html } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:name', validate({ params: wireframeParamsSchema }), async (req, res, next) => {
  try {
    await assertIdeaOwnership(req.userId!, String(req.params.id));
    const filename = `${String(req.params.name)}.html`;
    await storage.deleteWireframe(req.userId!, String(req.params.id), filename);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
