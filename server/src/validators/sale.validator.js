// server/src/validators/sale.validator.js
import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  items: z.array(z.object({
    productId:   z.string().cuid(),
    quantity:    z.number().int().min(1).max(9999),
    unitPrice:   z.number().positive(),
    discountPct: z.number().min(0).max(100).default(0),
  })).min(1, 'At least one item is required'),
  paymentMethod:  z.enum(['CASH', 'CARD', 'EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER', 'CREDIT']),
  amountPaid:     z.number().nonnegative(),
  discountAmount: z.number().min(0).default(0),
  paymentRef:     z.string().max(100).optional().nullable(),
  notes:          z.string().max(500).optional().nullable(),
  offlineId:      z.string().uuid().optional().nullable(), // For offline sync
});

export const returnSaleSchema = z.object({
  items: z.array(z.object({
    saleItemId: z.string().cuid(),
    quantity:   z.number().int().min(1),
  })).min(1),
  reason:          z.string().min(1).max(500),
  refundMethod:    z.enum(['CASH', 'CARD', 'EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER', 'CREDIT']),
});
