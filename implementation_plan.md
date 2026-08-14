# 📱 Mobile Shop POS + Inventory & Sales Management System

## Project Overview

A fully-featured, production-ready business management system for a **mobile phone retail shop**, covering:
- **Point of Sale (POS)** — fast billing at the counter
- **Inventory Management** — track stock, products, variants (RAM/Storage/Color)
- **Sales Management** — invoices, returns, sales reports
- **Purchase Management** — suppliers, purchase orders, goods received notes
- **Dashboard & Reports** — revenue, profit, low-stock alerts, top products

---

## ✅ Recommended Tech Stack

> **Why this stack?** Practical, battle-tested, easy to deploy locally or to cloud, and can run offline (PWA support). No exotic dependencies — your client can get a developer to maintain it easily.

### 🖥️ Frontend (Web App — Desktop & Tablet optimized for POS)
| Technology | Choice | Reason |
|---|---|---|
| Framework | **React 18 + Vite** | Fast dev server, large ecosystem, component-based UI ideal for POS |
| UI Library | **Ant Design (antd)** | Rich data tables, forms, modals — perfect for business apps |
| State Management | **Zustand** | Lightweight, simple, no boilerplate |
| Routing | **React Router v6** | Standard SPA routing |
| Charts/Reports | **Recharts** | Beautiful, responsive charts for dashboards |
| HTTP Client | **Axios** | Clean API calls with interceptors |
| Print/Invoice | **react-to-print + jsPDF** | Print receipts and generate PDF invoices |
| Barcode Scanning | **QuaggaJS / ZXing** | Scan product barcodes using webcam |
| PWA Support | **Vite PWA Plugin** | Works offline if internet drops |

### ⚙️ Backend (REST API)
| Technology | Choice | Reason |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Consistent with frontend JS knowledge |
| Framework | **Express.js** | Minimal, fast, widely understood |
| ORM | **Prisma** | Type-safe DB access, easy migrations, great DX |
| Authentication | **JWT + bcrypt** | Secure, stateless auth with role-based access |
| File Uploads | **Multer** | Product images, supplier documents |
| PDF Generation | **PDFKit / Puppeteer** | Server-side invoice & report PDF generation |
| Validation | **Zod** | Runtime schema validation for all API inputs |
| API Docs | **Swagger UI (swagger-jsdoc)** | Auto-generated API documentation |

### 🗄️ Database
| Technology | Choice | Reason |
|---|---|---|
| Primary DB | **PostgreSQL 15** | Robust, ACID-compliant, handles relational business data well |
| Dev/Local | **SQLite** (via Prisma) | Zero-config local dev & demo for client |
| Caching | **Redis** (optional) | Fast session cache, dashboard metrics cache |

### 🚀 Deployment Options (All Easy)
| Option | Stack | Best For |
|---|---|---|
| **Option A — Local (Offline)** | Docker Compose (Node + PostgreSQL) | Client with no internet — runs on a shop PC |
| **Option B — VPS Cloud** | Ubuntu VPS + Nginx + PM2 + PostgreSQL | ₹500-1000/month VPS, full control |
| **Option C — PaaS** | Railway / Render + Supabase | Free/cheap tier, zero-config deploy, great for demos |

> **Recommendation for your client**: Start with **Option A (Docker Compose)** for the shop PC so it works even without internet. Later migrate to cloud if needed.

---

## 📦 System Modules & Features

### Module 1: 🔐 Authentication & User Management
- Login / Logout with JWT
- Roles: **Admin**, **Cashier**, **Manager**
- Activity logs (who did what)
- Password change

### Module 2: 📊 Dashboard
- Today's Sales Summary
- Revenue vs Profit chart (last 7/30 days)
- Low Stock Alerts
- Top Selling Products
- Recent Transactions

### Module 3: 🏷️ Product & Inventory Management
- **Product Catalog**: Brand, Model, Variants (RAM, Storage, Color)
- **Barcode / IMEI tracking**
- Stock levels with low-stock threshold alerts
- Product images upload
- Category management (Phones, Accessories, Tablets, etc.)
- Stock adjustment (damaged/lost items)

