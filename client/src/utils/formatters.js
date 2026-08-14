// client/src/utils/formatters.js — Currency, date, number formatters
import dayjs from 'dayjs';

export const formatCurrency = (amount, currency = '₨') => {
  const num = Number(amount || 0);
  return `${currency} ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (n) => Number(n || 0).toLocaleString('en-PK');

export const formatDate = (date, format = 'DD/MM/YYYY') => dayjs(date).format(format);

export const formatDateTime = (date) => dayjs(date).format('DD/MM/YYYY hh:mm A');

export const formatPercent = (n) => `${Number(n || 0).toFixed(1)}%`;

// Calculate GST amount from price
export const calcGST = (amount, gstRate = 17, inclusive = false) => {
  const rate = gstRate / 100;
  if (inclusive) {
    return amount - amount / (1 + rate);
  }
  return amount * rate;
};

// Calculate GST-exclusive price from inclusive price
export const gstExclusive = (inclusivePrice, gstRate = 17) => {
  return inclusivePrice / (1 + gstRate / 100);
};

// Auto-generate SKU
export const generateSKU = (prefix = 'SKU') => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
};

export const getStockStatus = (current, min) => {
  if (current === 0)     return { label: 'Out of Stock', color: 'red',    class: 'danger' };
  if (current <= min)    return { label: 'Low Stock',    color: 'orange', class: 'warning' };
  return                        { label: 'In Stock',     color: 'green',  class: 'success' };
};

export const getPaymentMethodLabel = (method) => {
  const labels = { CASH: 'Cash', CARD: 'Card', EASYPAISA: 'EasyPaisa', JAZZCASH: 'JazzCash', BANK_TRANSFER: 'Bank Transfer', CREDIT: 'Credit' };
  return labels[method] || method;
};
