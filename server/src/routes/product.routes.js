// server/src/routes/product.routes.js
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { managerOrAdmin } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import { uploadProductImage } from '../middleware/upload.middleware.js';

const router = Router();
router.use(authMiddleware);

// GET /products — list with search, filter, pagination
router.get('/', asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = getPaginationParams(req.query);
  const { search, categoryId, brandId, lowStock } = req.query;

  const where = { isActive: true };
  if (search) {
    where.OR = [
      { nameEn: { contains: search, mode: 'insensitive' } },
      { nameUr: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (cat) {
      const catLower = cat.nameEn.toLowerCase();
      if (catLower.includes('access') || catLower.includes('charger') || catLower.includes('cable') || catLower.includes('ear') || catLower.includes('case') || catLower.includes('cover') || catLower.includes('power')) {
        where.OR = [
          { categoryId: categoryId },
          { sku: { startsWith: 'ACC', mode: 'insensitive' } },
          { sku: { startsWith: 'REP', mode: 'insensitive' } },
          { nameEn: { contains: 'AirPod', mode: 'insensitive' } },
          { nameEn: { contains: 'Earbud', mode: 'insensitive' } },
          { nameEn: { contains: 'Charger', mode: 'insensitive' } },
          { nameEn: { contains: 'Cable', mode: 'insensitive' } },
          { nameEn: { contains: 'Power Bank', mode: 'insensitive' } },
          { nameEn: { contains: 'Adapter', mode: 'insensitive' } },
          { nameEn: { contains: 'Battery', mode: 'insensitive' } },
          { nameEn: { contains: 'Case', mode: 'insensitive' } },
          { nameEn: { contains: 'Cover', mode: 'insensitive' } },
          { nameEn: { contains: 'Headset', mode: 'insensitive' } },
          { nameEn: { contains: 'Speaker', mode: 'insensitive' } },
          { nameEn: { contains: 'Glue', mode: 'insensitive' } },
        ];
      } else if (catLower.includes('smart') || catLower.includes('phone')) {
        where.OR = [
          { categoryId: categoryId },
          { sku: { startsWith: 'MOB', mode: 'insensitive' } },
          { nameEn: { contains: 'Galaxy', mode: 'insensitive' } },
          { nameEn: { contains: 'iPhone', mode: 'insensitive' } },
          { nameEn: { contains: 'Redmi', mode: 'insensitive' } },
        ];
      } else {
        where.categoryId = categoryId;
      }
    } else {
      where.categoryId = categoryId;
    }
  }

  if (brandId) where.brandId = brandId;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take,
      orderBy: { nameEn: 'asc' },
      include: { category: { select: { id: true, nameEn: true, nameUr: true } }, brand: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);
  return apiRes.paginated(res, products, buildPaginationMeta(total, page, limit));
}));

// GET /products/low-stock
router.get('/low-stock', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { currentStock: 'asc' },
    take: 50,
  });
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStockLevel);
  return apiRes.success(res, lowStockProducts);
}));

// GET /products/search?q= (fast POS barcode/name search)
router.get('/search', asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return apiRes.success(res, []);
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { nameEn: { contains: q } },
        { nameUr: { contains: q } },
        { sku: { contains: q } },
        { barcode: q },
      ],
    },
    take: 20,
    include: { category: { select: { nameEn: true, nameUr: true } }, brand: { select: { name: true } } },
  });
  return apiRes.success(res, products);
}));

// POST /products/bulk-csv — Bulk CSV import endpoint
router.post('/bulk-csv', managerOrAdmin, asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return apiRes.badRequest(res, 'Invalid or empty items list');
  }

  // Fetch or create default category
  let defaultCategory = await prisma.category.findFirst();
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({ data: { nameEn: 'General', nameUr: 'عام', sortOrder: 1 } });
  }

  let createdCount = 0;
  for (const item of items) {
    if (!item.nameEn || !item.sellingPrice) continue;

    const sku = item.sku || `SKU-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const barcode = item.barcode || null;

    // Skip if existing SKU or Barcode
    const existing = await prisma.product.findFirst({
      where: { OR: [{ sku }, ...(barcode ? [{ barcode }] : [])] },
    });

    if (existing) {
      // Update stock
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          currentStock: existing.currentStock + Number(item.currentStock || 0),
          sellingPrice: Number(item.sellingPrice),
          purchasePrice: Number(item.purchasePrice || item.sellingPrice * 0.8),
        },
      });
      createdCount++;
    } else {
      await prisma.product.create({
        data: {
          nameEn: item.nameEn,
          nameUr: item.nameUr || null,
          sku,
          barcode,
          categoryId: item.categoryId || defaultCategory.id,
          purchasePrice: Number(item.purchasePrice || item.sellingPrice * 0.8),
          sellingPrice: Number(item.sellingPrice),
          minStockLevel: Number(item.minStockLevel || 5),
          currentStock: Number(item.currentStock || 0),
        },
      });
      createdCount++;
    }
  }

  return apiRes.success(res, { imported: createdCount }, `Successfully imported ${createdCount} products into inventory`);
}));

// GET /products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true, brand: true, variants: true,
      stockMovements: { take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { fullName: true } } } },
    },
  });
  if (!product) return apiRes.notFound(res, 'Product not found');
  return apiRes.success(res, product);
}));

// POST /products
router.post('/', managerOrAdmin, validate(createProductSchema), asyncHandler(async (req, res) => {
  const product = await prisma.product.create({ data: req.validatedBody, include: { category: true, brand: true } });
  return apiRes.created(res, product, 'Product created');
}));

// POST /products/:id/image
router.post('/:id/image', managerOrAdmin, uploadProductImage, asyncHandler(async (req, res) => {
  if (!req.file) return apiRes.badRequest(res, 'No image uploaded');
  const imagePath = `/uploads/${req.file.filename}`;
  const product = await prisma.product.update({ where: { id: req.params.id }, data: { image: imagePath } });
  return apiRes.success(res, { image: imagePath }, 'Image uploaded');
}));

// PUT /products/:id
router.put('/:id', managerOrAdmin, validate(updateProductSchema), asyncHandler(async (req, res) => {
  const product = await prisma.product.update({ where: { id: req.params.id }, data: req.validatedBody, include: { category: true, brand: true } });
  return apiRes.success(res, product, 'Product updated');
}));

// DELETE /products/bulk-delete-all — Delete all products at once
router.delete('/bulk-delete-all', managerOrAdmin, asyncHandler(async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.stockMovement.deleteMany({}),
      prisma.productVariant.deleteMany({}),
      prisma.saleItem.deleteMany({}),
      prisma.purchaseItem.deleteMany({}),
      prisma.product.deleteMany({}),
    ]);
    return apiRes.success(res, null, 'All products have been permanently deleted from inventory');
  } catch (err) {
    // Fallback to soft deleting all products if foreign key constraints exist
    await prisma.product.updateMany({ data: { isActive: false, currentStock: 0 } });
    return apiRes.success(res, null, 'All products have been cleared from inventory');
  }
}));

// DELETE /products/:id (soft delete)
router.delete('/:id', managerOrAdmin, asyncHandler(async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  return apiRes.success(res, null, 'Product deactivated');
}));

export default router;
