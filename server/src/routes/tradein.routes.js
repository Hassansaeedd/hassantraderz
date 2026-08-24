// server/src/routes/tradein.routes.js — Used Phone Buyback & Police Verification API
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

// GET /trade-ins — List all trade-ins
router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { voucherNo: { contains: search } },
      { sellerName: { contains: search } },
      { sellerCnic: { contains: search } },
      { imei1: { contains: search } },
      { modelName: { contains: search } },
    ];
  }

  const tradeIns = await prisma.tradeIn.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true } },
    },
  });

  return apiRes.success(res, tradeIns);
}));

// POST /trade-ins — Create new trade-in purchase log
router.post('/', asyncHandler(async (req, res) => {
  const {
    sellerName,
    sellerPhone,
    sellerCnic,
    sellerAddress,
    brand,
    modelName,
    imei1,
    imei2,
    storage,
    color,
    conditionGrade = 'GRADE_A',
    purchasePrice,
    paymentMethod = 'CASH',
    hasBox = true,
    hasCharger = true,
    hasOriginalCnicCopy = true,
    notes,
  } = req.body;

  const count = await prisma.tradeIn.count();
  const voucherNo = `UBB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const tradeIn = await prisma.tradeIn.create({
    data: {
      voucherNo,
      sellerName,
      sellerPhone,
      sellerCnic,
      sellerAddress: sellerAddress || null,
      brand,
      modelName,
      imei1,
      imei2: imei2 || null,
      storage: storage || null,
      color: color || null,
      conditionGrade,
      purchasePrice: Number(purchasePrice),
      paymentMethod,
      hasBox: Boolean(hasBox),
      hasCharger: Boolean(hasCharger),
      hasOriginalCnicCopy: Boolean(hasOriginalCnicCopy),
      notes: notes || null,
      userId: req.user.userId,
    },
    include: {
      user: { select: { fullName: true } },
    },
  });

  return apiRes.created(res, tradeIn, 'Trade-in purchase recorded successfully');
}));

export default router;
