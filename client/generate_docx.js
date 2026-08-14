// client/generate_docx.js — Generates Hassan_Traderz_POS_Commercial_Summary.docx
import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        // Title Header
        new Paragraph({
          text: "Hassan Traderz POS — Commercial Software Documentation & Feature Summary",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "Software Name: ", bold: true }),
            new TextRun("Hassan Traderz Point of Sale & Inventory Management System v2.4\n"),
            new TextRun({ text: "Target Market: ", bold: true }),
            new TextRun("Mobile Phone Shops, Accessories Retailers, Repair Centers & Wholesale Distributors (Pakistan)\n"),
            new TextRun({ text: "Document Date: ", bold: true }),
            new TextRun(`${new Date().toLocaleDateString()}\n`),
          ],
          spacing: { after: 400 },
        }),

        // Section 1: Executive Summary
        new Paragraph({ text: "1. Executive Summary", heading: HeadingLevel.HEADING_1, spacing: { after: 120 } }),
        new Paragraph({
          text: "Hassan Traderz POS is an enterprise-grade, turn-key Point of Sale, Inventory Control, Mobile Repair Work Order, Used Phone Trade-In, and Customer Khata Ledger software designed specifically for the Pakistani mobile phone retail and repair industry. Built with high-performance modern web technologies (React 18, Node.js, Express, SQLite zero-config Prisma ORM), it features full bilingual support (English + Urdu RTL), thermal receipt printing (80mm), WhatsApp digital receipt delivery, light & dark theme switching, hardware machine lock licensing, and bulk CSV inventory importing.",
          spacing: { after: 300 },
        }),

        // Section 2: Technical Architecture & Stack
        new Paragraph({ text: "2. Technical Architecture & Tech Stack", heading: HeadingLevel.HEADING_1, spacing: { after: 120 } }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Frontend Framework: ", bold: true }), new TextRun("React 18 + Vite (Ultra-fast build & HMR)\n"),
            new TextRun({ text: "• UI Design System: ", bold: true }), new TextRun("Ant Design 5 + Glassmorphism Vanilla CSS Design Tokens\n"),
            new TextRun({ text: "• Theme Engine: ", bold: true }), new TextRun("Zustand + Dynamic ConfigProvider (Light Mode / Dark Mode switcher)\n"),
            new TextRun({ text: "• State Management: ", bold: true }), new TextRun("Zustand with SessionStorage (Auto-logout security on window exit)\n"),
            new TextRun({ text: "• Localization Engine: ", bold: true }), new TextRun("i18next (English & Urdu Nastaliq RTL Engine)\n"),
            new TextRun({ text: "• Backend API Server: ", bold: true }), new TextRun("Node.js + Express.js REST API Architecture\n"),
            new TextRun({ text: "• Database & ORM: ", bold: true }), new TextRun("SQLite (file:./dev.db zero-config) + Prisma ORM 5\n"),
            new TextRun({ text: "• Authentication: ", bold: true }), new TextRun("JWT Access Tokens & Password Hashing (Bcrypt)\n"),
            new TextRun({ text: "• Offline Capability: ", bold: true }), new TextRun("PWA Service Worker + Workbox Pre-caching\n"),
            new TextRun({ text: "• Thermal Printer Support: ", bold: true }), new TextRun("Direct raw ESC/POS & HTML 80mm thermal receipt printing\n"),
          ],
          spacing: { after: 300 },
        }),

        // Section 3: Commercial Feature Modules
        new Paragraph({ text: "3. Complete Commercial Feature List", heading: HeadingLevel.HEADING_1, spacing: { after: 120 } }),

        new Paragraph({ text: "A. Point of Sale (POS) Counter & Fast Checkout", heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
        new Paragraph({
          text: "Fast barcode scanner integration, search-as-you-type product catalog, category filters, hold & resume transactions, instant change calculation, GST 17% tax computation, cash/card/EasyPaisa/JazzCash payment methods, 80mm thermal receipt printing, and 1-Click WhatsApp Receipt delivery.",
          spacing: { after: 160 },
        }),

        new Paragraph({ text: "B. Used Mobile Phone Buyback & Trade-In (استعمال شدہ موبائل خرید و فروخت)", heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
        new Paragraph({
          text: "Second-hand mobile phone purchase log, customer CNIC number recording, 15-digit IMEI tracking, condition grading (Grade A/B/C), automatic pre-owned stock addition, and 1-Click generation of official Police Verification Vouchers & Purchase Agreements.",
          spacing: { after: 160 },
        }),

        new Paragraph({ text: "C. Mobile Repair & Service Work Orders (موبائل ریپئرنگ ورک آرڈر)", heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
        new Paragraph({
          text: "Repair ticket generation, customer fault description recording, advance deposit tracking, technician status workflow (Received -> In Repair -> Ready -> Delivered), 80mm Customer Repair Claim Tag printing, and automatic spare parts stock deduction.",
          spacing: { after: 160 },
        }),

        new Paragraph({ text: "D. Customer Khata & Credit Installment Ledger (گاہک کھاتہ)", heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
        new Paragraph({
          text: "Informal credit (Udhar) tracking, partial payment recording, real-time remaining balance calculations, and 1-Click bilingual Customer Khata Statement PDF export.",
          spacing: { after: 160 },
        }),

        new Paragraph({ text: "E. Inventory Management & Bulk CSV Importing", heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
        new Paragraph({
          text: "Complete product catalog control, SKU & Barcode generation, cost vs selling prices, low stock alert thresholds, category vector thumbnail badges, and 1-Click Bulk CSV Inventory Import wizard (includes pre-populated 100 Mobile Products CSV template).",
          spacing: { after: 160 },
        }),

        new Paragraph({ text: "F. Shop Expenses & Net Profit Analytics", heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
        new Paragraph({
          text: "Record shop rent, LESCO electricity bills, staff salaries, tea/refreshments, and calculate true Net Profit = Gross Sales Margin - Total Expenses.",
          spacing: { after: 160 },
        }),

        new Paragraph({ text: "G. Client Software Licensing & Hardware Machine Lock", heading: HeadingLevel.HEADING_2, spacing: { after: 80 } }),
        new Paragraph({
          text: "Machine Hardware ID lock (HT-9F82-PK), serial key activation modal (HT-2026-ENT-9F82-COMMERCIAL), automatic session logout on window exit, and vendor subscription management.",
          spacing: { after: 300 },
        }),

        // Section 4: Installation & Deployment Instructions
        new Paragraph({ text: "4. Deployment & Quick Start Guide", heading: HeadingLevel.HEADING_1, spacing: { after: 120 } }),
        new Paragraph({
          children: [
            new TextRun({ text: "1. Start Backend API Server: ", bold: true }), new TextRun("cd server -> npm run dev (Runs on http://localhost:3001)\n"),
            new TextRun({ text: "2. Start Frontend App: ", bold: true }), new TextRun("cd client -> npm run dev (Runs on http://localhost:5173)\n"),
            new TextRun({ text: "3. Admin Account: ", bold: true }), new TextRun("admin / Admin@123\n"),
            new TextRun({ text: "4. Cashier Account: ", bold: true }), new TextRun("cashier / Cashier@123\n"),
          ],
          spacing: { after: 300 },
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outputPath = path.join(process.cwd(), '..', 'Hassan_Traderz_POS_Commercial_Summary.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Docx created successfully at: ' + outputPath);
});
