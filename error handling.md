# ⚠️ Error Handling Guide — Mobile Shop POS & Management System

## Overview

This document defines the complete error handling strategy for both the **Express.js backend** and the **React frontend**. Consistent, well-structured error handling ensures a reliable user experience and easier debugging.

---

## 1. Error Handling Philosophy

```
Principle 1: Never crash silently
Principle 2: Errors should be informative for developers, safe for users
Principle 3: All errors must be logged with context
Principle 4: Financial operations must fail gracefully with data integrity preserved
Principle 5: Users should always know what went wrong and what to do next
```

---

## 2. Backend Error Architecture

### Error Class Hierarchy

```javascript
// server/src/utils/errors.js

// Base application error
export class AppError extends Error {
  constructor(message, statusCode, code = null, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;          // Machine-readable error code e.g. "PRODUCT_NOT_FOUND"
    this.errors = errors;      // Field-level validation errors
    this.isOperational = true; // Distinguish from unexpected errors
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request
export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

// 401 Unauthorized
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

// 422 Business Logic Error
export class BusinessError extends AppError {
  constructor(message, code) {
    super(message, 422, code);
  }
}

// Business-specific errors
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
```

---

### Global Error Handler Middleware

```javascript
// server/src/middleware/errorHandler.middleware.js
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

export const globalErrorHandler = (err, req, res, next) => {
  // Log the error with context
  const logContext = {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.userId,
    body: req.method !== 'GET' ? req.body : undefined,
    ip: req.ip
  };

  // ─── Operational Errors (expected, user-facing) ───────────────────────────
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational server error:', { error: err.message, ...logContext });
    } else {
      logger.warn('Client error:', { error: err.message, code: err.code, ...logContext });
    }

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors.length > 0 ? err.errors : undefined
    });
  }

  // ─── Prisma Errors ────────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn('Prisma known error:', { code: err.code, meta: err.meta, ...logContext });

    switch (err.code) {
      case 'P2002': // Unique constraint violation
        const field = err.meta?.target?.[0] || 'field';
        return res.status(409).json({
          success: false,
          message: `A record with this ${field} already exists`,
          code: 'DUPLICATE_ENTRY'
        });

      case 'P2025': // Record not found
        return res.status(404).json({
          success: false,
          message: 'The requested record was not found',
          code: 'NOT_FOUND'
        });

      case 'P2003': // Foreign key constraint
        return res.status(400).json({
          success: false,
          message: 'Cannot delete: this record is referenced by other data',
          code: 'FOREIGN_KEY_CONSTRAINT'
        });

      case 'P2014': // Relation violation
        return res.status(400).json({
          success: false,
          message: 'Invalid relationship in request',
          code: 'RELATION_VIOLATION'
        });

      default:
        logger.error('Unhandled Prisma error:', { code: err.code, ...logContext });
        break;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.warn('Prisma validation error:', logContext);
    return res.status(400).json({
      success: false,
      message: 'Invalid data format sent to database',
      code: 'DB_VALIDATION_ERROR'
    });
  }

  // ─── JWT Errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // ─── Multer (File Upload) Errors ──────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds the 2MB limit',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (err.message?.includes('Only JPEG, PNG')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // ─── Unexpected Errors (bugs, system errors) ──────────────────────────────
  logger.error('Unexpected error:', {
    error: err.message,
    stack: err.stack,
    ...logContext
  });

  // Don't expose internal details in production
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    message: isProduction
      ? 'An internal server error occurred. Please try again.'
      : err.message,
    code: 'INTERNAL_ERROR',
    stack: isProduction ? undefined : err.stack
  });
};

// Async handler wrapper to catch promise rejections
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

---

### Winston Logger Configuration

```javascript
// server/src/utils/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (stack) log += `\n${stack}`;
  if (Object.keys(meta).length > 0) log += `\n${JSON.stringify(meta, null, 2)}`;
  return log;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    // Console (development)
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat)
    }),

    // Error log file (rotating daily, keep 30 days)
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '10m'
    }),

    // Combined log file
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m'
    })
  ],
  exceptionHandlers: [
    new DailyRotateFile({ filename: 'logs/exceptions-%DATE%.log' })
  ],
  rejectionHandlers: [
    new DailyRotateFile({ filename: 'logs/rejections-%DATE%.log' })
  ]
});
```

---

### Route-Level Error Examples

```javascript
// server/src/controllers/sale.controller.js
import { asyncHandler } from '../middleware/errorHandler.middleware.js';
import { InsufficientStockError, NotFoundError } from '../utils/errors.js';

