# 🔒 Security Guide — Mobile Shop POS & Management System

## Overview

This document covers all security considerations, implementations, and best practices for the Mobile Shop POS system. Security is critical as the system handles financial transactions and sensitive business data.

---

## 1. Authentication Security

### JWT Token Strategy

```
Access Token:
  - Expiry: 15 minutes
  - Payload: { userId, role, iat, exp }
  - Storage: JavaScript memory (Zustand store) — never localStorage
  - Transmitted: Authorization: Bearer <token> header

Refresh Token:
  - Expiry: 7 days
  - Storage: HttpOnly cookie (inaccessible to JS) + database record
  - Rotation: Issue new refresh token on each use (one-time tokens)
  - Revocation: Delete from DB on logout or suspicious activity
```

### Implementation

```javascript
// server/src/utils/jwt.js
import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m', issuer: 'mobileshop-pos', audience: 'mobileshop-client' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d', issuer: 'mobileshop-pos', audience: 'mobileshop-client' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: 'mobileshop-pos',
    audience: 'mobileshop-client'
  });
};

// Cookie settings for refresh token (production)
export const refreshCookieOptions = {
  httpOnly: true,          // Not accessible via document.cookie
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'strict',      // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in ms
  path: '/api/v1/auth'     // Only sent to auth endpoints
};
```

### Password Security

```javascript
// Password requirements enforced via Zod
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Must contain at least one special character');

// Hashing with bcrypt (12 rounds = ~300ms on modern hardware)
import bcrypt from 'bcryptjs';
const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};
```

---

## 2. Role-Based Access Control (RBAC)

### Role Definitions

| Role | Description | Permissions |
|---|---|---|
| **ADMIN** | Shop owner / System admin | All operations including user management, settings, reports |
| **MANAGER** | Store manager | All operations except user management and security settings |
| **CASHIER** | Counter staff | POS, view own sales, customer lookup only |

### Permission Matrix

| Feature | ADMIN | MANAGER | CASHIER |
|---|---|---|---|
| Login / Logout | ✅ | ✅ | ✅ |
| POS — Create Sale | ✅ | ✅ | ✅ |
| POS — Apply Discount >10% | ✅ | ✅ | ❌ |
| View All Sales | ✅ | ✅ | Own only |
| Process Refund/Return | ✅ | ✅ | ❌ |
| Products — View | ✅ | ✅ | ✅ |
| Products — Create/Edit | ✅ | ✅ | ❌ |
| Products — Delete | ✅ | ❌ | ❌ |
| Inventory — Adjust Stock | ✅ | ✅ | ❌ |
| Customers — View | ✅ | ✅ | ✅ |
| Customers — Edit | ✅ | ✅ | ❌ |
| Suppliers — All | ✅ | ✅ | ❌ |
| Purchases — All | ✅ | ✅ | ❌ |
| Reports — View | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Activity Logs | ✅ | ❌ | ❌ |

### Middleware Implementation

```javascript
// server/src/middleware/role.middleware.js

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      logger.warn(`Unauthorized access attempt by user ${req.user.userId} (${req.user.role}) to ${req.method} ${req.path}`);

      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Usage examples:
// router.get('/users', authMiddleware, requireRole('ADMIN'), getUsers);
// router.post('/products', authMiddleware, requireRole('ADMIN', 'MANAGER'), createProduct);
// router.post('/sales', authMiddleware, requireRole('ADMIN', 'MANAGER', 'CASHIER'), createSale);
```

---

## 3. Input Validation & Sanitization

### Zod Schema Validation

```javascript
// server/src/validators/sale.validator.js
import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().cuid().optional(),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().min(1).max(999),
    unitPrice: z.number().positive().max(9999999),
    discountPct: z.number().min(0).max(100).default(0),
    imeiNumber: z.string().max(20).optional()
  })).min(1, 'At least one item required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CREDIT']),
  amountPaid: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  note: z.string().max(500).optional()
});

// Validation middleware factory
export const validate = (schema) => async (req, res, next) => {
  try {
    req.validatedBody = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};
```

### SQL Injection Prevention

Prisma ORM uses **parameterized queries by default** — all input is treated as data, never as SQL code.

```javascript
// ✅ SAFE — Prisma parameterized query
const products = await prisma.product.findMany({
  where: {
    name: { contains: userInput }  // Parameterized, safe
  }
});

// ❌ NEVER DO THIS — Raw SQL with user input
// await prisma.$queryRawUnsafe(`SELECT * FROM products WHERE name LIKE '%${userInput}%'`);

// ✅ If raw SQL is necessary, use parameterized raw:
const products = await prisma.$queryRaw`
  SELECT * FROM products WHERE name ILIKE ${'%' + userInput + '%'}
