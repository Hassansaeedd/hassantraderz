// server/src/routes/category.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: req.query.all ? undefined : true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return apiRes.success(res, categories);
}));

router.post('/', managerOrAdmin, asyncHandler(async (req, res) => {
  const { nameEn, nameUr, description, sortOrder } = req.body;
  const cat = await prisma.category.create({ data: { nameEn, nameUr: nameUr || nameEn, description, sortOrder: sortOrder || 0 } });
  return apiRes.created(res, cat, 'Category created');
}));

router.put('/:id', managerOrAdmin, asyncHandler(async (req, res) => {
  const cat = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  return apiRes.success(res, cat, 'Category updated');
}));

router.delete('/:id', managerOrAdmin, asyncHandler(async (req, res) => {
  await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
  return apiRes.success(res, null, 'Category deactivated');
}));

export default router;
