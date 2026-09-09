// server/src/services/auth.service.js — Auth business logic
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';

const SALT_ROUNDS = 12;

const signAccessToken = (userId, role, username) =>
  jwt.sign({ userId, role, username }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

export const login = async (username, password, ipAddress) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true, username: true, fullName: true,
      role: true, status: true, passwordHash: true,
      language: true, avatar: true,
    },
  });

  if (!user) throw new AuthenticationError('Invalid username or password');
  if (user.status === 'INACTIVE') throw new ForbiddenError('Your account has been deactivated. Contact admin.');

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    await prisma.activityLog.create({
      data: { userId: user.id, action: 'LOGIN_FAILED', ipAddress, description: `Failed login for ${username}` },
    });
    throw new AuthenticationError('Invalid username or password');
  }

  // Generate tokens
  const accessToken  = signAccessToken(user.id, user.role, user.username);
  const refreshToken = signRefreshToken(user.id);

  // Persist refresh token (7 days expiry)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  // Log activity
  await prisma.activityLog.create({
    data: { userId: user.id, action: 'LOGIN', ipAddress, description: 'User logged in' },
  });

  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  // Validate token exists in DB (one-time use)
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AuthenticationError('Refresh token is no longer valid. Please log in again.');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, status: true },
  });

  if (!user || user.status === 'INACTIVE') throw new AuthenticationError('User not found or inactive');

  // Rotate token: delete old, issue new
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const newAccessToken  = signAccessToken(user.id, user.role);
  const newRefreshToken = signRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id, expiresAt } });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken, userId, ipAddress) => {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  if (userId) {
    await prisma.activityLog.create({
      data: { userId, action: 'LOGOUT', ipAddress, description: 'User logged out' },
    });
  }
};

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, fullName: true,
      email: true, phone: true, role: true,
      status: true, avatar: true, language: true,
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundError('User');
  return user;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
  if (!user) throw new NotFoundError('User');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AuthenticationError('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  // Revoke all refresh tokens on password change
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

export const registerShop = async ({ shopName, ownerName, phone, email, username, password, ipAddress }) => {
  // Check if username already exists
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, ...(email ? [{ email }] : [])] }
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new AuthenticationError('Username is already taken. Please choose another.');
    }
    throw new AuthenticationError('Email address is already registered.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 1. Create shop user
  const user = await prisma.user.create({
    data: {
      username,
      email: email || null,
      phone: phone || null,
      fullName: ownerName || shopName,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    select: {
      id: true, username: true, fullName: true,
      email: true, phone: true, role: true,
      status: true, language: true,
    }
  });

  // 2. Automatically generate a 15-Day Free Trial License for this new shop
  const randKey = `HT-TRIAL-15D-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 15);

  const trialLicense = await prisma.license.create({
    data: {
      licenseKey: randKey,
      shopName: shopName || `${ownerName}'s Mobile Shop`,
      ownerName: ownerName || user.fullName,
      ownerPhone: phone || null,
      duration: '15_DAYS',
      status: 'ACTIVE',
      activatedAt: new Date(),
      expiresAt,
      userId: user.id,
      notes: 'Self-registered 15-Day Free Trial',
    }
  });

  // 3. Issue JWT tokens
  const accessToken  = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiresAt } });

  // Log activity
  await prisma.activityLog.create({
    data: { userId: user.id, action: 'SHOP_REGISTERED', ipAddress, description: `New shop ${shopName} registered with 15-day trial` },
  });

  return { user, license: trialLicense, accessToken, refreshToken };
};

