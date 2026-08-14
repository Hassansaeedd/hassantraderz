// server/src/index.js — Express App Entry Point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from './utils/logger.js';
import { globalErrorHandler } from './middleware/errorHandler.middleware.js';
import router from './routes/index.js';
import { validateEnv } from './config/env.js';

// Validate env variables on startup
validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Handled by Nginx
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    /^http:\/\/192\.168\.\d+\.\d+$/,    // Allow local network IPs
    /^http:\/\/10\.\d+\.\d+\.\d+$/,     // Allow 10.x.x.x LAN IPs
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
app.use('/api/v1/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try after 15 minutes.' },
  skipSuccessfulRequests: true,
}));

app.use('/api/v1/', rateLimit({
  windowMs: 60 * 1000,
  max: 500,
}));

// ─── General Middleware ────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP request logging (dev: colored, prod: json)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ─── Static Files (Uploaded Images) ───────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile Shop POS API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(globalErrorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`
  ╔══════════════════════════════════════════╗
  ║   Mobile Shop POS — API Server           ║
  ║   Running on: http://0.0.0.0:${PORT}        ║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(26)}║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
