// server/src/routes/report.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';
import dayjs from 'dayjs';

const router = Router();
router.use(authMiddleware, managerOrAdmin);

// GET /reports/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const todayStart = dayjs().startOf('day').toDate();
  const todayEnd   = dayjs().endOf('day').toDate();
  const monthStart = dayjs().startOf('month').toDate();

  const [todaySales, monthSales, lowStock, topProducts, recentSales] = await Promise.all([
    prisma.sale.aggregate({ where: { status: 'COMPLETED', saleDate: { gte: todayStart, lte: todayEnd } }, _sum: { totalAmount: true, gstAmount: true }, _count: true }),
    prisma.sale.aggregate({ where: { status: 'COMPLETED', saleDate: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
    prisma.$queryRaw`SELECT id, "nameEn", "nameUr", "currentStock", "minStockLevel" FROM products WHERE "isActive" = true AND "currentStock" <= "minStockLevel" ORDER BY "currentStock" ASC LIMIT 10`,
    prisma.saleItem.groupBy({ by: ['productId'], where: { sale: { saleDate: { gte: monthStart }, status: 'COMPLETED' } }, _sum: { quantity: true, totalAmount: true }, orderBy: { _sum: { totalAmount: 'desc' } }, take: 5 }),
    prisma.sale.findMany({ take: 5, orderBy: { saleDate: 'desc' }, include: { customer: { select: { name: true } }, user: { select: { fullName: true } } } }),
  ]);

  // Fetch product names for top products
  const productIds = topProducts.map(p => p.productId);
  const productNames = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, nameEn: true, nameUr: true } });
  const enrichedTop = topProducts.map(tp => ({ ...tp, product: productNames.find(p => p.id === tp.productId) }));

  // Revenue chart: last 30 days
  const thirtyDaysAgo = dayjs().subtract(29, 'day').startOf('day').toDate();
  const dailySales = await prisma.$queryRaw`
    SELECT DATE("saleDate") as date, SUM("totalAmount") as revenue, SUM("gstAmount") as gst
    FROM sales WHERE status = 'COMPLETED' AND "saleDate" >= ${thirtyDaysAgo}
    GROUP BY DATE("saleDate") ORDER BY date ASC
  `;

  return apiRes.success(res, {
    today:        { revenue: Number(todaySales._sum.totalAmount || 0), transactions: todaySales._count, gst: Number(todaySales._sum.gstAmount || 0) },
    thisMonth:    { revenue: Number(monthSales._sum.totalAmount || 0), transactions: monthSales._count },
    lowStock,
    topProducts:  enrichedTop,
    recentSales,
    revenueChart: dailySales,
  });
}));

// GET /reports/sales?from=&to=
router.get('/sales', asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : dayjs().startOf('month').toDate();
  const to   = req.query.to   ? new Date(req.query.to)   : dayjs().endOf('day').toDate();

  const [summary, sales] = await Promise.all([
    prisma.sale.aggregate({ where: { saleDate: { gte: from, lte: to }, status: 'COMPLETED' }, _sum: { totalAmount: true, gstAmount: true, discountAmount: true }, _count: true }),
    prisma.sale.findMany({ where: { saleDate: { gte: from, lte: to } }, orderBy: { saleDate: 'desc' }, include: { customer: { select: { name: true } }, user: { select: { fullName: true } } } }),
  ]);

  return apiRes.success(res, { summary: { revenue: Number(summary._sum.totalAmount || 0), gst: Number(summary._sum.gstAmount || 0), discount: Number(summary._sum.discountAmount || 0), count: summary._count }, sales });
}));

// GET /reports/inventory
router.get('/inventory', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: { select: { nameEn: true } }, brand: { select: { name: true } } },
    orderBy: { nameEn: 'asc' },
  });

  const valuedProducts = products.map(p => ({
    ...p,
    stockValue: Number(p.purchasePrice) * p.currentStock,
    retailValue: Number(p.sellingPrice) * p.currentStock,
    isLowStock: p.currentStock <= p.minStockLevel,
  }));

  const totalStockValue  = valuedProducts.reduce((s, p) => s + p.stockValue, 0);
  const totalRetailValue = valuedProducts.reduce((s, p) => s + p.retailValue, 0);

  return apiRes.success(res, { summary: { totalStockValue, totalRetailValue, totalProducts: products.length }, products: valuedProducts });
}));

export default router;
