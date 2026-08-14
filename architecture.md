# 🏗️ System Architecture — Mobile Shop POS & Management System

## Overview

This document describes the complete technical architecture of the **Mobile Shop POS + Inventory + Sales & Purchase Management System**. The system follows a **3-tier architecture**: Presentation Layer (React), Application Layer (Express.js), and Data Layer (PostgreSQL).

---

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                       │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│   │  POS UI  │  │Inventory │  │  Sales   │  │  Reports &       │  │
│   │ (Cashier)│  │  Panel   │  │ Purchase │  │  Dashboard       │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│                        React 18 + Vite + Ant Design                │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / REST API (JSON)
                             │ JWT Bearer Token in Headers
┌────────────────────────────▼────────────────────────────────────────┐
│                      APPLICATION LAYER (Server)                     │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    Express.js REST API                       │  │
│   │                                                              │  │
│   │  /api/auth     /api/products    /api/sales    /api/reports   │  │
│   │  /api/users    /api/inventory   /api/purchase /api/customers │  │
│   │                                                              │  │
│   │  Middleware Stack:                                           │  │
│   │  [Auth] → [Role Guard] → [Validator] → [Controller]         │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                     Node.js 20 LTS + Express.js 4                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Prisma ORM (SQL Queries)
┌────────────────────────────▼────────────────────────────────────────┐
│                         DATA LAYER                                  │
│                                                                     │
│   ┌─────────────────┐      ┌──────────────────┐                    │
│   │   PostgreSQL 15  │      │   File Storage    │                   │
│   │   (Primary DB)   │      │   (Local/S3)      │                   │
│   │                 │      │  Product Images   │                    │
│   │  Tables:        │      │  Invoice PDFs     │                    │
│   │  - users        │      │  Receipts         │                    │
│   │  - products     │      └──────────────────┘                    │
│   │  - sales        │                                               │
│   │  - purchases    │      ┌──────────────────┐                    │
│   │  - customers    │      │   Redis Cache     │                    │
│   │  - suppliers    │      │   (Optional)      │                    │
│   │  - stock_moves  │      │  Dashboard Stats  │                    │
│   └─────────────────┘      └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### Technology Stack
- **Framework**: React 18 (with Vite bundler)
- **UI Library**: Ant Design v5
- **State Management**: Zustand (global store)
- **Routing**: React Router v6
- **HTTP Client**: Axios (with interceptors)
- **Charts**: Recharts
- **PDF/Print**: react-to-print + jsPDF
- **Barcode**: QuaggaJS (webcam), react-barcode (display)

### Frontend Module Structure
```
client/src/
│
├── api/                        # All Axios API call functions
│   ├── auth.api.js
│   ├── products.api.js
│   ├── sales.api.js
│   ├── purchases.api.js
│   ├── customers.api.js
│   └── reports.api.js
│
├── components/                 # Reusable UI components
│   ├── layout/
│   │   ├── AppLayout.jsx       # Main sidebar + header
│   │   ├── Sidebar.jsx
│   │   └── TopBar.jsx
│   ├── pos/
│   │   ├── ProductSearch.jsx
│   │   ├── CartPanel.jsx
│   │   ├── PaymentModal.jsx
│   │   └── ReceiptPrint.jsx
│   ├── common/
│   │   ├── DataTable.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── StatusBadge.jsx
│   │   └── PageHeader.jsx
│   └── charts/
│       ├── SalesChart.jsx
│       └── StockChart.jsx
│
├── pages/                      # Route-level page components
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   ├── pos/
│   │   └── POSPage.jsx
│   ├── inventory/
│   │   ├── ProductsPage.jsx
│   │   ├── ProductFormPage.jsx
│   │   └── StockAdjustPage.jsx
│   ├── sales/
│   │   ├── SalesListPage.jsx
│   │   ├── SaleDetailPage.jsx
│   │   └── ReturnsPage.jsx
│   ├── purchase/
│   │   ├── SuppliersPage.jsx
│   │   ├── PurchaseOrderPage.jsx
│   │   └── GRNPage.jsx
│   ├── customers/
│   │   └── CustomersPage.jsx
│   ├── reports/
│   │   └── ReportsPage.jsx
│   └── settings/
│       └── SettingsPage.jsx
│
├── store/                      # Zustand state stores
│   ├── authStore.js            # User session, token
│   ├── cartStore.js            # POS cart state
│   ├── settingsStore.js        # App config (tax rate, currency)
│   └── notificationStore.js
│
├── utils/
│   ├── formatters.js           # Currency, date, number formatters
│   ├── validators.js           # Form validation helpers
│   ├── constants.js            # Enums, role names, status codes
│   └── printHelpers.js         # Receipt/invoice print utilities
│
├── hooks/
│   ├── useAuth.js
│   ├── useDebounce.js
│   └── usePrint.js
│
├── router/
│   ├── AppRouter.jsx
│   └── ProtectedRoute.jsx      # Route guard by role
│
└── App.jsx
```

### State Management Flow (Zustand)
```
User Action → Component → Zustand Action → API Call → Update Store → Re-render
```

### Route Guard Logic
```
Route Access → Check JWT Token → Check Role → Allow/Redirect
  ADMIN      → All routes
  MANAGER    → All except User Management
  CASHIER    → POS, Sales, Customers only
```

---

## 3. Backend Architecture

### Technology Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4
- **ORM**: Prisma 5
- **Auth**: JWT + bcryptjs
- **Validation**: Zod
- **File Upload**: Multer
- **PDF**: PDFKit
- **Logging**: Winston + Morgan

