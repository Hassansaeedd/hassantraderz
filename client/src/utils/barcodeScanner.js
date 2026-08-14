// client/src/utils/barcodeScanner.js
// USB/Bluetooth HID barcode scanners act as keyboards.
// This utility captures rapid keystrokes and fires a callback when a complete barcode is scanned.

let buffer    = '';
let lastTime  = 0;
let listener  = null;

const SCAN_SPEED_MS   = 50;   // Characters arriving faster than this = scanner input
const MIN_BARCODE_LEN = 4;    // Minimum barcode length

const handleKeyDown = (e) => {
  // Ignore if user is typing in an input (except the dedicated search bar)
  const tag = document.activeElement?.tagName;
  if (tag === 'TEXTAREA') return;
  // Allow input fields that have data-barcode-target="true"
  if (tag === 'INPUT' && document.activeElement?.dataset?.barcodeTarget !== 'true') return;

  const now = Date.now();

  if (e.key === 'Enter') {
    if (buffer.length >= MIN_BARCODE_LEN && listener) {
      listener(buffer.trim());
    }
    buffer = '';
    lastTime = 0;
    return;
  }

  if (now - lastTime > 300) {
    // Gap too large — reset (user is typing manually)
    buffer = '';
  }

  if (e.key.length === 1) {
    // Single printable character
    if (now - lastTime < SCAN_SPEED_MS || buffer.length === 0) {
      buffer += e.key;
    } else {
      buffer = e.key; // Reset on slow input
    }
  }

  lastTime = now;
};

export const startBarcodeListener = (callback) => {
  listener = callback;
  document.addEventListener('keydown', handleKeyDown);
};

export const stopBarcodeListener = () => {
  listener = null;
  document.removeEventListener('keydown', handleKeyDown);
};

// Hook: use in POS search
// import { useEffect } from 'react';
// import { startBarcodeListener, stopBarcodeListener } from '@/utils/barcodeScanner';
// useEffect(() => {
//   startBarcodeListener((barcode) => searchProduct(barcode));
//   return () => stopBarcodeListener();
// }, []);