`;
```

### XSS Prevention

```javascript
// server — helmet sets security headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false  // Allow images from same domain
}));

// sanitize-html for any user-provided HTML content
import sanitizeHtml from 'sanitize-html';

const safeHtml = sanitizeHtml(userInput, {
  allowedTags: [],       // Strip all HTML
  allowedAttributes: {}
});
```

---

## 4. Rate Limiting

```javascript
// server/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Login rate limiter: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true  // Only count failed logins
});

// General API rate limiter: 500 requests per minute per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});

// Apply in Express:
// app.use('/api/v1/auth/login', loginLimiter);
// app.use('/api/v1/', apiLimiter);
```

---

## 5. CORS Configuration

```javascript
// server/src/config/cors.js
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',                              // Vite dev server
  'http://localhost:3000',                              // Alternative dev port
  process.env.FRONTEND_URL,                             // Production frontend URL
  'http://192.168.1.0/24'                              // Local network (shop LAN)
].filter(Boolean);

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, same-origin)
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed.replace('/24', '')))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,           // Allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count']
};
```

---

## 6. File Upload Security

```javascript
// server/src/middleware/upload.middleware.js
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    // Generate random filename to prevent path traversal attacks
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
  cb(null, true);
};

export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).single('image');
```

---

## 7. Data Protection

### Sensitive Data Handling

```javascript
// Never log or return sensitive data
const user = await prisma.user.findUnique({ where: { id } });

// Strip sensitive fields before sending to client
const { passwordHash, ...safeUser } = user;
return safeUser;

// Use Prisma select to never even fetch sensitive fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    username: true,
    fullName: true,
    role: true,
    status: true,
    // passwordHash: NOT included
  }
});
```

### Environment Variables Security

```bash
# .env — NEVER commit this file to Git
JWT_ACCESS_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
DATABASE_URL=postgresql://posuser:STRONG_PASSWORD@localhost:5432/mobileshop_db
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

```bash
# .gitignore — must include
.env
.env.local
.env.production
*.env
node_modules/
uploads/
logs/
```

---

## 8. Activity Logging & Audit Trail

```javascript
// server/src/services/activityLog.service.js

export const logActivity = async (prisma, {
  userId,
  action,
  entity = null,
  entityId = null,
  description = null,
  ipAddress = null
}) => {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entity, entityId, description, ipAddress }
    });
  } catch (err) {
    // Don't fail the main operation if logging fails
    logger.error('Failed to create activity log:', err);
  }
};

// Actions to always log:
// AUTH: LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGED
// SALES: SALE_CREATED, SALE_RETURNED, SALE_CANCELLED
// INVENTORY: STOCK_ADJUSTED, PRODUCT_CREATED, PRODUCT_DELETED
// PURCHASES: PURCHASE_CREATED, GOODS_RECEIVED
// USERS: USER_CREATED, USER_UPDATED, USER_DEACTIVATED
// SETTINGS: SETTINGS_UPDATED
```

---

## 9. HTTPS & Transport Security

### Production Nginx Config (SSL)

```nginx
# nginx.conf
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;  # Force HTTPS
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
```

---

## 10. Security Checklist

### Pre-Launch Security Review

#### Authentication
- [ ] JWT secrets are at least 64 bytes of random data
- [ ] Refresh tokens stored in HttpOnly cookies
- [ ] Access tokens not stored in localStorage
- [ ] Login rate limiting enabled (5 attempts / 15 min)
- [ ] Password requirements enforced (8+ chars, uppercase, number, special)
- [ ] Logout properly invalidates refresh token in DB

#### Authorization
- [ ] Every API route has auth middleware
- [ ] Every admin route has role middleware
- [ ] Cashier cannot access /admin routes
- [ ] Financial reports require ADMIN or MANAGER role

#### Input Validation
- [ ] All POST/PUT endpoints validate with Zod
- [ ] File uploads validate MIME type and size
- [ ] SQL injection: using Prisma parameterized queries only
- [ ] XSS: helmet headers configured

#### Data Security
- [ ] .env file in .gitignore
- [ ] passwordHash never returned in API responses
- [ ] Logs don't contain passwords or tokens
- [ ] Database user has minimum required permissions

#### Infrastructure
- [ ] HTTPS enabled in production
- [ ] Database not exposed to public internet
- [ ] Firewall: only ports 80, 443, 22 open externally
- [ ] Regular database backups (daily)
- [ ] Error messages don't expose stack traces in production

#### Monitoring
- [ ] Failed login attempts logged
- [ ] All financial operations logged with userId
- [ ] Server error logs rotated (Winston daily rotate)
