# 🤖 AI Development Prompts — Mobile Shop POS System

## Purpose

This file contains ready-to-use prompts for AI coding assistants (Antigravity, GitHub Copilot, Claude, etc.) to help accelerate development of each module. Copy and paste these prompts when you need to generate code for specific features.

---

## 📁 Project Context Block

> **Always include this at the top of every AI prompt session for context:**

```
I am building a Mobile Shop POS + Inventory + Sales & Purchase Management System.

Tech Stack:
- Frontend: React 18 + Vite + Ant Design v5 + Zustand + React Router v6 + Axios + Recharts
- Backend: Node.js 20 + Express.js 4 + Prisma 5 + PostgreSQL 15
- Auth: JWT (access + refresh tokens) + bcryptjs
- Validation: Zod (backend) + Ant Design Form (frontend)
- PDF: PDFKit (backend) + react-to-print (frontend)

Architecture:
- REST API with standard JSON response: { success, message, data, pagination }
- RBAC with roles: ADMIN, MANAGER, CASHIER
- All monetary values: Decimal(12,2) in DB, number in JS
- All timestamps: UTC in DB, local display in UI
- Invoice format: INV-2024-0001, Purchase Order: PO-2024-0001
```

---

## 🔐 Phase 1: Authentication Prompts

### 1.1 — Backend: Login API
```
Using the project context above, create a complete Express.js login controller.

Requirements:
- Route: POST /api/v1/auth/login
- Accepts: { username, password }
- Validates with Zod: username (string, min 3), password (string, min 6)
- Finds user by username in Prisma (User model)
- Verifies password with bcryptjs
- If invalid: return 401 with message "Invalid credentials"
- If user is INACTIVE: return 403 with message "Account is disabled"
- Generates JWT access token (expires 15m) with payload: { userId, role }
- Generates JWT refresh token (expires 7d), saves to RefreshToken table
- Logs to ActivityLog: action="LOGIN", userId, ipAddress from req.ip
- Returns: { success: true, data: { user: { id, username, fullName, role }, accessToken } }
- Sets refresh token as HttpOnly cookie

Include: controller function, Zod validator, route definition.
Use Winston logger for errors.
```

### 1.2 — Backend: Auth Middleware
```
Using the project context above, create two Express.js middlewares:

1. authMiddleware:
   - Extracts JWT from Authorization header (Bearer token)
   - Verifies with JWT_SECRET from env
   - If invalid/expired: return 401 { success: false, message: "Unauthorized" }
   - Attaches decoded user to req.user = { userId, role }

2. roleMiddleware(...roles):
   - Factory function accepting allowed roles: e.g., requireRole('ADMIN', 'MANAGER')
   - Checks req.user.role is in the allowed roles array
   - If not: return 403 { success: false, message: "Forbidden: Insufficient permissions" }
   - Usage: router.get('/users', authMiddleware, requireRole('ADMIN'), controller)
```

### 1.3 — Frontend: Login Page
```
Using the project context above, create a beautiful React Login Page component.

Requirements:
- File: client/src/pages/auth/LoginPage.jsx
- Uses Ant Design Form, Input, Button components
- Left side: gradient branding panel with shop name and tagline
- Right side: login form card
- Fields: Username, Password (with show/hide toggle)
- Submit: calls POST /api/v1/auth/login via Axios
- On success: store accessToken in Zustand authStore, redirect to /dashboard
- On error: show Ant Design message.error with error message
- Loading state on button during API call
- No page refresh on submit (prevent default)
- Responsive: stacked on mobile

Style: Dark theme with gradient (#1a1a2e to #16213e), glassmorphism card, electric blue accent (#4361ee)
```

### 1.4 — Zustand Auth Store
```
Create a Zustand store for authentication state.

File: client/src/store/authStore.js

State:
- user: null | { id, username, fullName, role }
- accessToken: null | string
- isAuthenticated: boolean (derived from user !== null)

Actions:
- setAuth(user, accessToken): sets user and token
- logout(): clears all state, calls DELETE /api/v1/auth/logout, removes cookie
- updateUser(updates): partial update of user object

Also create useAuth hook that returns { user, accessToken, isAuthenticated, setAuth, logout }
```

