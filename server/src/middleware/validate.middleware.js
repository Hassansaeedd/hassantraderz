// server/src/middleware/validate.middleware.js — Zod Schema Validation
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

export const validate = (schema) => async (req, res, next) => {
  try {
    req.validatedBody = await schema.parseAsync(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ValidationError('Validation failed', errors));
    }
    next(err);
  }
};

export const validateQuery = (schema) => async (req, res, next) => {
  try {
    req.validatedQuery = await schema.parseAsync(req.query);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(new ValidationError('Invalid query parameters', errors));
    }
    next(err);
  }
};
