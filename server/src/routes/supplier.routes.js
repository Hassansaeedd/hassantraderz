// server/src/routes/supplier.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';

const router = Router();
router.use(authMiddleware, managerOrAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = getPaginationParams(req.query);
  const search = req.query.search;
  const where = { isActive: true };
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { company: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search } },
  ];
  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.supplier.count({ where }),
  ]);
  return apiRes.paginated(res, suppliers, buildPaginationMeta(total, page, limit));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: req.params.id },
    include: { purchases: { take: 10, orderBy: { purchaseDate: 'desc' }, select: { id: true, purchaseNumber: true, totalAmount: true, purchaseDate: true, status: true } } },
  });
  if (!supplier) return apiRes.notFound(res, 'Supplier');
  return apiRes.success(res, supplier);
}));

router.post('/', asyncHandler(async (req, res) => {
  const supplier = await prisma.supplier.create({ data: req.body });
  return apiRes.created(res, supplier, 'Supplier created');
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
  return apiRes.success(res, supplier, 'Supplier updated');
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.supplier.update({ where: { id: req.params.id }, data: { isActive: false } });
  return apiRes.success(res, null, 'Supplier deactivated');
}));

export default router;
