// server/src/middleware/errorHandler.middleware.js — Global Error Handler
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

export const globalErrorHandler = (err, req, res, next) => {
  const ctx = { method: req.method, url: req.originalUrl, userId: req.user?.userId };

  // ── Our custom operational errors ──────────────────────────────────────────
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error('Server error:', { ...ctx, message: err.message });
    else logger.warn('Client error:', { ...ctx, code: err.code, message: err.message });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors?.length ? err.errors : undefined,
    });
  }

  // ── Prisma errors ──────────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn('Prisma error:', { code: err.code, meta: err.meta, ...ctx });
    switch (err.code) {
      case 'P2002': {
        const field = err.meta?.target?.[0] || 'field';
        return res.status(409).json({ success: false, message: `Duplicate value for ${field}`, code: 'DUPLICATE_ENTRY' });
      }
      case 'P2025':
        return res.status(404).json({ success: false, message: 'Record not found', code: 'NOT_FOUND' });
      case 'P2003':
        return res.status(400).json({ success: false, message: 'Cannot delete: record is referenced by other data', code: 'FOREIGN_KEY_CONSTRAINT' });
      default:
        break;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ success: false, message: 'Invalid data format', code: 'DB_VALIDATION_ERROR' });
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });

  // ── Multer errors ──────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ success: false, message: 'File too large. Max 2MB allowed.', code: 'FILE_TOO_LARGE' });

  // ── Unknown errors ─────────────────────────────────────────────────────────
  logger.error('Unexpected error:', { ...ctx, message: err.message, stack: err.stack });

  const isProd = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    message: isProd ? 'An unexpected error occurred. Please try again.' : err.message,
    code: 'INTERNAL_ERROR',
    stack: isProd ? undefined : err.stack,
  });
};

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
