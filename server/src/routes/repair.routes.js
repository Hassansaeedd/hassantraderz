// server/src/routes/repair.routes.js — Mobile Repair Work Orders Backend API
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

// GET /repairs — List all repair tickets with optional status filtering
router.get('/', asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { ticketNo: { contains: search } },
      { customerName: { contains: search } },
      { customerPhone: { contains: search } },
      { deviceModel: { contains: search } },
      { imei: { contains: search } },
    ];
  }

  const repairs = await prisma.repairTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true } },
      customer: { select: { name: true, phone: true } },
    },
  });

  return apiRes.success(res, repairs);
}));

// POST /repairs — Create new repair work order
router.post('/', asyncHandler(async (req, res) => {
  const {
    customerName,
    customerPhone,
    deviceModel,
    imei,
    color,
    patternLock,
    faultDescription,
    technicianNotes,
    estimatedCost = 0,
    advanceDeposit = 0,
  } = req.body;

  const count = await prisma.repairTicket.count();
  const ticketNo = `REP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const repair = await prisma.repairTicket.create({
    data: {
      ticketNo,
      customerName,
      customerPhone,
      deviceModel,
      imei: imei || null,
      color: color || null,
      patternLock: patternLock || null,
      faultDescription,
      technicianNotes: technicianNotes || null,
      estimatedCost: Number(estimatedCost),
      advanceDeposit: Number(advanceDeposit),
      status: 'RECEIVED',
      userId: req.user.userId,
    },
    include: {
      user: { select: { fullName: true } },
    },
  });

  return apiRes.created(res, repair, 'Repair ticket created successfully');
}));

// PATCH /repairs/:id/status — Update repair status
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status, finalAmount, technicianNotes } = req.body;
  const data = {};
  if (status) data.status = status;
  if (technicianNotes !== undefined) data.technicianNotes = technicianNotes;
  if (finalAmount !== undefined) data.finalAmount = Number(finalAmount);
  if (status === 'DELIVERED') data.deliveredAt = new Date();

  const updated = await prisma.repairTicket.update({
    where: { id: req.params.id },
    data,
  });

  return apiRes.success(res, updated, `Repair status updated to ${status}`);
}));

export default router;
