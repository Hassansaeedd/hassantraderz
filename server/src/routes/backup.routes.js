// server/src/routes/backup.routes.js — 1-Click Database Backup & System Health API
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

// GET /backup/stats — Database Health & Total Record Counts
router.get('/stats', adminOnly, asyncHandler(async (req, res) => {
  const [
    productsCount,
    salesCount,
    customersCount,
    repairsCount,
    tradeInsCount,
    expensesCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.sale.count(),
    prisma.customer.count(),
    prisma.repairTicket.count(),
    prisma.tradeIn.count(),
    prisma.expense.count(),
  ]);

  return apiRes.success(res, {
    databaseStatus: 'CONNECTED (Neon PostgreSQL Ready)',
    productsCount,
    salesCount,
    customersCount,
    repairsCount,
    tradeInsCount,
    expensesCount,
    timestamp: new Date().toISOString(),
  });
}));

// GET /backup/export-json — Export full database JSON dump for 1-click backup
router.get('/export-json', adminOnly, asyncHandler(async (req, res) => {
  const [
    products,
    categories,
    brands,
    customers,
    suppliers,
    sales,
    repairs,
    tradeIns,
    expenses,
    settings,
  ] = await Promise.all([
    prisma.product.findMany(),
    prisma.category.findMany(),
    prisma.brand.findMany(),
    prisma.customer.findMany(),
    prisma.supplier.findMany(),
    prisma.sale.findMany({ include: { items: true, payments: true } }),
    prisma.repairTicket.findMany(),
    prisma.tradeIn.findMany(),
    prisma.expense.findMany(),
    prisma.setting.findMany(),
  ]);

  const backupData = {
    software: 'Hassan Traderz POS',
    version: '2.4.0',
    backupDate: new Date().toISOString(),
    databaseType: 'PostgreSQL / Neon DB',
    data: {
      categories,
      brands,
      products,
      customers,
      suppliers,
      sales,
      repairs,
      tradeIns,
      expenses,
      settings,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=HassanTraderz_DB_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  return res.send(JSON.stringify(backupData, null, 2));
}));

export default router;