---

## 📦 Phase 2: Product & Inventory Prompts

### 2.1 — Prisma Product Service
```
Using the project context above, create a Prisma-based ProductService class.

Methods:
1. getProducts({ page, limit, search, categoryId, brandId, isActive })
   - Full-text search on name, sku, barcode
   - Returns paginated list with category and brand info

2. getProductById(id)
   - Include: category, brand, variants, currentStock, stockMovements (last 5)

3. createProduct(data)
   - data: { name, sku, barcode, categoryId, brandId, purchasePrice, sellingPrice, taxRate, trackImei, minStockLevel }
   - Validates SKU uniqueness
   - Sets currentStock = 0

4. updateProduct(id, data)
   - Partial update
   - If price changes, log to ActivityLog

5. deleteProduct(id)
   - Soft delete: set isActive = false
   - Reject if product has active stock

6. adjustStock(productId, quantity, type, reason, userId)
   - Updates currentStock on product
   - Creates StockMovement record
   - type: 'ADJUSTMENT_IN' or 'ADJUSTMENT_OUT'

Include error handling. All methods return plain objects (not Prisma models).
```

### 2.2 — Frontend: Products List Page
```
Using the project context above, create a React Products List Page.

File: client/src/pages/inventory/ProductsPage.jsx

Features:
- Ant Design Table with columns: Image, Name, SKU, Category, Brand, Stock, Price, Status, Actions
- Search bar (debounced, 300ms) filtering by name/SKU/barcode
- Filter dropdowns: Category, Brand, Status (Active/Inactive)
- Pagination (20 per page, controlled)
- "Add Product" button → navigate to /inventory/products/new
- Edit button → navigate to /inventory/products/:id/edit
- Delete button → confirmation modal → soft delete API call
- Stock badge: green if > minStockLevel, red if below (low stock)
- Product image thumbnail (50x50px, fallback to placeholder icon)
- Bulk actions: export to Excel

API: GET /api/v1/products?page=1&limit=20&search=&categoryId=&brandId=
State management with local useState (no global store needed for this page)
Loading skeleton while fetching.
```

### 2.3 — Frontend: Product Form
```
Using the project context above, create a React Product Add/Edit Form.

File: client/src/pages/inventory/ProductFormPage.jsx

Form sections:
1. Basic Info: Name*, SKU* (auto-generate button), Barcode, Description
2. Category & Brand: Category* dropdown, Brand dropdown
3. Pricing: Purchase Price*, Selling Price*, Tax Rate (%)
4. Inventory: Track IMEI toggle, Min Stock Level, Initial Stock (only on create)
5. Image: Upload single image (Ant Design Upload, preview, max 2MB)

Behavior:
- If editing: pre-fill form with existing product data
- Auto-generate SKU: "SKU-" + timestamp last 6 digits
- On submit: POST or PUT to /api/v1/products
- Show success notification and redirect to products list
- Show field-level validation errors from API response

Use Ant Design Form with rules validation.
```

---

## 🏪 Phase 5: POS Prompts

### 5.1 — POS Cart Store (Zustand)
```
Using the project context above, create a Zustand cart store for the POS system.

File: client/src/store/cartStore.js

State:
- items: Array<CartItem>
  CartItem: { productId, name, sku, price, quantity, discount, taxRate, imeiNumber, lineTotal }
- customer: null | Customer object
- discount: number (overall order discount %)
- paymentMethod: 'CASH' | 'CARD' | 'UPI'
- note: string

Computed (derived getters):
- subtotal: sum of all item lineTotals before tax/discount
- taxAmount: sum of item-level taxes
- discountAmount: overall discount applied
- totalAmount: final total
- itemCount: total quantity of items

Actions:
- addItem(product, quantity, imeiNumber)
  - If product already in cart: increase quantity
  - If trackImei: require imeiNumber
- removeItem(productId)
- updateQuantity(productId, quantity)
- updateItemDiscount(productId, discountPct)
- setCustomer(customer)
- setPaymentMethod(method)
- clearCart()
- setNote(note)

Include calculation helpers with proper decimal handling (avoid floating point errors using toFixed(2)).
```

