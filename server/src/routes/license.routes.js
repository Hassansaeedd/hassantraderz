// server/src/routes/license.routes.js — Super Admin License Generation & Shop Activation
import { Router } from 'express';
import crypto from 'crypto';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();

// Helper: Generate Cryptographically Secure Serial License Key
function generateUniqueLicenseKey(duration = '15_DAYS') {
  const rand1 = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  const rand2 = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  
  let prefix = 'HT-TRIAL-15D';
  if (duration === '30_DAYS')  prefix = 'HT-MONTH-30D';
  if (duration === '90_DAYS')  prefix = 'HT-QTR-90D';
  if (duration === '180_DAYS') prefix = 'HT-HALF-180D';
  if (duration === '365_DAYS') prefix = 'HT-ANNUAL-365D';
  if (duration === 'LIFETIME') prefix = 'HT-ENT-LIFETIME';

  return `${prefix}-${rand1}-${rand2}`;
}

// Helper: Calculate Expiration Date from Duration
function calculateExpirationDate(duration = '15_DAYS', fromDate = new Date()) {
  if (duration === 'LIFETIME') return null;

  const exp = new Date(fromDate);
  if (duration === '15_DAYS')  exp.setDate(exp.getDate() + 15);
  if (duration === '30_DAYS')  exp.setDate(exp.getDate() + 30);
  if (duration === '90_DAYS')  exp.setDate(exp.getDate() + 90);
  if (duration === '180_DAYS') exp.setDate(exp.getDate() + 180);
  if (duration === '365_DAYS') exp.setDate(exp.getDate() + 365);
  return exp;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Manage Licenses & Multi-Shop Subscriptions)
// ─────────────────────────────────────────────────────────────────────────────

// GET /licenses — List all licenses with filters and stats
router.get('/', authMiddleware, adminOnly, asyncHandler(async (req, res) => {
  const { search, status, duration } = req.query;

  const where = {};
  if (status) where.status = status;
  if (duration) where.duration = duration;
  if (search) {
    where.OR = [
      { licenseKey: { contains: search, mode: 'insensitive' } },
      { shopName: { contains: search, mode: 'insensitive' } },
      { ownerName: { contains: search, mode: 'insensitive' } },
      { ownerPhone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const licenses = await prisma.license.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, username: true, fullName: true, email: true, phone: true }
      }
    }
  });

  // Calculate live days remaining and status check
  const now = new Date();
  const enhancedLicenses = licenses.map(lic => {
    let isExpired = false;
    let daysRemaining = null;

    if (lic.expiresAt) {
      const diffTime = new Date(lic.expiresAt) - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0) {
        isExpired = true;
      }
    }

    return {
      ...lic,
      daysRemaining: lic.duration === 'LIFETIME' ? 'Unlimited' : Math.max(0, daysRemaining),
      isExpired: lic.duration === 'LIFETIME' ? false : isExpired,
      effectiveStatus: (lic.status === 'REVOKED') ? 'REVOKED' : (isExpired ? 'EXPIRED' : lic.status),
    };
  });

  // Statistics Summary
  const total = licenses.length;
  const activeCount = enhancedLicenses.filter(l => l.effectiveStatus === 'ACTIVE').length;
  const expiredCount = enhancedLicenses.filter(l => l.effectiveStatus === 'EXPIRED').length;
  const lifetimeCount = enhancedLicenses.filter(l => l.duration === 'LIFETIME').length;

  return apiRes.success(res, {
    licenses: enhancedLicenses,
    summary: { total, activeCount, expiredCount, lifetimeCount }
  });
}));

// POST /licenses/generate — Super Admin generates a unique serial license key
router.post('/generate', authMiddleware, adminOnly, asyncHandler(async (req, res) => {
  const { shopName, ownerName, ownerPhone, duration, notes, count } = req.body;

  const targetDuration = duration || '15_DAYS';
  const qty = Math.min(Math.max(Number(count) || 1, 1), 20); // Generate 1 to 20 keys at once

  const createdKeys = [];
  for (let i = 0; i < qty; i++) {
    const key = generateUniqueLicenseKey(targetDuration);
    const expiresAt = calculateExpirationDate(targetDuration);

    const license = await prisma.license.create({
      data: {
        licenseKey: key,
        shopName: shopName || 'Unassigned Shop',
        ownerName: ownerName || null,
        ownerPhone: ownerPhone || null,
        duration: targetDuration,
        status: 'ACTIVE',
        activatedAt: new Date(),
        expiresAt,
        notes: notes || null,
      }
    });
    createdKeys.push(license);
  }

  return apiRes.created(res, createdKeys, `Successfully generated ${createdKeys.length} license key(s)!`);
}));

