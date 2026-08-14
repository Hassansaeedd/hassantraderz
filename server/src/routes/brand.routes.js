// server/src/routes/brand.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const brands = await prisma.brand.findMany({
    where: { isActive: req.query.all ? undefined : true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return apiRes.success(res, brands);
}));

router.post('/', managerOrAdmin, asyncHandler(async (req, res) => {
  const brand = await prisma.brand.create({ data: { name: req.body.name } });
  return apiRes.created(res, brand, 'Brand created');
}));

router.put('/:id', managerOrAdmin, asyncHandler(async (req, res) => {
  const brand = await prisma.brand.update({ where: { id: req.params.id }, data: req.body });
  return apiRes.success(res, brand, 'Brand updated');
}));

router.delete('/:id', managerOrAdmin, asyncHandler(async (req, res) => {
  await prisma.brand.update({ where: { id: req.params.id }, data: { isActive: false } });
  return apiRes.success(res, null, 'Brand deactivated');
}));

export default router;
