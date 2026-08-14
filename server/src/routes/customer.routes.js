// server/src/routes/customer.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = getPaginationParams(req.query);
  const search = req.query.search;
  const where = { isActive: true };
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search } },
    { email: { contains: search, mode: 'insensitive' } },
  ];
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.customer.count({ where }),
  ]);
  return apiRes.paginated(res, customers, buildPaginationMeta(total, page, limit));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: { sales: { take: 10, orderBy: { saleDate: 'desc' }, select: { id: true, invoiceNumber: true, totalAmount: true, saleDate: true, status: true } } },
  });
  if (!customer) return apiRes.notFound(res, 'Customer');
  return apiRes.success(res, customer);
}));

router.post('/', asyncHandler(async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  return apiRes.created(res, customer, 'Customer created');
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const customer = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
  return apiRes.success(res, customer, 'Customer updated');
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.customer.update({ where: { id: req.params.id }, data: { isActive: false } });
  return apiRes.success(res, null, 'Customer deactivated');
}));

export default router;