### Backend Module Structure
```
server/src/
│
├── controllers/               # Handle HTTP req/res
│   ├── auth.controller.js
│   ├── product.controller.js
│   ├── inventory.controller.js
│   ├── sale.controller.js
│   ├── purchase.controller.js
│   ├── customer.controller.js
│   ├── supplier.controller.js
│   ├── report.controller.js
│   └── user.controller.js
│
├── routes/                    # Express route definitions
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── inventory.routes.js
│   ├── sale.routes.js
│   ├── purchase.routes.js
│   ├── customer.routes.js
│   ├── supplier.routes.js
│   ├── report.routes.js
│   └── user.routes.js
│
├── middleware/
│   ├── auth.middleware.js      # JWT verification
│   ├── role.middleware.js      # Role-based access control
│   ├── validate.middleware.js  # Zod schema validation
│   ├── upload.middleware.js    # Multer file upload
│   ├── errorHandler.middleware.js
│   └── requestLogger.middleware.js
│
├── services/                  # Business logic layer
│   ├── auth.service.js
│   ├── product.service.js
│   ├── inventory.service.js
│   ├── sale.service.js
│   ├── purchase.service.js
│   ├── report.service.js
│   └── pdf.service.js
│
├── validators/                # Zod schemas
│   ├── auth.validator.js
│   ├── product.validator.js
│   ├── sale.validator.js
│   └── purchase.validator.js
│
├── utils/
│   ├── logger.js              # Winston logger
│   ├── apiResponse.js         # Standardized response helpers
│   ├── pagination.js          # Reusable pagination logic
│   └── invoiceNumber.js       # Auto-generate invoice #s
│
├── config/
│   ├── database.js            # Prisma client singleton
│   ├── env.js                 # Environment variable validation
│   └── constants.js
│
└── index.js                   # App entry point
```

### Request Lifecycle
```
HTTP Request
    │
    ▼
Express Router
    │
    ▼
[Morgan] → Log request
    │
    ▼
[Auth Middleware] → Verify JWT token
    │
    ▼
[Role Middleware] → Check permission
    │
    ▼
[Validate Middleware] → Zod schema check
    │
    ▼
Controller → Call Service
    │
    ▼
Service → Prisma ORM → PostgreSQL
    │
    ▼
Standardized JSON Response
    │
    ▼
[Error Handler] → Catch any errors
```

---

## 4. Database Architecture

See `database.md` for full schema details.

**Database**: PostgreSQL 15
**ORM**: Prisma 5 (with migrations)
**Connection Pooling**: Prisma built-in connection pool

---

## 5. API Architecture

### REST API Design Principles
- **Base URL**: `/api/v1/`
- **Format**: JSON request & response bodies
- **Auth**: `Authorization: Bearer <JWT>` header
- **Versioning**: URI versioning (`/api/v1/`, `/api/v2/`)
- **Pagination**: `?page=1&limit=20` query params
- **Filtering**: `?search=iphone&category=phones`
- **Sorting**: `?sortBy=createdAt&order=desc`

### Standard Response Format
```json
// Success Response
{
  "success": true,
  "message": "Products fetched successfully",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error Response
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "price", "message": "Price must be a positive number" }
  ]
}
```

### Key API Endpoints
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/products
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
GET    /api/v1/products/:id/stock

POST   /api/v1/sales
GET    /api/v1/sales
GET    /api/v1/sales/:id
POST   /api/v1/sales/:id/return

POST   /api/v1/purchases
GET    /api/v1/purchases
PUT    /api/v1/purchases/:id/receive

GET    /api/v1/reports/dashboard
GET    /api/v1/reports/sales
GET    /api/v1/reports/inventory
GET    /api/v1/reports/profit-loss
```

---

## 6. Deployment Architecture

### Local (Offline) — Docker Compose
```
┌──────────────────────────────────────┐
│           Shop PC / Laptop           │
│                                      │
│  ┌─────────────┐  ┌───────────────┐  │
│  │  Nginx       │  │  Node.js API  │  │
│  │  :80/:443   │→ │  :3001        │  │
│  │  (serves    │  └───────┬───────┘  │
│  │  React app) │          │          │
│  └─────────────┘   ┌──────▼──────┐  │
│                    │ PostgreSQL  │   │
│                    │  :5432      │   │
│                    └─────────────┘  │
└──────────────────────────────────────┘
         Accessible via LAN: http://192.168.x.x
         All shop terminals connect via browser
```

### Cloud (VPS) — Production
```
Internet → Nginx (SSL/TLS) → PM2 (Node.js) → PostgreSQL (RDS/local)
                           → React Static Files (served by Nginx)
```

---

## 7. Security Architecture

See `security.md` for full security implementation details.

**Key Security Layers:**
- JWT token auth with expiry (15min access + 7day refresh)
- Role-Based Access Control (RBAC)
- Input validation via Zod on all endpoints
- SQL injection prevention via Prisma ORM
- Rate limiting on auth endpoints
- HTTPS enforcement in production
- Password hashing with bcrypt (salt rounds: 12)

---

## 8. Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monolith vs Microservices | **Monolith** | Simpler for a single-shop system. Easier to deploy and maintain |
| REST vs GraphQL | **REST** | Well-understood, easier to debug, perfect for CRUD business apps |
| SQL vs NoSQL | **SQL (PostgreSQL)** | Relational data (products, sales, inventory) needs ACID transactions |
| SSR vs SPA | **SPA (React)** | POS needs fast client-side interactions, no full page reloads |
| ORM vs Raw SQL | **Prisma ORM** | Type-safe, auto-migrations, great DX, prevents SQL injection |
| Monorepo vs Separate repos | **Monorepo** | Single repo for client + server simplifies development workflow |
