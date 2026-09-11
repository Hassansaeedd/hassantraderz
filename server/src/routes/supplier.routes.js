// server/src/routes/supplier.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';

const router = Router();
router.use(authMiddleware, managerOrAdmin);

async function getSupplierTenantFilter(req) {
  const uname = (req.user?.username || '').toLowerCase();
  const isSuperAdmin = uname === 'hassan@009' || req.user?.role === 'SUPERADMIN';
  if (isSuperAdmin) return {};

  const isUsman = uname.includes('usman') || (req.user?.fullName || '').toLowerCase().includes('usman');
  if (isUsman) {
    const usmanUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'usman', mode: 'insensitive' } },
          { fullName: { contains: 'usman', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    const allUsmanIds = usmanUsers.map((u) => u.id);
    if (!allUsmanIds.includes(req.user.userId)) allUsmanIds.push(req.user.userId);
    return { OR: [{ userId: { in: allUsmanIds } }, { userId: null }] };
  }
  return { userId: req.user.userId };
}

router.get('/', asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = getPaginationParams(req.query);
  const search = req.query.search;
  const tenantFilter = await getSupplierTenantFilter(req);
  const where = {
    isActive: true,
    ...tenantFilter,
  };
  if (search) {
    where.AND = [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      },
    ];
  }
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
  const supplier = await prisma.supplier.create({
    data: {
      ...req.body,
      userId: req.user.userId,
    },
  });
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