// asyncHandler automatically catches errors and passes to global error handler
export const createSale = asyncHandler(async (req, res) => {
  const { items, customerId, paymentMethod, amountPaid } = req.validatedBody;

  // Use Prisma transaction for atomic sale creation
  const sale = await prisma.$transaction(async (tx) => {
    // Check stock for each item
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, currentStock: true }
      });

      if (!product) throw new NotFoundError(`Product`);

      if (product.currentStock < item.quantity) {
        throw new InsufficientStockError(product.name, product.currentStock, item.quantity);
      }
    }

    // Decrement stock atomically
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } }
      });
    }

    // Create sale record...
    // If any step fails, the entire transaction is rolled back
    return createdSale;
  });

  return res.status(201).json({
    success: true,
    message: 'Sale created successfully',
    data: sale
  });
});
```

---

## 3. Frontend Error Handling

### Axios Error Interceptor

```javascript
// client/src/api/axiosInstance.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,  // 30 second timeout
  withCredentials: true  // Send cookies (refresh token)
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors globally
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data,  // Unwrap data from response

  async (error) => {
    const originalRequest = error.config;

    // ── Token Expired: Try to refresh ────────────────────────────────────
    if (error.response?.status === 401 &&
        error.response?.data?.code === 'TOKEN_EXPIRED' &&
        !originalRequest._retry) {

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = data.data.accessToken;

        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Network Error ─────────────────────────────────────────────────────
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      });
    }

    // ── Timeout ───────────────────────────────────────────────────────────
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT'
      });
    }

    // Pass through the error response data
    return Promise.reject(error.response.data || error);
  }
);

