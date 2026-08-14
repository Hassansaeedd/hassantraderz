// server/src/routes/user.routes.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware.js';
import * as apiRes from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';

const router = Router();
router.use(authMiddleware);

const createUserSchema = z.object({
  username:  z.string().min(3).max(50),
  email:     z.string().email().optional().nullable(),
  fullName:  z.string().min(2).max(100),
  phone:     z.string().optional().nullable(),
  role:      z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
  password:  z.string().min(8),
});

// GET /users
router.get('/', managerOrAdmin, asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = getPaginationParams(req.query);
  const where = req.query.search
    ? { OR: [{ username: { contains: req.query.search, mode: 'insensitive' } }, { fullName: { contains: req.query.search, mode: 'insensitive' } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: { id: true, username: true, fullName: true, email: true, phone: true, role: true, status: true, createdAt: true } }),
    prisma.user.count({ where }),
  ]);
  return apiRes.paginated(res, users, buildPaginationMeta(total, page, limit));
}));

// POST /users
router.post('/', adminOnly, validate(createUserSchema), asyncHandler(async (req, res) => {
  const { password, ...data } = req.validatedBody;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { ...data, passwordHash }, select: { id: true, username: true, fullName: true, role: true, status: true } });
  return apiRes.created(res, user, 'User created successfully');
}));

// PUT /users/:id
router.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const { password, ...data } = req.body;
  const updateData = { ...data };
  if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: updateData, select: { id: true, username: true, fullName: true, role: true, status: true } });
  return apiRes.success(res, user, 'User updated');
}));

// DELETE /users/:id (soft deactivate)
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.userId) return apiRes.badRequest(res, 'Cannot deactivate your own account');
  await prisma.user.update({ where: { id: req.params.id }, data: { status: 'INACTIVE' } });
  return apiRes.success(res, null, 'User deactivated');
}));

function managerOrAdmin(req, res, next) {
  if (!['ADMIN', 'MANAGER'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
}

export default router;
