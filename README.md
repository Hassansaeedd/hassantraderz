# 📱 Mobile Shop POS System

> Complete Point of Sale + Inventory + Sales & Purchase Management System
> Built for Pakistani mobile phone retail shops
> **English & اردو** | **Pakistan GST (17%)** | **Offline Mode (PWA)** | **Barcode Scanner** | **80mm Thermal Printer**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm 9+

### 1. Clone & Setup

```bash
# Copy env file
cp server/.env.example server/.env
# Edit server/.env with your database credentials and JWT secrets
```

### 2. Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

### 3. Setup Database

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Development

```bash
# Terminal 1 — Backend API (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open: **http://localhost:5173**

---

## 🔑 Default Login Credentials

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `Admin@123` |
| **Manager** | `manager` | `Manager@123` |
| **Cashier** | `cashier` | `Cashier@123` |

---

## 🐳 Docker (Offline / Local Deployment)

```bash
# Build frontend first
cd client && npm run build && cd ..

# Start everything
docker-compose up -d

# Access at: http://localhost
# Also accessible from any device on LAN: http://192.168.x.x
```

---

## 📁 Project Structure

```
mobile-shop-pos/
├── server/              # Express.js API
│   ├── prisma/          # Database schema & migrations
│   └── src/
│       ├── routes/      # API endpoints
│       ├── middleware/  # Auth, validation, error handling
│       ├── services/    # Business logic
│       └── utils/       # Helpers
│
├── client/              # React + Vite Frontend
│   └── src/
│       ├── pages/       # All page components
│       ├── components/  # Reusable components
│       ├── store/       # Zustand state
│       ├── api/         # Axios API calls
│       ├── i18n/        # English + Urdu translations
│       └── utils/       # Barcode scanner, thermal print, offline
│
├── architecture.md      # System architecture
├── phases.md            # Development phases
├── database.md          # Database schema docs
├── security.md          # Security guide
├── error handling.md    # Error handling guide
├── prompts.md           # AI development prompts
└── docker-compose.yml   # One-command deployment
```

---

## 🔧 Key Features

| Feature | Details |
|---|---|
| **Language** | English + اردو (RTL) — toggle anytime |
| **GST** | Pakistan GST 17% — NTN/STRN on invoices |
| **Barcode** | USB/Bluetooth HID scanner plug-and-play |
| **Thermal Printer** | 80mm receipt — bilingual (EN/UR) |
| **Offline Mode** | Works without internet — syncs when online |
| **Payment Methods** | Cash, Card, EasyPaisa, JazzCash, Bank Transfer |
| **Roles** | Admin, Manager, Cashier |

---

## 📡 API

Base URL: `http://localhost:3001/api/v1`

Health check: `GET /health`

Full API docs: Run server and visit `http://localhost:3001/api/v1`

---

## 🗄️ Database Commands

```bash
cd server
npm run db:migrate    # Run migrations
npm run db:seed       # Seed sample data
npm run db:studio     # Open Prisma Studio (browser DB viewer)
npm run db:reset      # DANGER: Reset all data
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Ant Design v5, Zustand, React Router |
| Charts | Recharts |
| Backend | Node.js 20, Express.js 4 |
| Database | PostgreSQL 15, Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| i18n | i18next (EN + UR) |
| Offline | PWA (vite-plugin-pwa), IndexedDB queue |
| Deployment | Docker Compose + Nginx |
