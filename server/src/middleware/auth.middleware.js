// server/src/middleware/auth.middleware.js — JWT Verification
import jwt from 'jsonwebtoken';
import { AuthenticationError, TokenExpiredError } from '../utils/errors.js';

import { prisma } from '../config/database.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, username: decoded.username };

    if (!req.user.username) {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { username: true, role: true },
      });
      if (dbUser) {
        req.user.username = dbUser.username;
        if (!req.user.role) req.user.role = dbUser.role;
      }
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new TokenExpiredError());
    if (err.name === 'JsonWebTokenError') return next(new AuthenticationError('Invalid token'));
    next(err);
  }
};

// Async handler wrapper — catches promise rejections automatically
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
