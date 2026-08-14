# 📅 Development Phases — Mobile Shop POS & Management System

## Project Timeline Overview

| Phase | Name | Duration | Status |
|---|---|---|---|
| Phase 0 | Project Setup & Infrastructure | Week 1 | 🔲 Pending |
| Phase 1 | Authentication & Core Foundation | Week 1–2 | 🔲 Pending |
| Phase 2 | Product & Inventory Management | Week 3–4 | 🔲 Pending |
| Phase 3 | Customer & Supplier Management | Week 4–5 | 🔲 Pending |
| Phase 4 | Purchase Management | Week 5–6 | 🔲 Pending |
| Phase 5 | Point of Sale (POS) | Week 6–7 | 🔲 Pending |
| Phase 6 | Sales Management & Returns | Week 7–8 | 🔲 Pending |
| Phase 7 | Dashboard & Reports | Week 8–9 | 🔲 Pending |
| Phase 8 | Testing, Polish & Deployment | Week 9–10 | 🔲 Pending |

**Total Estimated Duration**: ~10 Weeks
**Team Size Assumption**: 1–2 Developers

---

## ✅ Phase 0 — Project Setup & Infrastructure (Week 1, Days 1–3)

### Goals
Set up the complete project scaffold so development can start immediately without blockers.

### Tasks

#### Backend Setup
- [ ] Initialize Node.js project (`npm init`)
- [ ] Install core dependencies: `express`, `prisma`, `@prisma/client`, `jsonwebtoken`, `bcryptjs`, `zod`, `cors`, `helmet`, `morgan`, `winston`, `dotenv`, `multer`
- [ ] Configure `nodemon` for dev, `ts-node` optional
- [ ] Set up `.env` file with all required variables
- [ ] Configure Prisma with PostgreSQL connection
- [ ] Create initial Prisma schema (all tables)
- [ ] Run first migration: `npx prisma migrate dev`
- [ ] Seed database with sample data (admin user, categories, sample products)
- [ ] Set up Winston logger
- [ ] Set up basic Express app with all middleware
- [ ] Set up error handler middleware
- [ ] Set up API response utility helpers
- [ ] Configure CORS for frontend origin

#### Frontend Setup
- [ ] Scaffold Vite + React project: `npm create vite@latest client -- --template react`
- [ ] Install dependencies: `antd`, `axios`, `react-router-dom`, `zustand`, `recharts`, `react-to-print`, `dayjs`
- [ ] Configure Vite proxy to backend API
- [ ] Set up React Router with all route placeholders
- [ ] Set up Axios instance with base URL + interceptors (token attach, 401 redirect)
- [ ] Configure Ant Design theme (custom brand colors)
- [ ] Set up Zustand auth store
- [ ] Create AppLayout (sidebar + topbar shell)
- [ ] Set up protected route HOC

#### DevOps Setup
- [ ] Create `docker-compose.yml` with `app`, `db` (PostgreSQL), and `nginx` services
- [ ] Create `Dockerfile` for backend
- [ ] Create `Dockerfile` for frontend (Nginx static serve)
- [ ] Create `.gitignore`, `README.md`
- [ ] Initialize Git repo

### Deliverables
- Running dev environment: `npm run dev` starts frontend + backend
- `docker-compose up` brings up full stack
- All DB tables created

---

## ✅ Phase 1 — Authentication & User Management (Week 1–2, Days 4–10)

### Goals
Secure login system with role-based access control.

### Tasks

#### Backend
- [ ] `POST /api/v1/auth/login` — validate credentials, return JWT access + refresh token
- [ ] `POST /api/v1/auth/logout` — invalidate refresh token
- [ ] `POST /api/v1/auth/refresh` — issue new access token from refresh token
- [ ] `GET /api/v1/auth/me` — return current user profile
- [ ] Auth middleware: verify JWT, attach user to `req.user`
- [ ] Role middleware: `requireRole('ADMIN')`, `requireRole('MANAGER', 'ADMIN')`
- [ ] `GET/POST/PUT/DELETE /api/v1/users` — CRUD for user management (Admin only)
- [ ] Password hashing with bcrypt (12 rounds)
- [ ] Activity log on login/logout

#### Frontend
- [ ] Login Page UI (branded, centered card with logo)
- [ ] Login form with validation (username + password)
- [ ] JWT token storage in memory (access) + HttpOnly cookie / localStorage (refresh)
- [ ] Auto-redirect to dashboard on login
- [ ] Logout functionality
- [ ] User Management page (Admin only — list, add, edit, deactivate users)
- [ ] Role badges in UI
- [ ] Session expiry handling (auto-redirect to login)

### Deliverables
- Fully working login/logout
- 3 roles working: Admin, Manager, Cashier
- User CRUD from admin panel

---

## ✅ Phase 2 — Product & Inventory Management (Week 3–4)

### Goals
Complete product catalog with stock tracking.

### Tasks

