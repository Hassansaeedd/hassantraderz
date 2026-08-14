// server/src/routes/inventory.routes.js — Stock adjustment & movements
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { adjustStockSchema } from '../validators/product.validator.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import { BusinessError } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware);

// GET /inventory/movements
router.get('/movements', managerOrAdmin, asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = getPaginationParams(req.query);
  const { productId, type } = req.query;
  const where = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { nameEn: true, nameUr: true, sku: true } },
        user:    { select: { fullName: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return apiRes.paginated(res, movements, buildPaginationMeta(total, page, limit));
}));

// POST /inventory/adjust — Manual stock adjustment
router.post('/adjust', managerOrAdmin, validate(adjustStockSchema), asyncHandler(async (req, res) => {
  const { productId, quantity, type, reason } = req.validatedBody;
  const userId = req.user.userId;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId }, select: { id: true, currentStock: true, nameEn: true } });
    if (!product) throw new BusinessError('Product not found', 'NOT_FOUND');

    if (type === 'ADJUSTMENT_OUT' && product.currentStock < quantity) {
      throw new BusinessError(`Cannot remove ${quantity} units. Only ${product.currentStock} in stock.`, 'INSUFFICIENT_STOCK');
    }

    const delta = type === 'ADJUSTMENT_IN' ? quantity : -quantity;
    const newStock = product.currentStock + delta;

    await tx.product.update({ where: { id: productId }, data: { currentStock: newStock } });
    await tx.stockMovement.create({
      data: { productId, userId, type, quantity: delta, balanceBefore: product.currentStock, balanceAfter: newStock, referenceType: 'Adjustment', reason },
    });

    return { productId, previousStock: product.currentStock, newStock, adjustment: delta };
  });

  return apiRes.success(res, result, 'Stock adjusted successfully');
}));

export default router;
