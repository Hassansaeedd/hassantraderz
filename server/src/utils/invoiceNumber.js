// server/src/utils/invoiceNumber.js — Auto-generate sequential invoice/PO numbers
import { prisma } from '../config/database.js';

export const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastSale = await prisma.sale.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextNum = 1;
  if (lastSale) {
    const lastNum = parseInt(lastSale.invoiceNumber.split('-').pop(), 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
};

export const generatePurchaseNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;

  const lastPO = await prisma.purchase.findFirst({
    where: { purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: 'desc' },
    select: { purchaseNumber: true },
  });

  let nextNum = 1;
  if (lastPO) {
    const lastNum = parseInt(lastPO.purchaseNumber.split('-').pop(), 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
};