#### Backend
- [ ] Category CRUD: `GET/POST/PUT/DELETE /api/v1/categories`
- [ ] Brand CRUD: `GET/POST/PUT/DELETE /api/v1/brands`
- [ ] Product CRUD: `GET/POST/PUT/DELETE /api/v1/products`
  - Includes: name, SKU, barcode, brand, category, purchase price, selling price, tax rate, description
- [ ] Product image upload (Multer) — `POST /api/v1/products/:id/image`
- [ ] Product variants (RAM/Storage/Color): `GET/POST/PUT/DELETE /api/v1/products/:id/variants`
- [ ] IMEI/Serial number tracking per unit: `GET/POST /api/v1/products/:id/units`
- [ ] Stock level endpoint: `GET /api/v1/products/:id/stock`
- [ ] Low stock alert list: `GET /api/v1/inventory/low-stock`
- [ ] Stock adjustment: `POST /api/v1/inventory/adjust`
  - Reason: damaged, lost, correction
  - Creates stock movement record
- [ ] Stock movement history: `GET /api/v1/inventory/movements`

#### Frontend
- [ ] Products list page (searchable, filterable table)
- [ ] Add/Edit product form (with image upload)
- [ ] Product detail view (stock level, variants, IMEI list)
- [ ] Category & Brand management pages
- [ ] Stock adjustment modal
- [ ] Low stock alert page/badge
- [ ] Barcode display on product card (react-barcode)
- [ ] Import products from Excel/CSV (optional)

### Deliverables
- Full product catalog working
- Stock tracking with movement history
- Low stock alerts visible in sidebar

---

## ✅ Phase 3 — Customer & Supplier Management (Week 4–5)

### Goals
Manage customers and suppliers with contact details and history.

### Tasks

#### Backend
- [ ] Customer CRUD: `GET/POST/PUT/DELETE /api/v1/customers`
  - Fields: name, phone, email, address, credit limit, outstanding balance
- [ ] Customer purchase history: `GET /api/v1/customers/:id/purchases`
- [ ] Customer outstanding balance calculation
- [ ] Supplier CRUD: `GET/POST/PUT/DELETE /api/v1/suppliers`
  - Fields: name, company, phone, email, address, payment terms
- [ ] Supplier purchase history: `GET /api/v1/suppliers/:id/purchases`

#### Frontend
- [ ] Customer list page (searchable)
- [ ] Add/Edit customer form
- [ ] Customer detail page (history, balance)
- [ ] Supplier list page (searchable)
- [ ] Add/Edit supplier form
- [ ] Supplier detail page (purchase history)

### Deliverables
- Customer & supplier directories complete
- Purchase history linked to each entity

---

## ✅ Phase 4 — Purchase Management (Week 5–6)

### Goals
Record purchases from suppliers, update inventory automatically.

### Tasks

#### Backend
- [ ] Purchase Order CRUD: `GET/POST/PUT /api/v1/purchases`
  - Status: DRAFT → ORDERED → RECEIVED → CANCELLED
- [ ] Purchase items: list of products with quantity, cost price
- [ ] Goods Received Note (GRN): `POST /api/v1/purchases/:id/receive`
  - On receive: automatically increment stock levels
  - Create stock movement records
- [ ] Purchase payment tracking: `POST /api/v1/purchases/:id/payment`
- [ ] Auto-generate purchase order number (PO-2024-0001)
- [ ] Purchase list with filters: supplier, date range, status

#### Frontend
- [ ] Purchase order list page
- [ ] Create/Edit purchase order form
  - Select supplier
  - Add items (product search, quantity, price)
- [ ] Receive goods modal (mark items received, enter IMEI numbers)
- [ ] Purchase detail view
- [ ] Payment recording modal
- [ ] Purchase PDF export

### Deliverables
- Full purchase order workflow
- Inventory auto-updated on goods receipt
- IMEI numbers assigned on receipt

---

## ✅ Phase 5 — Point of Sale (POS) (Week 6–7)

### Goals
Fast, intuitive POS interface for cashier use.

### Tasks

#### Backend
- [ ] Product search for POS (by name/barcode/IMEI): `GET /api/v1/pos/search`
- [ ] Create sale: `POST /api/v1/sales`
  - Validates stock availability
  - Decrements stock on sale
  - Assigns IMEI to sale
  - Calculates tax, discount, total
- [ ] Hold transaction: save cart state server-side
- [ ] Payment processing:
  - Cash (calculate change)
  - Card
  - UPI/QR
  - Split payment
- [ ] Receipt generation: `GET /api/v1/sales/:id/receipt`

#### Frontend
- [ ] Full-screen POS layout (2-panel: products + cart)
- [ ] Product search bar (instant search, barcode scanner input)
- [ ] Product grid/list view in POS
- [ ] Cart panel:
  - Item list with quantity +/- controls
  - Per-item discount
  - Remove item
- [ ] Order summary (subtotal, tax, discount, total)
- [ ] Payment modal:
  - Cash: enter amount, show change
  - Card: enter reference number
  - UPI: show QR code
  - Split payment option
