// client/src/utils/thermalPrint.js
// Thermal receipt printer helper (80mm ESC/POS via browser print dialog)

export const printReceipt = (receiptRef) => {
  if (!receiptRef?.current) return;
  window.print();
};

export const buildReceiptHTML = (sale, settings, language = 'en') => {
  const isUrdu = language === 'ur';
  const dir    = isUrdu ? 'rtl' : 'ltr';
  const font   = isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Courier New', monospace";

  const fmt = (n) => `₨ ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => new Date(d).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' });

  const itemsHTML = sale.items.map(item => `
    <tr>
      <td style="width:50%">${isUrdu ? item.product?.nameUr || item.product?.nameEn || item.nameUr || item.nameEn : item.product?.nameEn || item.nameEn}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${fmt(item.unitPrice)}</td>
      <td style="text-align:right">${fmt(item.totalAmount)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html dir="${dir}">
    <head>
      <meta charset="UTF-8"/>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
        @page { size: 80mm auto; margin: 3mm; }
        body { font-family: ${font}; font-size: 11px; width: 72mm; margin: 0 auto; color: #000; }
        .center { text-align: center; }
        .right  { text-align: right; }
        .bold   { font-weight: bold; }
        .large  { font-size: 15px; font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 1px; vertical-align: top; }
        .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 3px; }
        .footer { text-align: center; font-size: 10px; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="center bold large">${settings.shop_name || 'PrimeCell POS'}</div>
      <div class="center">${isUrdu ? 'پرائم سیل POS' : ''}</div>
      <div class="center">${settings.shop_address || 'Main Bazaar, Lahore'}</div>
      <div class="center">${settings.shop_phone || '+92-300-0000000'}</div>
      ${settings.ntn ? `<div class="center">NTN: ${settings.ntn}</div>` : ''}
      ${settings.strn ? `<div class="center">STRN: ${settings.strn}</div>` : ''}
      <div class="divider"></div>
      <div><b>${isUrdu ? 'انوائس' : 'Invoice'}:</b> ${sale.invoiceNumber}</div>
      <div><b>${isUrdu ? 'تاریخ' : 'Date'}:</b> ${fmtDate(sale.saleDate)}</div>
      <div><b>${isUrdu ? 'کیشیئر' : 'Cashier'}:</b> ${sale.user?.fullName || 'Counter Staff'}</div>
      ${sale.customer ? `<div><b>${isUrdu ? 'گاہک' : 'Customer'}:</b> ${sale.customer.name}</div>` : ''}
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left">${isUrdu ? 'آئٹم' : 'Item'}</th>
            <th style="text-align:center">${isUrdu ? 'تعداد' : 'Qty'}</th>
            <th style="text-align:right">${isUrdu ? 'قیمت' : 'Price'}</th>
            <th style="text-align:right">${isUrdu ? 'رقم' : 'Amount'}</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr><td>${isUrdu ? 'ذیلی کل' : 'Subtotal'}</td><td class="right">${fmt(sale.subtotal)}</td></tr>
        ${sale.discountAmount > 0 ? `<tr><td>${isUrdu ? 'رعایت' : 'Discount'}</td><td class="right">- ${fmt(sale.discountAmount)}</td></tr>` : ''}
        <tr><td>GST (${settings.gst_rate || 17}%)</td><td class="right">${fmt(sale.gstAmount)}</td></tr>
        <tr class="total-row"><td class="large">${isUrdu ? 'کل' : 'TOTAL'}</td><td class="right large">${fmt(sale.totalAmount)}</td></tr>
        <tr><td>${isUrdu ? 'ادا کی گئی' : 'Paid'} (${sale.paymentMethod})</td><td class="right">${fmt(sale.paidAmount)}</td></tr>
        ${sale.changeAmount > 0 ? `<tr><td>${isUrdu ? 'واپسی' : 'Change'}</td><td class="right">${fmt(sale.changeAmount)}</td></tr>` : ''}
      </table>
      <div class="divider"></div>
      <div class="footer">${isUrdu ? 'پرائم سیل POS سے خریداری کا شکریہ!' : 'Thank you for shopping at PrimeCell POS!'}</div>
      <div class="footer">${isUrdu ? 'رسید کے ساتھ 7 دن میں تبادلہ' : 'Exchange within 7 days with receipt'}</div>
    </body>
    </html>
  `;
};

export const printReceiptHTML = (sale, settings = {}, language = 'en') => {
  const defaultSettings = { shop_name: 'PrimeCell POS', shop_address: 'Main Bazaar, Lahore', shop_phone: '+92-300-0000000', gst_rate: 17, ...settings };
  const html   = buildReceiptHTML(sale, defaultSettings, language);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:0;border:0;';
  document.body.appendChild(iframe);
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
};
