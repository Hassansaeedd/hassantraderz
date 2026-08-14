# 🗄️ Database Schema — Mobile Shop POS & Management System

## Overview

- **Database**: PostgreSQL 15
- **ORM**: Prisma 5
- **Strategy**: Code-first migrations (define schema in Prisma, auto-generate SQL)
- **Timezone**: All timestamps stored in UTC

---

## 1. Entity Relationship Diagram (ERD)

```
USERS ──────────────────────────────────────────────────────────────┐
  │ (createdBy)                                                      │
  │                                                                  │
CATEGORIES ──┐                                                       │
             │                                                       │
BRANDS ──────┼── PRODUCTS ──── PRODUCT_VARIANTS                    │
             │       │                                              │
             │       ├── PRODUCT_UNITS (IMEI/Serial)               │
             │       │                                              │
             │       ├── PURCHASE_ITEMS ──── PURCHASES ──── SUPPLIERS
             │       │                              │
             │       └── SALE_ITEMS ──────── SALES ─┼───── CUSTOMERS
             │                                      │
STOCK_MOVEMENTS ◄──────────────────────────────────┘
                                    │
PAYMENTS ◄─────────────────────────┘
```

---

## 2. Prisma Schema (Full)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum UserRole {
  ADMIN
  MANAGER
  CASHIER
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum PurchaseStatus {
  DRAFT
  ORDERED
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}

enum SaleStatus {
  COMPLETED
  RETURNED
  PARTIALLY_RETURNED
  CANCELLED
}

enum PaymentMethod {
  CASH
  CARD
  UPI
  BANK_TRANSFER
  CREDIT
}

enum StockMovementType {
  PURCHASE_IN       // Stock added via purchase
  SALE_OUT          // Stock removed via sale
  RETURN_IN         // Stock returned by customer
  ADJUSTMENT_IN     // Manual stock increase
  ADJUSTMENT_OUT    // Manual stock decrease (damage/loss)
  TRANSFER_IN
  TRANSFER_OUT
}

enum ProductUnitStatus {
  IN_STOCK
  SOLD
  RETURNED
  DAMAGED
}

// ─────────────────────────────────────────────
// USERS & AUTH
// ─────────────────────────────────────────────

model User {
  id           String     @id @default(cuid())
  username     String     @unique
  email        String?    @unique
  passwordHash String
  fullName     String
  phone        String?
  role         UserRole   @default(CASHIER)
  status       UserStatus @default(ACTIVE)
  avatar       String?    // file path or URL

  // Relations
  sales        Sale[]
  purchases    Purchase[]
  adjustments  StockMovement[]
  refreshTokens RefreshToken[]
  activityLogs ActivityLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@map("refresh_tokens")
}

model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String   // e.g., "LOGIN", "SALE_CREATED", "PRODUCT_UPDATED"
  entity      String?  // e.g., "Sale", "Product"
  entityId    String?
  description String?
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@map("activity_logs")
}

// ─────────────────────────────────────────────
// PRODUCT CATALOG
// ─────────────────────────────────────────────

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  image       String?
  isActive    Boolean   @default(true)
  products    Product[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("categories")
}