- [ ] Receipt print (react-to-print — 80mm thermal or A4)
- [ ] Hold/resume transaction
- [ ] Customer selection in POS
- [ ] Keyboard shortcuts (F1=search, F2=pay, Esc=cancel)

### Deliverables
- Fully functional POS
- Thermal receipt printing
- Stock auto-decremented on sale
- IMEI tracking per sale

---

## ✅ Phase 6 — Sales Management & Returns (Week 7–8)

### Goals
View, manage, and return sales. Full sales audit trail.

### Tasks

#### Backend
- [ ] Sales list: `GET /api/v1/sales` (filter by date, customer, cashier, status)
- [ ] Sale detail: `GET /api/v1/sales/:id`
- [ ] Sales return: `POST /api/v1/sales/:id/return`
  - Partial or full return
  - Restores stock on return
  - Creates credit note
- [ ] Invoice PDF: `GET /api/v1/sales/:id/invoice`
- [ ] Sales summary stats: `GET /api/v1/sales/stats`

#### Frontend
- [ ] Sales list page (searchable, filterable, date range picker)
- [ ] Sale detail page (items, payment, customer info)
- [ ] Return/Refund modal (select items to return, reason)
- [ ] Invoice PDF download button
- [ ] Sales statistics cards at top of page

### Deliverables
- Complete sales history
- Return/refund workflow
- PDF invoice generation

---

## ✅ Phase 7 — Dashboard & Reports (Week 8–9)

### Goals
Business intelligence through rich charts and exportable reports.

### Tasks

#### Backend
- [ ] Dashboard stats: `GET /api/v1/reports/dashboard`
  - Today's revenue, transactions, new customers
  - Revenue trend (last 7/30 days)
  - Low stock count
  - Top 5 products
- [ ] Sales report: `GET /api/v1/reports/sales`
- [ ] Purchase report: `GET /api/v1/reports/purchases`
- [ ] Inventory report: `GET /api/v1/reports/inventory`
- [ ] Profit & Loss report: `GET /api/v1/reports/profit-loss`
- [ ] Tax (GST) report: `GET /api/v1/reports/tax`
- [ ] Excel export using `exceljs` for all reports
- [ ] PDF export using `PDFKit` for all reports

#### Frontend
- [ ] Dashboard page:
  - KPI cards (today's revenue, profit, transactions, customers)
  - Revenue vs Profit line chart (Recharts)
  - Top products bar chart
  - Recent transactions table
  - Low stock alert widget
- [ ] Reports page:
  - Date range filter
  - Sales report table + chart
  - Purchase report
  - Inventory valuation table
  - Profit & Loss statement
  - GST report
  - Export to Excel / PDF buttons

### Deliverables
- Live dashboard with real data
- All 5 reports exportable

---

## ✅ Phase 8 — Testing, Polish & Deployment (Week 9–10)

### Goals
Production-ready, tested, and deployed system.

### Tasks

#### Testing
- [ ] Backend unit tests (Jest) for:
  - Price calculation logic
  - Stock decrement on sale
  - Auth middleware
  - Validation schemas
- [ ] API integration tests (Supertest)
- [ ] Frontend manual testing checklist:
  - [ ] Full POS sale flow
  - [ ] Purchase → stock update
  - [ ] Return flow
  - [ ] Report accuracy vs manual count
  - [ ] Role restrictions

#### UI Polish
- [ ] Mobile responsiveness audit (tablet use)
- [ ] Loading states on all API calls
- [ ] Empty states on all list pages
- [ ] Confirmation dialogs on all destructive actions
- [ ] Keyboard shortcuts documentation
- [ ] Favicon, page titles, branding
- [ ] Toast notifications for all operations

#### Deployment
- [ ] Finalize `docker-compose.yml`
- [ ] Set up Nginx config (serve React + proxy API)
- [ ] Create `.env.production` template
- [ ] Create database backup script
- [ ] Write deployment README
- [ ] Deploy to client's machine / VPS
- [ ] Set up daily backup (cron job)
- [ ] Client training session

### Deliverables
- Production deployment
- Client trained on system
- Backup strategy in place
- Handover documentation

---

## 📊 Phase Summary Table

| Phase | Key Feature | Est. Days | Complexity |
|---|---|---|---|
| 0 | Project Setup | 3 days | Low |
| 1 | Auth & Users | 7 days | Medium |
| 2 | Products & Inventory | 10 days | High |
| 3 | Customers & Suppliers | 5 days | Low |
| 4 | Purchase Management | 7 days | Medium |
| 5 | POS System | 10 days | Very High |
| 6 | Sales & Returns | 7 days | Medium |
| 7 | Dashboard & Reports | 8 days | High |
| 8 | Testing & Deployment | 7 days | Medium |
| **Total** | | **~64 days** | |

---

## 🚦 Progress Tracking

Update status emojis as you complete each phase:
- 🔲 Not Started
- 🔄 In Progress  
- ✅ Completed
- ❌ Blocked