// PATCH /licenses/:id/status — Update status (ACTIVE, REVOKED, EXPIRED) or Extend duration
router.patch('/:id/status', authMiddleware, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, extendDays, newDuration } = req.body;

  const existing = await prisma.license.findUnique({ where: { id } });
  if (!existing) return apiRes.notFound(res, 'License not found');

  const updateData = {};
  if (status) updateData.status = status;

  if (newDuration) {
    updateData.duration = newDuration;
    updateData.expiresAt = calculateExpirationDate(newDuration);
    if (status !== 'REVOKED') updateData.status = 'ACTIVE';
  } else if (extendDays && Number(extendDays) > 0) {
    const currentExp = existing.expiresAt && new Date(existing.expiresAt) > new Date()
      ? new Date(existing.expiresAt)
      : new Date();
    currentExp.setDate(currentExp.getDate() + Number(extendDays));
    updateData.expiresAt = currentExp;
    updateData.status = 'ACTIVE';
  }

  const updated = await prisma.license.update({
    where: { id },
    data: updateData
  });

  return apiRes.success(res, updated, 'License updated successfully');
}));

// DELETE /licenses/:id — Delete license
router.delete('/:id', authMiddleware, adminOnly, asyncHandler(async (req, res) => {
  await prisma.license.delete({ where: { id: req.params.id } });
  return apiRes.success(res, null, 'License deleted');
}));

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT / SHOP ACTIVATION & VERIFICATION ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// POST /licenses/activate — Shop user activates a serial key
router.post('/activate', authMiddleware, asyncHandler(async (req, res) => {
  const { licenseKey, hardwareMachineId, shopName } = req.body;
  const userId = req.user.id;

  if (!licenseKey || !licenseKey.trim()) {
    return apiRes.badRequest(res, 'Please provide a valid License Serial Key');
  }

  const keyClean = licenseKey.trim().toUpperCase();
  const license = await prisma.license.findUnique({ where: { licenseKey: keyClean } });

  if (!license) {
    return apiRes.badRequest(res, 'Invalid License Key. Please check the code or contact Hassan Traderz support.');
  }

  if (license.status === 'REVOKED') {
    return apiRes.forbidden(res, 'This License Key has been suspended or revoked. Contact vendor support.');
  }

  // Calculate new expiration from activation moment if not already set
  const expiresAt = calculateExpirationDate(license.duration, new Date());

  const updated = await prisma.license.update({
    where: { id: license.id },
    data: {
      status: 'ACTIVE',
      activatedAt: new Date(),
      expiresAt,
      hardwareMachineId: hardwareMachineId || license.hardwareMachineId || 'HT-DESKTOP-LOCK',
      shopName: shopName || license.shopName || req.user.fullName,
      userId: userId,
    }
  });

  return apiRes.success(res, {
    licenseKey: updated.licenseKey,
    plan: updated.duration === 'LIFETIME' ? 'Commercial Lifetime' : `${updated.duration.replace('_', ' ')} Subscription`,
    status: updated.status,
    expiresAt: updated.expiresAt,
    shopName: updated.shopName,
  }, '🎉 Software License successfully activated!');
}));

// GET /licenses/check — Check current shop's active license validity
router.get('/check', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find latest license associated with this user or system
  let license = await prisma.license.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  // If no user license found, check if there's any active system license
  if (!license) {
    license = await prisma.license.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!license) {
    return apiRes.success(res, {
      isValid: true, // Default to demo trial
      plan: '15-Day Free Trial',
      status: 'ACTIVE',
      daysRemaining: 15,
      expiresAt: calculateExpirationDate('15_DAYS'),
      licenseKey: 'HT-TRIAL-AUTO',
    });
  }

  const now = new Date();
  let isExpired = false;
  let daysRemaining = null;

  if (license.expiresAt) {
    const diffTime = new Date(license.expiresAt) - now;
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 0) {
      isExpired = true;
    }
  }

  const isValid = license.status === 'ACTIVE' && (license.duration === 'LIFETIME' || !isExpired);

  return apiRes.success(res, {
    isValid,
    licenseKey: license.licenseKey,
    plan: license.duration === 'LIFETIME' ? 'Commercial Lifetime Enterprise' : `${license.duration.replace('_', ' ')} Plan`,
    status: (license.status === 'REVOKED') ? 'REVOKED' : (isExpired ? 'EXPIRED' : license.status),
    daysRemaining: license.duration === 'LIFETIME' ? 'Unlimited' : Math.max(0, daysRemaining),
    expiresAt: license.expiresAt,
    shopName: license.shopName,
  });
}));

export default router;
