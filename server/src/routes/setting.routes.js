// server/src/routes/setting.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

// GET /settings — Get all settings as flat key-value object
router.get('/', asyncHandler(async (req, res) => {
  const settings = await prisma.setting.findMany({ orderBy: { group: 'asc' } });
  const flat = settings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});
  return apiRes.success(res, flat);
}));

// PUT /settings — Bulk update (admin only)
router.put('/', adminOnly, asyncHandler(async (req, res) => {
  const updates = req.body; // { key: value, ... }
  const ops = Object.entries(updates).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
  );
  await Promise.all(ops);
  return apiRes.success(res, null, 'Settings saved');
}));

export default router;
