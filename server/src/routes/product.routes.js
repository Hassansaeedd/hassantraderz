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
  const isSuperAdmin = req.user?.username === 'Hassan@009' || req.user?.role === 'SUPERADMIN';

  const where = {
    isActive: true,
    ...(isSuperAdmin ? {} : { userId: req.user.userId }),
  };

  if (search) {
    where.AND = [
      {
        OR: [
          { nameEn: { contains: search, mode: 'insensitive' } },
          { nameUr: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
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
  const isSuperAdmin = req.user?.username === 'Hassan@009' || req.user?.role === 'SUPERADMIN';
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(isSuperAdmin ? {} : { userId: req.user.userId }),
    },
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
  const isSuperAdmin = req.user?.username === 'Hassan@009' || req.user?.role === 'SUPERADMIN';

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(isSuperAdmin ? {} : { userId: req.user.userId }),
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
  const userId = req.user.userId;

  // Fetch or create default category
  let defaultCategory = await prisma.category.findFirst();
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({ data: { nameEn: 'General', nameUr: 'عام', sortOrder: 1 } });
  }

  let createdCount = 0;
  for (const item of items) {
    if (!item.nameEn || !item.sellingPrice) continue;

    const baseSku = item.sku || `SKU-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const barcode = item.barcode || null;

    // Check existing for this shop
    const existing = await prisma.product.findFirst({
      where: {
        userId,
        OR: [{ sku: baseSku }, ...(barcode ? [{ barcode }] : [])],
      },
    });

    if (existing) {
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
      let finalSku = baseSku;
      const globalConflict = await prisma.product.findUnique({ where: { sku: finalSku } });
      if (globalConflict && globalConflict.userId !== userId) {
        finalSku = `${baseSku}-${userId.substring(userId.length - 4)}`;
      }

      await prisma.product.create({
        data: {
          nameEn: item.nameEn,
          nameUr: item.nameUr || null,
          sku: finalSku,
          barcode,
          categoryId: item.categoryId || defaultCategory.id,
          purchasePrice: Number(item.purchasePrice || item.sellingPrice * 0.8),
          sellingPrice: Number(item.sellingPrice),
          minStockLevel: Number(item.minStockLevel || 3),
          currentStock: Number(item.currentStock || 0),
          userId,
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
  const userId = req.user.userId;
  let finalSku = req.validatedBody.sku;
  const existing = await prisma.product.findUnique({ where: { sku: finalSku } });
  if (existing) {
    if (existing.userId === userId) {
      return apiRes.badRequest(res, 'A product with this SKU already exists in your inventory');
    }
    finalSku = `${finalSku}-${userId.substring(userId.length - 4)}`;
  }

  const product = await prisma.product.create({
    data: { ...req.validatedBody, sku: finalSku, userId },
    include: { category: true, brand: true }
  });
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

// DELETE /products/bulk-delete-all — Delete all products of THIS shop only
router.delete('/bulk-delete-all', managerOrAdmin, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  try {
    const shopProducts = await prisma.product.findMany({
      where: { userId },
      select: { id: true },
    });
    const productIds = shopProducts.map(p => p.id);

    if (productIds.length > 0) {
      await prisma.$transaction([
        prisma.stockMovement.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.saleItem.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.purchaseItem.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.product.deleteMany({ where: { id: { in: productIds } } }),
      ]);
    }
    return apiRes.success(res, null, 'All products have been permanently deleted from inventory');
  } catch (err) {
    await prisma.product.updateMany({ where: { userId }, data: { isActive: false, currentStock: 0 } });
    return apiRes.success(res, null, 'All products have been cleared from inventory');
  }
}));

// DELETE /products/:id (permanent delete)
router.delete('/:id', managerOrAdmin, asyncHandler(async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.stockMovement.deleteMany({ where: { productId: req.params.id } }),
      prisma.productVariant.deleteMany({ where: { productId: req.params.id } }),
      prisma.product.delete({ where: { id: req.params.id } }),
    ]);
    return apiRes.success(res, null, 'Product permanently deleted');
  } catch (err) {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false, currentStock: 0 } });
    return apiRes.success(res, null, 'Product removed from inventory');
  }
}));

export default router;