### 5.2 — POS Page Layout
```
Using the project context above, create the main POS Page component.

File: client/src/pages/pos/POSPage.jsx

Layout: Two-column full-screen layout
- Left column (60%): Product search + product grid
- Right column (40%): Cart + payment

Left panel:
- Search input (autofocus on mount)
  - Accepts: product name, SKU, barcode (camera icon or press key)
  - Calls GET /api/v1/pos/search?q=... (debounced 200ms)
  - Shows results in a scrollable grid (4 columns)
- Product card: image, name, price, stock badge
- Click product → adds to cart (if IMEI tracked: open IMEI input modal)

Right panel:
- Customer selector (search dropdown or "Walk-in Customer")
- Cart items list:
  - Product name, quantity +/- buttons, unit price, line total
  - Swipe or X button to remove
- Order summary:
  - Subtotal, Tax, Discount, TOTAL (large)
- Payment method tabs: Cash | Card | UPI
- PAY button → opens PaymentModal

Keyboard shortcuts:
- F1 or / : focus search
- F10 or Enter on payment: open PaymentModal
- Escape: clear search

Style: Dark theme, large text for easy reading at counter
```

### 5.3 — Payment Modal
```
Create a PaymentModal component for the POS.

File: client/src/components/pos/PaymentModal.jsx

Props: { visible, onClose, onSuccess, orderTotal, paymentMethod }

Cash payment:
- Input: "Amount Tendered" (number input, default = orderTotal)
- Display: "Change Due" = tendered - orderTotal (large, green)
- Validates: tendered >= orderTotal

Card payment:
- Input: Card reference number (optional)
- Input: Last 4 digits of card (optional)

UPI payment:
- Display: QR code placeholder (shop UPI ID)
- Input: UPI transaction reference

Confirm button:
- Calls POST /api/v1/sales with full cart data
- Shows loading state
- On success: show receipt, clear cart, close modal
- On error: show error message (e.g., "Insufficient stock for iPhone 15")

Receipt preview after successful payment:
- Print button (react-to-print)
- Download PDF button
- New Sale button (close modal + clear cart)
```

---

## 📊 Phase 7: Reports Prompts

### 7.1 — Dashboard Stats API
```
Create a dashboard statistics API endpoint.

Route: GET /api/v1/reports/dashboard
Auth: ADMIN, MANAGER

Returns:
{
  today: {
    revenue: number,
    transactions: number,
    newCustomers: number,
    profit: number
  },
  thisMonth: {
    revenue: number,
    transactions: number,
    profit: number
  },
  revenueChart: [
    { date: "2024-01-01", revenue: 50000, profit: 15000 }
    // Last 30 days
  ],
  topProducts: [
    { productId, name, quantitySold, revenue }
    // Top 5 by revenue this month
  ],
  lowStockProducts: [
    { id, name, currentStock, minStockLevel }
    // Products below threshold
  ],
  recentSales: [
    // Last 5 completed sales with customer name and total
  ]
}

Use Prisma aggregations and raw queries where needed for performance.
Cache result for 5 minutes using a simple in-memory cache.
```

### 7.2 — Dashboard Page
```
Create the Dashboard page component.

File: client/src/pages/dashboard/DashboardPage.jsx

Sections:
1. KPI Cards (top row):
   - Today's Revenue (with currency symbol)
   - Today's Transactions
   - Today's Profit
   - New Customers This Month
   Each card: icon, value, label, % change vs yesterday (up/down arrow)

2. Revenue vs Profit Chart (Recharts LineChart):
   - X-axis: dates (last 30 days)
   - Two lines: Revenue (blue) and Profit (green)
   - Tooltip showing values
   - Legend

3. Top Products (BarChart - horizontal):
   - Top 5 products by revenue this month

4. Recent Transactions Table (last 5 sales):
   - Invoice #, Customer, Items, Total, Payment method, Time
   - Click row → navigate to sale detail

5. Low Stock Alert widget:
   - List of products below threshold
   - Link to inventory page

Auto-refresh every 5 minutes.
Show skeleton loaders while fetching.
Use Recharts for all charts.
Responsive grid layout using Ant Design Row/Col.
```

