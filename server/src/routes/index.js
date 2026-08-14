// server/src/routes/index.js — Master API Router
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';
import productRoutes from './product.routes.js';
import customerRoutes from './customer.routes.js';
import supplierRoutes from './supplier.routes.js';
import purchaseRoutes from './purchase.routes.js';
import saleRoutes from './sale.routes.js';
import inventoryRoutes from './inventory.routes.js';
import reportRoutes from './report.routes.js';
import settingRoutes from './setting.routes.js';

const router = Router();

// Public
router.use('/auth', authRoutes);

// Protected (auth required on each sub-router)
router.use('/users',      userRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands',     brandRoutes);
router.use('/products',   productRoutes);
router.use('/customers',  customerRoutes);
router.use('/suppliers',  supplierRoutes);
router.use('/purchases',  purchaseRoutes);
router.use('/sales',      saleRoutes);
router.use('/inventory',  inventoryRoutes);
router.use('/reports',    reportRoutes);
router.use('/settings',   settingRoutes);

export default router;
