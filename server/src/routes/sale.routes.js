// server/src/routes/sale.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createSaleSchema } from '../validators/sale.validator.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';
import { InsufficientStockError } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware);

// GET /sales
router.get('/', asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = getPaginationParams(req.query);
  const { status, customerId, userId, from, to } = req.query;
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (userId) where.userId = userId;
  if (from || to) {
    where.saleDate = {};
    if (from) where.saleDate.gte = new Date(from);
    if (to)   where.saleDate.lte = new Date(to);
  }
  const [sales, total] = await Promise.all([
    prisma.sale.findMany({ where, skip, take, orderBy: { saleDate: 'desc' }, include: { customer: { select: { name: true, phone: true } }, user: { select: { fullName: true } } } }),
    prisma.sale.count({ where }),
  ]);
  return apiRes.paginated(res, sales, buildPaginationMeta(total, page, limit));
}));

// GET /sales/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { customer: true, user: { select: { fullName: true } }, items: { include: { product: { select: { nameEn: true, nameUr: true, sku: true, barcode: true } } } }, payments: true },
  });
  if (!sale) return apiRes.notFound(res, 'Sale');
  return apiRes.success(res, sale);
}));

// POST /sales — Create a new sale (atomic with stock decrement)
router.post('/', validate(createSaleSchema), asyncHandler(async (req, res) => {
  const { items, customerId, paymentMethod = 'CASH', amountPaid, paidAmount, discountAmount = 0, paymentRef, notes, offlineId } = req.validatedBody;
  const actualPaid = Number(amountPaid !== undefined ? amountPaid : (paidAmount !== undefined ? paidAmount : 0));
  const userId = req.user.userId;

  // Check offline dedup
  if (offlineId) {
    const existing = await prisma.sale.findUnique({ where: { offlineId } });
    if (existing) return apiRes.success(res, existing, 'Sale already synced');
  }

  const sale = await prisma.$transaction(async (tx) => {
    // Validate + decrement stock atomically for each item
    let subtotal = 0, gstAmount = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId }, select: { id: true, nameEn: true, currentStock: true, gstRate: true, sellingPrice: true } });
      if (!product) throw new Error(`Product ${item.productId} not found`);

      if (product.currentStock < item.quantity) {
        throw new InsufficientStockError(product.nameEn, product.currentStock, item.quantity);
      }

      const lineSubtotal  = item.unitPrice * item.quantity;
      const lineDiscount  = lineSubtotal * item.discountPct / 100;
      const lineAfterDisc = lineSubtotal - lineDiscount;
      const lineGst       = lineAfterDisc * Number(product.gstRate) / 100;
      subtotal  += lineAfterDisc;
      gstAmount += lineGst;

      enrichedItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, discountPct: item.discountPct, discountAmt: lineDiscount, gstRate: product.gstRate, gstAmount: lineGst, totalAmount: lineAfterDisc + lineGst });

      // Decrement stock
      const prev = product.currentStock;
      await tx.product.update({ where: { id: item.productId }, data: { currentStock: { decrement: item.quantity } } });
      await tx.stockMovement.create({ data: { productId: item.productId, userId, type: 'SALE_OUT', quantity: -item.quantity, balanceBefore: prev, balanceAfter: prev - item.quantity, referenceType: 'Sale' } });
    }

    const totalAmount  = subtotal + gstAmount - discountAmount;
    const changeAmount = Math.max(0, actualPaid - totalAmount);
    const dueAmount    = Math.max(0, totalAmount - actualPaid);
    const invoiceNumber = await generateInvoiceNumber();

    return tx.sale.create({
      data: {
        invoiceNumber, userId, customerId: customerId || null, offlineId: offlineId || null,
        subtotal, gstAmount, discountAmount, totalAmount, paidAmount: actualPaid, changeAmount, dueAmount,
        paymentMethod, paymentRef: paymentRef || null, notes: notes || null,
        syncedAt: offlineId ? new Date() : null,
        items: { create: enrichedItems },
        payments: { create: [{ amount: actualPaid, method: paymentMethod, reference: paymentRef }] },
      },
      include: { items: { include: { product: { select: { nameEn: true, nameUr: true } } } }, customer: true, user: { select: { fullName: true } } },
    });
  });

  return apiRes.created(res, sale, 'Sale completed successfully');
}));

// POST /sales/:id/return
router.post('/:id/return', managerOrAdmin, asyncHandler(async (req, res) => {
  const { items, reason } = req.body;
  const userId = req.user.userId;

  const result = await prisma.$transaction(async (tx) => {
    for (const ret of items) {
      const saleItem = await tx.saleItem.findUnique({ where: { id: ret.saleItemId } });
      if (!saleItem) continue;
      const returnQty = Math.min(ret.quantity, saleItem.quantity - saleItem.returnedQty);
      await tx.saleItem.update({ where: { id: ret.saleItemId }, data: { returnedQty: { increment: returnQty } } });

      const product = await tx.product.findUnique({ where: { id: saleItem.productId }, select: { currentStock: true } });
      await tx.product.update({ where: { id: saleItem.productId }, data: { currentStock: { increment: returnQty } } });
      await tx.stockMovement.create({ data: { productId: saleItem.productId, userId, type: 'RETURN_IN', quantity: returnQty, balanceBefore: product.currentStock, balanceAfter: product.currentStock + returnQty, referenceId: req.params.id, referenceType: 'Return', reason } });
    }

    return tx.sale.update({ where: { id: req.params.id }, data: { status: 'RETURNED' } });
  });

  return apiRes.success(res, result, 'Return processed and stock restored');
}));

export default router;