### Module 4: 🏪 Point of Sale (POS)
- Fast product search (by name / barcode / IMEI)
- Add to cart, quantity, discount per item
- Multiple payment methods: Cash, Card, UPI
- Tax (GST) calculation
- Print receipt / thermal printer support
- Hold & resume transactions
- Customer selection (walk-in or registered)

### Module 5: 👥 Customer Management
- Customer profiles (name, phone, email)
- Purchase history per customer
- Credit / due balance tracking
- Loyalty points (optional)

### Module 6: 📥 Purchase Management
- Supplier management
- Create Purchase Orders (PO)
- Goods Received Notes (GRN)
- Purchase invoice recording
- Supplier payment tracking

### Module 7: 💰 Sales Management
- Sales invoice list
- Sales returns / refunds
- Discount management
- Sales by date range, product, category, cashier
- Export reports to Excel / PDF

### Module 8: 📈 Reports
- Daily / Weekly / Monthly sales reports
- Profit & Loss report
- Inventory valuation report
- Purchase report
- Tax (GST) report
- Top products & categories

---

## 🗂️ Project Folder Structure

```
mobile-shop-pos/
├── client/                    # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # POS, Inventory, Sales, Purchase, Reports
│   │   ├── store/             # Zustand state stores
│   │   ├── api/               # Axios API calls
│   │   ├── utils/             # Helpers (formatters, validators)
│   │   └── App.jsx
│   ├── public/
│   └── vite.config.js
│
├── server/                    # Express.js Backend
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helpers
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema
│   │   └── migrations/        # Auto-generated migrations
│   └── index.js
│
├── docker-compose.yml         # One-command local deploy
├── nginx.conf                 # Production reverse proxy
└── README.md
```

---

## 🗃️ Database Schema (Key Entities)

```
Users → Roles
Products → Categories, Variants, Stock
Customers
Suppliers
PurchaseOrders → PurchaseItems
Sales (Invoices) → SaleItems → Products
Payments
StockMovements (audit trail)
```

---

## 🔄 Development Phases

### Phase 1 — Foundation (Week 1-2)
- [ ] Project scaffolding (Vite + Express + Prisma + PostgreSQL)
- [ ] Auth system (login, JWT, roles)
- [ ] DB schema design & migrations
- [ ] Basic layout & navigation

### Phase 2 — Core Modules (Week 3-5)
- [ ] Product & Inventory module
- [ ] Customer & Supplier management
- [ ] Purchase management

### Phase 3 — POS & Sales (Week 6-7)
- [ ] Full POS interface
- [ ] Sales invoice & returns
- [ ] Receipt printing

### Phase 4 — Reports & Polish (Week 8-9)
- [ ] Dashboard with charts
- [ ] All reports (PDF & Excel export)
- [ ] UI polish & mobile responsiveness

### Phase 5 — Deployment (Week 10)
- [ ] Docker Compose setup
- [ ] Testing & bug fixes
- [ ] Client training & handover

---

## Open Questions

> [!IMPORTANT]
> Please answer these before we begin coding:

1. **Language**: Should the UI be in **English** or do you need **multi-language support** (e.g., Urdu/Hindi)?
2. **GST/Tax**: Should the system support **GST (Indian)** or a generic tax system?
3. **Barcode**: Does your client have a **barcode scanner hardware** or should we use webcam-based scanning?
4. **Thermal Printer**: Does the client use a **thermal receipt printer** (e.g., 80mm)? Or A4 invoices only?
5. **IMEI Tracking**: Mobile shops usually track **IMEI numbers** per unit. Should we include this?
6. **Offline Mode**: Must the system work **without internet** (local network only)?
7. **Starting Phase**: Should we **start coding immediately** with Phase 1, or do you want to review and finalize the plan first?

---

## Verification Plan

### Automated
- Jest unit tests for backend services (calculations, validations)
- Prisma schema validation

### Manual Verification
- End-to-end POS sale flow test
- Purchase order → stock update flow test
- Report accuracy verification
- Print receipt test