---

## 🔧 General Utility Prompts

### Utility: API Response Helper
```
Create a standardized API response utility for Express.js.

File: server/src/utils/apiResponse.js

Functions:
- success(res, data, message, statusCode = 200)
- paginated(res, data, pagination, message)
  pagination: { page, limit, total, totalPages }
- created(res, data, message)  // 201 status
- noContent(res)               // 204 status
- badRequest(res, message, errors = [])   // 400
- unauthorized(res, message)              // 401
- forbidden(res, message)                 // 403
- notFound(res, message)                  // 404
- conflict(res, message)                  // 409
- serverError(res, message)              // 500

All success responses: { success: true, message, data, pagination? }
All error responses: { success: false, message, errors? }
```

### Utility: Invoice Number Generator
```
Create an auto-incrementing invoice number generator.

File: server/src/utils/invoiceNumber.js

Functions:
- generateInvoiceNumber(): returns "INV-2024-0001"
  - Gets current year
  - Finds highest invoice number in Sale table for this year
  - Increments by 1, zero-pads to 4 digits

- generatePONumber(): returns "PO-2024-0001"
  - Same logic for Purchase table

Both functions should be atomic (handle concurrent requests)
Use Prisma transaction if needed.
```

### Utility: Pagination Helper
```
Create a reusable pagination utility.

File: server/src/utils/pagination.js

Function: getPaginationParams(query)
- Extracts page (default 1), limit (default 20, max 100) from query params
- Returns: { skip, take, page, limit }

Function: buildPaginationMeta(total, page, limit)
- Returns: { total, page, limit, totalPages, hasNext, hasPrev }

Function: paginatedQuery(prismaModel, where, include, orderBy, page, limit)
- Generic paginated query helper
- Returns: { data: [], pagination: {} }
```

---

## 📄 Receipt Print Prompt

### Receipt Component
```
Create a printable receipt component.

File: client/src/components/pos/ReceiptPrint.jsx

Props: { sale: SaleObject, shop: ShopSettings }

Receipt layout (80mm thermal printer optimized):
- Header: Shop name (bold), address, phone
- Divider line (dashes)
- Invoice #, Date, Time, Cashier name
- Customer name (if selected)
- Divider line
- Items table:
  - Item name (truncated to 20 chars)
  - Qty x Price = Line Total
- Divider line
- Subtotal, Tax (GST 17%), Discount
- TOTAL (bold, large)
- Payment method, Amount paid, Change
- Divider line
- Footer: "Thank you for shopping!"
- "Exchange within 7 days with receipt"
- Barcode of invoice number

Use react-to-print with ref.
CSS: @media print rules for 80mm width.
Font: monospace for alignment.
```

---

## 🐛 Debugging Prompts

### Debug: Stock Calculation Issue
```
I have a bug in my Mobile Shop POS system. The stock count is not updating correctly.

Context:
- Tech stack: Node.js + Prisma + PostgreSQL
- When a sale is made (POST /api/v1/sales), the product.currentStock should decrement
- When a purchase is received (POST /api/v1/purchases/:id/receive), stock should increment
- We also have a StockMovement audit table

The bug: Sometimes stock goes negative, or two concurrent sales of the same item both succeed.

Please:
1. Identify the race condition issue
2. Show how to fix it using Prisma transactions ($transaction)
3. Add optimistic locking or check-and-decrement atomic operation
4. Show the correct service method for processing a sale that prevents overselling
```

### Debug: JWT Refresh Token Flow
```
I have an issue with JWT token refresh in my POS system.

Context:
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Frontend uses Axios with interceptors

Problem: When access token expires mid-session, the user gets logged out instead of silently refreshing.

Please show me:
1. The Axios response interceptor that catches 401 errors
2. How to queue multiple failed requests while refreshing
3. How to retry failed requests after getting new token
4. How to handle refresh token expiry (redirect to login)
```
