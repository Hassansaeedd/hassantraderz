// server/src/routes/purchase.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import { generatePurchaseNumber } from '../utils/invoiceNumber.js';

const router = Router();
router.use(authMiddleware, managerOrAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = getPaginationParams(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.supplierId) where.supplierId = req.query.supplierId;
  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({ where, skip, take, orderBy: { purchaseDate: 'desc' }, include: { supplier: { select: { name: true } }, user: { select: { fullName: true } } } }),
    prisma.purchase.count({ where }),
  ]);
  return apiRes.paginated(res, purchases, buildPaginationMeta(total, page, limit));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: req.params.id },
    include: { supplier: true, user: { select: { fullName: true } }, items: { include: { product: { select: { nameEn: true, nameUr: true, sku: true } } } }, payments: true },
  });
  if (!purchase) return apiRes.notFound(res, 'Purchase');
  return apiRes.success(res, purchase);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { supplierId, items, notes, expectedDate, supplierInvoiceNo } = req.body;
  const purchaseNumber = await generatePurchaseNumber();
  const userId = req.user.userId;

  // Calculate totals
  let subtotal = 0, gstAmount = 0;
  const enrichedItems = items.map(item => {
    const lineSubtotal = item.unitCost * item.quantity;
    const lineGst = lineSubtotal * (item.gstRate || 0) / 100;
    subtotal  += lineSubtotal;
    gstAmount += lineGst;
    return { ...item, gstAmount: lineGst, totalAmount: lineSubtotal + lineGst };
  });

  const purchase = await prisma.purchase.create({
    data: {
      purchaseNumber, supplierId, userId, notes, supplierInvoiceNo,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      subtotal, gstAmount, totalAmount: subtotal + gstAmount, dueAmount: subtotal + gstAmount,
      items: { create: enrichedItems },
    },
    include: { items: true, supplier: { select: { name: true } } },
  });
  return apiRes.created(res, purchase, 'Purchase order created');
}));

// POST /purchases/:id/receive — Mark goods as received, update stock
router.post('/:id/receive', asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ purchaseItemId, receivedQty }]
  const userId = req.user.userId;

  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!purchase) throw new Error('Purchase not found');

    for (const received of items) {
      const item = purchase.items.find(i => i.id === received.purchaseItemId);
      if (!item) continue;

      const qty = received.receivedQty;
      await tx.purchaseItem.update({ where: { id: item.id }, data: { receivedQty: { increment: qty } } });

      // Update product stock
      const product = await tx.product.findUnique({ where: { id: item.productId }, select: { currentStock: true } });
      await tx.product.update({ where: { id: item.productId }, data: { currentStock: { increment: qty } } });
      await tx.stockMovement.create({
        data: { productId: item.productId, userId, type: 'PURCHASE_IN', quantity: qty, balanceBefore: product.currentStock, balanceAfter: product.currentStock + qty, referenceId: purchase.id, referenceType: 'Purchase' },
      });
    }

    // Update purchase status
    const updatedItems = await tx.purchaseItem.findMany({ where: { purchaseId: req.params.id } });
    const allReceived = updatedItems.every(i => i.receivedQty >= i.quantity);
    const anyReceived = updatedItems.some(i => i.receivedQty > 0);
    const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : purchase.status;

    return tx.purchase.update({ where: { id: req.params.id }, data: { status: newStatus, receivedDate: allReceived ? new Date() : undefined } });
  });

  return apiRes.success(res, result, 'Goods received and stock updated');
}));

export default router;
