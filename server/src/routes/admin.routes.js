// server/src/routes/admin.routes.js — Dedicated Super Admin Platform API
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

// Middleware to ensure caller is Super Admin (Hassan@009)
const superAdminOnly = (req, res, next) => {
  const isSuper = req.user.username === 'Hassan@009' || req.user.role === 'SUPERADMIN';
  if (!isSuper) {
    return apiRes.forbidden(res, 'Access denied. Super Admin privileges required.');
  }
  next();
};

router.use(superAdminOnly);

// ── 1. GET /admin/stats — Overview KPIs for Super Admin Dashboard ────────────
router.get('/stats', asyncHandler(async (req, res) => {
  const now = new Date();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [totalShops, totalLicenses, trialLicenses, expiringSoon] = await Promise.all([
    prisma.user.count({
      where: {
        username: { not: 'Hassan@009' },
      },
    }),
    prisma.license.count({
      where: { status: 'ACTIVE' },
    }),
    prisma.license.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { duration: '15_DAYS' },
          { notes: { contains: 'trial', mode: 'insensitive' } },
        ],
      },
    }),
    prisma.license.count({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gt: now,
          lte: in7Days,
        },
      },
    }),
  ]);

  return apiRes.success(res, {
    totalShops,
    activeLicenses: totalLicenses,
    trialLicenses,
    expiringSoon,
  });
}));

// ── 2. GET /admin/shops — List all client shops with their licenses ─────────
router.get('/shops', asyncHandler(async (req, res) => {
  const shops = await prisma.user.findMany({
    where: {
      username: { not: 'Hassan@009' },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      licenses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          licenseKey: true,
          shopName: true,
          duration: true,
          status: true,
          expiresAt: true,
          activatedAt: true,
        },
      },
    },
  });

  const formatted = shops.map((s) => ({
    id: s.id,
    username: s.username,
    ownerName: s.fullName,
    phone: s.phone || 'N/A',
    email: s.email || 'N/A',
    status: s.status,
    registeredAt: s.createdAt,
    license: s.licenses[0] || null,
  }));

  return apiRes.success(res, formatted);
}));

// ── 3. POST /admin/register-shop — Super Admin Registers a New Client Shop ──
router.post('/register-shop', asyncHandler(async (req, res) => {
  const {
    shopName,
    ownerName,
    username,
    password,
    phone,
    email,
    duration = '15_DAYS', // 15_DAYS, 30_DAYS, 90_DAYS, 180_DAYS, 365_DAYS, LIFETIME
  } = req.body;

  if (!username || !password || !shopName) {
    return apiRes.badRequest(res, 'Shop name, username, and password are required');
  }

  // Check username uniqueness
  const existing = await prisma.user.findFirst({
    where: { username },
  });
  if (existing) {
    return apiRes.badRequest(res, `Username "${username}" is already taken. Please choose a different username.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Calculate Expiry Date
  let expiresAt = null;
  const now = new Date();
  if (duration === '15_DAYS') {
    expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  } else if (duration === '30_DAYS') {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (duration === '90_DAYS') {
    expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  } else if (duration === '180_DAYS') {
    expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  } else if (duration === '365_DAYS') {
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } // LIFETIME stays null

  // Generate Unique License Key
  const prefix = duration === '15_DAYS' ? 'HT-TRIAL' : 'HT-PRO';
  const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rand3 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const licenseKey = `${prefix}-${rand1}-${rand2}-${rand3}`;

  // Atomic creation of user and license
  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username,
        passwordHash,
        fullName: ownerName || shopName,
        phone: phone || null,
        email: email || null,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const newLicense = await tx.license.create({
      data: {
        licenseKey,
        shopName,
        ownerName: ownerName || newUser.fullName,
        ownerPhone: phone || null,
        duration,
        status: 'ACTIVE',
        activatedAt: now,
        expiresAt,
        userId: newUser.id,
        notes: `Provisioned by Super Admin (${duration})`,
      },
    });

    return { user: newUser, license: newLicense };
  });

  return apiRes.created(res, result, `Shop "${shopName}" registered successfully with ${duration} license!`);
}));

// ── 4. POST /admin/shops/:id/extend-license — Extend or Renew License ────────
router.post('/shops/:id/extend-license', asyncHandler(async (req, res) => {
  const { days = 30, isLifetime = false } = req.body;
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { licenses: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!user) return apiRes.notFound(res, 'Shop User');

  const currentLicense = user.licenses[0];
  let newExpiresAt = null;

  if (!isLifetime) {
    const baseDate = currentLicense?.expiresAt && currentLicense.expiresAt > new Date()
      ? new Date(currentLicense.expiresAt)
      : new Date();
    newExpiresAt = new Date(baseDate.getTime() + Number(days) * 24 * 60 * 60 * 1000);
  }

  let updatedLicense;
  if (currentLicense) {
    updatedLicense = await prisma.license.update({
      where: { id: currentLicense.id },
      data: {
        expiresAt: newExpiresAt,
        status: 'ACTIVE',
        duration: isLifetime ? 'LIFETIME' : `${days}_DAYS_EXTENSION`,
        notes: `Extended by Super Admin on ${new Date().toLocaleDateString()}`,
      },
    });
  } else {
    const randKey = `HT-EXT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    updatedLicense = await prisma.license.create({
      data: {
        licenseKey: randKey,
        shopName: user.fullName || user.username,
        duration: isLifetime ? 'LIFETIME' : `${days}_DAYS`,
        status: 'ACTIVE',
        expiresAt: newExpiresAt,
        userId: user.id,
      },
    });
  }

  // Also activate user if suspended
  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'ACTIVE' },
  });

  return apiRes.success(res, updatedLicense, `License extended successfully!`);
}));

// ── 5. PATCH /admin/shops/:id/status — Toggle Shop Access ───────────────────
router.patch('/shops/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body; // 'ACTIVE' | 'INACTIVE'
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { status },
  });

  // Also update license status
  await prisma.license.updateMany({
    where: { userId: req.params.id },
    data: { status: status === 'ACTIVE' ? 'ACTIVE' : 'REVOKED' },
  });

  return apiRes.success(res, updated, `Shop account status updated to ${status}`);
}));

export default router;