export default api;
```

---

### React Error Boundary

```javascript
// client/src/components/common/ErrorBoundary.jsx
import React from 'react';
import { Button, Result } from 'antd';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React Error Boundary caught:', error, info.componentStack);
    // In production: send to error tracking service (Sentry, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Result
            status="500"
            title="Something went wrong"
            subTitle="An unexpected error occurred. Please refresh the page or contact support."
            extra={
              <Button type="primary" onClick={this.handleReset}>
                Refresh Page
              </Button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

// Usage in App.jsx:
// <ErrorBoundary>
//   <AppRouter />
// </ErrorBoundary>
```

---

### Centralized Frontend Error Handler

```javascript
// client/src/utils/errorHandler.js
import { message, notification } from 'antd';

// Error code to user-friendly message map
const ERROR_MESSAGES = {
  'INSUFFICIENT_STOCK': '⚠️ Not enough stock available for one or more items.',
  'DUPLICATE_ENTRY': '⚠️ A record with the same details already exists.',
  'NOT_FOUND': '⚠️ The requested item was not found.',
  'UNAUTHORIZED': '🔒 Your session has expired. Please log in again.',
  'FORBIDDEN': '🚫 You do not have permission to perform this action.',
  'INVALID_PAYMENT': '💳 Invalid payment details. Please check and try again.',
  'NETWORK_ERROR': '📡 Connection failed. Check your network and try again.',
  'TIMEOUT': '⏱️ Request timed out. Please try again.',
  'VALIDATION_ERROR': '📝 Please check your input and try again.',
  'INTERNAL_ERROR': '🔧 Server error. Please try again or contact support.',
};

export const handleApiError = (error, options = {}) => {
  const { showNotification = false, prefix = '' } = options;

  const code = error?.code;
  const serverMessage = error?.message;
  const fieldErrors = error?.errors;

  // Get user-friendly message
  const userMessage = ERROR_MESSAGES[code] || serverMessage || 'An unexpected error occurred';
  const displayMessage = prefix ? `${prefix}: ${userMessage}` : userMessage;

  if (showNotification) {
    notification.error({
      message: 'Error',
      description: displayMessage,
      duration: 5
    });
  } else {
    message.error(displayMessage, 4);
  }

  // Return field errors for form display
  return {
    message: displayMessage,
    fieldErrors: fieldErrors || [],
    code
  };
};

// Helper for Ant Design Form field errors from API
export const applyFieldErrors = (form, errors) => {
  if (!errors || errors.length === 0) return;

  const fields = errors.map(({ field, message }) => ({
    name: field.split('.'),
    errors: [message]
  }));

  form.setFields(fields);
};
```

---

### POS-Specific Error Handling

```javascript
// client/src/pages/pos/POSPage.jsx (error handling section)

const handlePayment = async (paymentData) => {
  setLoading(true);
  try {
    const sale = await api.post('/sales', {
      ...paymentData,
      items: cart.items
    });

    // Success
    message.success('Sale completed successfully!');
    clearCart();
    setReceiptData(sale.data);
    setReceiptVisible(true);

  } catch (error) {
    // Handle specific POS errors differently
    if (error.code === 'INSUFFICIENT_STOCK') {
      // Show which specific product is out of stock
      notification.error({
        message: 'Stock Unavailable',
        description: error.message,
        duration: 0,  // Don't auto-close — cashier needs to see this
        btn: (
          <Button onClick={() => removeOutOfStockItem(error)}>
            Remove Item from Cart
          </Button>
        )
      });
    } else {
      handleApiError(error, { showNotification: true, prefix: 'Payment Failed' });
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 4. Error Codes Reference

| Code | HTTP | Meaning | User Action |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid input data | Fix the highlighted fields |
| `UNAUTHORIZED` | 401 | Not logged in or token expired | Log in again |
| `TOKEN_EXPIRED` | 401 | JWT access token expired | Auto-refreshed silently |
| `FORBIDDEN` | 403 | Insufficient role/permission | Contact admin |
| `NOT_FOUND` | 404 | Record doesn't exist | Verify the ID |
| `CONFLICT` | 409 | Duplicate record | Use a different value |
| `DUPLICATE_ENTRY` | 409 | Unique field already used | Change SKU/barcode/etc |
| `INSUFFICIENT_STOCK` | 422 | Not enough stock | Reduce quantity |
| `INVALID_PAYMENT` | 422 | Payment amount incorrect | Check payment details |
| `FOREIGN_KEY_CONSTRAINT` | 400 | Record is in use | Remove dependencies first |
| `INTERNAL_ERROR` | 500 | Server bug | Retry; contact support |
| `NETWORK_ERROR` | — | No connection | Check network |
| `TIMEOUT` | — | Server too slow | Retry |

---

## 5. Prisma Transaction Error Handling

```javascript
// Always use transactions for operations that modify multiple tables
export const processSale = async (saleData) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // All operations here are atomic
      // If ANY throws, ALL are rolled back

      for (const item of saleData.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            currentStock: { gte: item.quantity }  // Atomic check + decrement
          },
          data: { currentStock: { decrement: item.quantity } }
        });

        if (updated.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, currentStock: true }
          });
          throw new InsufficientStockError(product.name, product.currentStock, item.quantity);
        }
      }

      const sale = await tx.sale.create({ data: { ... } });
      await tx.stockMovement.createMany({ data: [...] });

      return sale;
    }, {
      timeout: 10000,         // 10 second transaction timeout
      maxWait: 5000,          // Max 5 seconds to acquire connection
      isolationLevel: 'Serializable'  // Prevent phantom reads
    });

  } catch (error) {
    if (error instanceof AppError) throw error;  // Re-throw our errors

    logger.error('Transaction failed:', { error: error.message, data: saleData });
    throw new AppError('Failed to process sale. No changes were made.', 500);
  }
};
```

---

## 6. Frontend Error UI Patterns

```
API Loading State:     → Show Ant Design Skeleton or Spin
Validation Error:      → Red field border + error message below field
Not Found (404):       → Empty state with icon and message
Server Error (500):    → Error notification + retry button
Auth Error (401):      → Auto-redirect to login page
Network Error:         → Warning banner at top of page
POS Stock Error:       → Persistent notification with action button
Form Submit Error:     → Apply field-level errors to specific form fields
List Empty State:      → Centered icon + "No data yet" + Create button
```
