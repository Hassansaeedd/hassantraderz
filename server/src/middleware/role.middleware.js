// server/src/middleware/role.middleware.js — RBAC Role Guard
import { ForbiddenError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access: user ${req.user.userId} (${req.user.role}) → ${req.method} ${req.path}`);
      return next(new ForbiddenError(`Access denied. Required: ${allowedRoles.join(' or ')}`));
    }
    next();
  };
};

// Shorthand role guards
export const adminOnly = requireRole('ADMIN');
export const managerOrAdmin = requireRole('ADMIN', 'MANAGER');
export const allRoles = requireRole('ADMIN', 'MANAGER', 'CASHIER');
