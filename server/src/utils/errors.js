// server/src/utils/errors.js — Custom Error Classes

export class AppError extends Error {
  constructor(message, statusCode, code = null, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, 'TOKEN_EXPIRED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

export class BusinessError extends AppError {
  constructor(message, code = 'BUSINESS_ERROR') {
    super(message, 422, code);
  }
}

export class InsufficientStockError extends BusinessError {
  constructor(productName, available, requested) {
    super(
      `Insufficient stock for "${productName}". Available: ${available}, Requested: ${requested}`,
      'INSUFFICIENT_STOCK'
    );
    this.available = available;
    this.requested = requested;
  }
}

export class DuplicateSKUError extends ConflictError {
  constructor(sku) {
    super(`Product with SKU "${sku}" already exists`);
  }
}

export class InvalidPaymentError extends BusinessError {
  constructor(message) {
    super(message, 'INVALID_PAYMENT');
  }
}
