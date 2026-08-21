# 📱 Hassan Traderz POS — Mobile Application (React Native / Expo)

Cross-platform mobile application for **Hassan Traderz POS & Inventory Management System**, built for Android & iOS mobile devices.

---

## ✨ Mobile App Core Modules

1. **🛒 Mobile Floor POS**: Search catalog, manage cart, EasyPaisa/JazzCash/Cash checkout, and WhatsApp invoice sharing.
2. **🛠️ Mobile Repair Tickets**: Instant job intake, real-time status switcher (`Received` ➔ `In Repair` ➔ `Ready` ➔ `Delivered`), and WhatsApp customer completion alerts.
3. **📖 Customer Khata Ledger**: View outstanding balances on-the-go, log installment payments, and send WhatsApp reminders.
4. **📊 Owner Remote Dashboard**: Today's revenue, transactions, GST, MTD sales, and low-stock alerts.
5. **📦 Inventory Stock Check**: Instant selling price & cost lookup by SKU or product name.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Backend API Endpoint
Edit `mobile/src/services/api.js`:
- For **Android Emulator**: `http://10.0.2.2:3001/api/v1`
- For **Physical Android/iPhone Phone** on the same Wi-Fi: `http://<YOUR_COMPUTER_LOCAL_IP>:3001/api/v1` (e.g. `http://192.168.1.50:3001/api/v1`)

### 3. Start Expo Dev Server
```bash
npm start
```
- Scan the QR Code using the **Expo Go** app on your Android or iPhone to run live!

---

## 📦 How to Build Standalone Android APK

To generate an installable Android APK file for your clients:
```bash
npx eas-cli build --platform android --profile preview
```
This generates a downloadable `hassantraderz.apk` ready for direct phone installation without needing Google Play Store!
