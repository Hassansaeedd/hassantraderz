// server/src/validators/product.validator.js
import { z } from 'zod';

export const createProductSchema = z.object({
  nameEn:        z.string().min(1, 'Product name is required').max(200),
  nameUr:        z.string().max(200).optional(),
  sku:           z.string().min(1, 'SKU is required').max(50),
  barcode:       z.string().max(50).optional().nullable(),
  descriptionEn: z.string().max(1000).optional(),
  descriptionUr: z.string().max(1000).optional(),
  categoryId:    z.string().cuid('Invalid category'),
  brandId:       z.string().cuid('Invalid brand').optional().nullable(),
  purchasePrice: z.number().positive('Purchase price must be positive'),
  sellingPrice:  z.number().positive('Selling price must be positive'),
  gstRate:       z.number().min(0).max(100).default(17),
  gstInclusive:  z.boolean().default(false),
  minStockLevel: z.number().int().min(0).default(5),
});

export const updateProductSchema = createProductSchema.partial();

export const adjustStockSchema = z.object({
  productId: z.string().cuid(),
  quantity:  z.number().int().positive('Quantity must be positive'),
  type:      z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
  reason:    z.string().min(1, 'Reason is required').max(200),
});