model Brand {
  id       String    @id @default(cuid())
  name     String    @unique
  logo     String?
  isActive Boolean   @default(true)
  products Product[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("brands")
}

model Product {
  id             String  @id @default(cuid())
  name           String
  sku            String  @unique        // Stock Keeping Unit
  barcode        String? @unique
  description    String?
  image          String?                // file path
  categoryId     String
  category       Category @relation(fields: [categoryId], references: [id])
  brandId        String?
  brand          Brand?   @relation(fields: [brandId], references: [id])

  purchasePrice  Decimal  @db.Decimal(12, 2)  // Cost price
  sellingPrice   Decimal  @db.Decimal(12, 2)  // Default selling price
  taxRate        Decimal  @db.Decimal(5, 2) @default(0)  // GST % (e.g., 18.00)

  trackImei      Boolean  @default(false)  // Track individual IMEI/serial numbers
  minStockLevel  Int      @default(5)      // Low stock alert threshold
  currentStock   Int      @default(0)      // Denormalized for fast reads

  isActive       Boolean  @default(true)

  // Relations
  variants       ProductVariant[]
  units          ProductUnit[]
  saleItems      SaleItem[]
  purchaseItems  PurchaseItem[]
  stockMovements StockMovement[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("products")
}

model ProductVariant {
  id         String  @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  ram        String? // e.g., "4GB", "6GB", "8GB"
  storage    String? // e.g., "64GB", "128GB", "256GB"
  color      String? // e.g., "Midnight Black", "Space Gray"
  priceDelta Decimal @db.Decimal(10, 2) @default(0)  // Price difference from base

  @@map("product_variants")
}

model ProductUnit {
  id          String            @id @default(cuid())
  productId   String
  product     Product           @relation(fields: [productId], references: [id])
  imeiNumber  String?           @unique  // For phones
  serialNumber String?          @unique  // For accessories
  status      ProductUnitStatus @default(IN_STOCK)
  purchaseId  String?           // Which purchase brought this unit in
  saleItemId  String?           // Which sale sold this unit

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("product_units")
}

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────

model Customer {
  id               String   @id @default(cuid())
  name             String
  phone            String?  @unique
  email            String?
  address          String?
  creditLimit      Decimal  @db.Decimal(12, 2) @default(0)
  outstandingBalance Decimal @db.Decimal(12, 2) @default(0)
  loyaltyPoints    Int      @default(0)
  isActive         Boolean  @default(true)

  sales            Sale[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("customers")
}

// ─────────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────────

model Supplier {
  id           String     @id @default(cuid())
  name         String
  company      String?
  phone        String?
  email        String?
  address      String?
  taxNumber    String?    // GST Number
  paymentTerms Int        @default(30)  // Days
  outstandingBalance Decimal @db.Decimal(12, 2) @default(0)
  isActive     Boolean    @default(true)

  purchases    Purchase[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("suppliers")
}

// ─────────────────────────────────────────────
// PURCHASES
// ─────────────────────────────────────────────

model Purchase {
  id             String         @id @default(cuid())
  purchaseNumber String         @unique  // PO-2024-0001
  supplierId     String
  supplier       Supplier       @relation(fields: [supplierId], references: [id])
  userId         String         // Created by
  user           User           @relation(fields: [userId], references: [id])

  status         PurchaseStatus @default(DRAFT)
  purchaseDate   DateTime       @default(now())
  expectedDate   DateTime?
  receivedDate   DateTime?

  subtotal       Decimal  @db.Decimal(12, 2) @default(0)
  taxAmount      Decimal  @db.Decimal(12, 2) @default(0)
  discountAmount Decimal  @db.Decimal(12, 2) @default(0)
  totalAmount    Decimal  @db.Decimal(12, 2) @default(0)
  paidAmount     Decimal  @db.Decimal(12, 2) @default(0)
  dueAmount      Decimal  @db.Decimal(12, 2) @default(0)

  notes          String?
  invoiceNumber  String?  // Supplier's invoice number

  items          PurchaseItem[]
  payments       Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("purchases")
}

model PurchaseItem {
  id            String   @id @default(cuid())
  purchaseId    String
  purchase      Purchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  productId     String
  product       Product  @relation(fields: [productId], references: [id])

  quantity      Int
  receivedQty   Int      @default(0)
  unitCost      Decimal  @db.Decimal(12, 2)
  taxRate       Decimal  @db.Decimal(5, 2) @default(0)
  taxAmount     Decimal  @db.Decimal(12, 2) @default(0)
  totalAmount   Decimal  @db.Decimal(12, 2)

  @@map("purchase_items")
}

// ─────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────

model Sale {
  id             String      @id @default(cuid())
  invoiceNumber  String      @unique  // INV-2024-0001
  customerId     String?
  customer       Customer?   @relation(fields: [customerId], references: [id])
  userId         String      // Cashier
  user           User        @relation(fields: [userId], references: [id])

  status         SaleStatus  @default(COMPLETED)
  saleDate       DateTime    @default(now())

  subtotal       Decimal  @db.Decimal(12, 2)
  taxAmount      Decimal  @db.Decimal(12, 2) @default(0)
  discountAmount Decimal  @db.Decimal(12, 2) @default(0)
  totalAmount    Decimal  @db.Decimal(12, 2)
  paidAmount     Decimal  @db.Decimal(12, 2)
  changeAmount   Decimal  @db.Decimal(12, 2) @default(0)  // Cash change given
  dueAmount      Decimal  @db.Decimal(12, 2) @default(0)  // Remaining due

  paymentMethod  PaymentMethod @default(CASH)
  paymentRef     String?       // UPI ref, card last 4 digits

  notes          String?

  items          SaleItem[]
  payments       Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("sales")
}

model SaleItem {
  id          String  @id @default(cuid())
  saleId      String
  sale        Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId   String
  product     Product @relation(fields: [productId], references: [id])

  quantity      Int
  returnedQty   Int     @default(0)
  unitPrice     Decimal @db.Decimal(12, 2)
  discountPct   Decimal @db.Decimal(5, 2) @default(0)   // % discount
  discountAmt   Decimal @db.Decimal(12, 2) @default(0)
  taxRate       Decimal @db.Decimal(5, 2) @default(0)
  taxAmount     Decimal @db.Decimal(12, 2) @default(0)
  totalAmount   Decimal @db.Decimal(12, 2)

  imeiNumbers   String[]  // IMEI(s) sold in this line item

  @@map("sale_items")
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

model Payment {
  id            String        @id @default(cuid())
  saleId        String?
  sale          Sale?         @relation(fields: [saleId], references: [id])
  purchaseId    String?
  purchase      Purchase?     @relation(fields: [purchaseId], references: [id])

  amount        Decimal       @db.Decimal(12, 2)
  method        PaymentMethod
  reference     String?       // Transaction reference number
  paidAt        DateTime      @default(now())
  notes         String?

  createdAt DateTime @default(now())

  @@map("payments")
}

// ─────────────────────────────────────────────
// STOCK MOVEMENTS (Audit Trail)
// ─────────────────────────────────────────────

model StockMovement {
  id          String            @id @default(cuid())
  productId   String
  product     Product           @relation(fields: [productId], references: [id])
  userId      String
  user        User              @relation(fields: [userId], references: [id])

  type        StockMovementType
  quantity    Int               // positive = in, negative = out
  balanceBefore Int
  balanceAfter  Int

  referenceId   String?         // saleId or purchaseId
  referenceType String?         // "Sale" or "Purchase" or "Adjustment"
  reason        String?         // For adjustments

  createdAt DateTime @default(now())

  @@map("stock_movements")
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────

model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value String
  group String @default("general")  // "general", "tax", "receipt", "notifications"

  updatedAt DateTime @updatedAt

  @@map("settings")
}
```

---

## 3. Key Indexes

```prisma
// Add these to relevant models for performance

// Products
@@index([categoryId])
@@index([brandId])
@@index([sku])
@@index([barcode])
@@index([isActive])

// Sales
@@index([userId])
@@index([customerId])
@@index([saleDate])
@@index([status])
@@index([invoiceNumber])

// Purchases
@@index([supplierId])
@@index([userId])
@@index([status])
@@index([purchaseDate])

// Stock Movements
@@index([productId])
@@index([createdAt])
@@index([type])

// Activity Logs
@@index([userId])
@@index([action])
@@index([createdAt])
```

---

## 4. Database Seed Data

Initial data to insert on first setup:

```javascript
// prisma/seed.js

// Default Admin User
{
  username: "admin",
  email: "admin@mobileshop.com",
  passwordHash: bcrypt.hash("Admin@123", 12),
  fullName: "System Administrator",
  role: "ADMIN"
}

// Default Settings
[
  { key: "shop_name", value: "Mobile World", group: "general" },
  { key: "shop_address", value: "123 Main Street", group: "general" },
  { key: "shop_phone", value: "+92-300-0000000", group: "general" },
  { key: "currency", value: "PKR", group: "general" },
  { key: "currency_symbol", value: "₨", group: "general" },
  { key: "tax_rate", value: "17", group: "tax" },
  { key: "tax_name", value: "GST", group: "tax" },
  { key: "receipt_footer", value: "Thank you for shopping!", group: "receipt" },
  { key: "low_stock_threshold", value: "5", group: "inventory" },
]

// Default Categories
["Smartphones", "Feature Phones", "Tablets", "Accessories",
 "Chargers & Cables", "Cases & Covers", "Earphones", "Power Banks"]

// Sample Brands
["Samsung", "Apple", "Xiaomi", "Oppo", "Vivo", "Realme",
 "Nokia", "Tecno", "Infinix", "OnePlus"]
```

---

## 5. Database Migrations Strategy

```bash
# Development workflow
npx prisma migrate dev --name init            # First migration
npx prisma migrate dev --name add_loyalty     # Feature migration
npx prisma migrate dev --name add_imei        # Another migration

# Production deployment
npx prisma migrate deploy                     # Apply all pending migrations

# Reset (development only - DESTROYS DATA)
npx prisma migrate reset

# View DB in browser
npx prisma studio
```

---

## 6. Connection Configuration

```env
# .env
DATABASE_URL="postgresql://posuser:strongpassword@localhost:5432/mobileshop_db?schema=public"

# For Docker Compose
DATABASE_URL="postgresql://posuser:strongpassword@db:5432/mobileshop_db?schema=public"
```

---

## 7. Backup Strategy

```bash
# Daily backup script (backup.sh)
pg_dump -U posuser mobileshop_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U posuser mobileshop_db < backup_20240101_120000.sql
```

---

## 8. Table Summary

| Table | Description | Est. Rows/Year |
|---|---|---|
| users | Staff accounts | < 20 |
| categories | Product categories | < 20 |
| brands | Phone brands | < 30 |
| products | Product catalog | 100–500 |
| product_variants | RAM/Storage/Color options | 300–2000 |
| product_units | Individual IMEI/serial tracking | 500–5000 |
| customers | Customer directory | 200–2000 |
| suppliers | Supplier directory | 5–50 |
| purchases | Purchase orders | 100–500 |
| purchase_items | Line items per purchase | 300–2000 |
| sales | Sales transactions | 1000–10000 |
| sale_items | Line items per sale | 2000–30000 |
| payments | Payment records | 2000–15000 |
| stock_movements | Stock audit trail | 5000–50000 |
| activity_logs | User activity audit | 10000–100000 |
| settings | App configuration | < 50 |
| refresh_tokens | JWT refresh tokens | < 100 (auto-cleaned) |
