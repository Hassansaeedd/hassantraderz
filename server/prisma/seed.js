// prisma/seed.js — Seed database with initial data for Mobile Shop POS (Pakistan)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@mobileshop.pk',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Admin user created:', admin.username);

  // ── Demo Manager ────────────────────────────────────────────────────────────
  const managerPassword = await bcrypt.hash('Manager@123', 12);
  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@mobileshop.pk',
      passwordHash: managerPassword,
      fullName: 'Store Manager',
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  });

  // ── Demo Cashier ─────────────────────────────────────────────────────────────
  const cashierPassword = await bcrypt.hash('Cashier@123', 12);
  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      email: 'cashier@mobileshop.pk',
      passwordHash: cashierPassword,
      fullName: 'Front Desk Cashier',
      role: 'CASHIER',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Demo users created');

  // ── Settings ──────────────────────────────────────────────────────────────
  const settings = [
    { key: 'shop_name',           value: 'Mobile World',           group: 'general' },
    { key: 'shop_name_ur',        value: 'موبائل ورلڈ',            group: 'general' },
    { key: 'shop_address',        value: 'Main Bazaar, Lahore',     group: 'general' },
    { key: 'shop_phone',          value: '+92-42-0000000',          group: 'general' },
    { key: 'shop_mobile',         value: '+92-300-0000000',         group: 'general' },
    { key: 'shop_email',          value: 'info@mobileshop.pk',      group: 'general' },
    { key: 'currency',            value: 'PKR',                     group: 'general' },
    { key: 'currency_symbol',     value: '₨',                       group: 'general' },
    { key: 'default_language',    value: 'en',                      group: 'general' },
    { key: 'gst_rate',            value: '17',                      group: 'tax' },
    { key: 'gst_name',            value: 'GST',                     group: 'tax' },
    { key: 'gst_name_ur',         value: 'جی ایس ٹی',              group: 'tax' },
    { key: 'gst_inclusive',       value: 'false',                   group: 'tax' },
    { key: 'ntn',                 value: '1234567-8',               group: 'tax' },
    { key: 'strn',                value: '1234567890123',           group: 'tax' },
    { key: 'receipt_width',       value: '80',                      group: 'receipt' },
    { key: 'receipt_header',      value: 'Mobile World',            group: 'receipt' },
    { key: 'receipt_footer_en',   value: 'Thank you for shopping!', group: 'receipt' },
    { key: 'receipt_footer_ur',   value: 'خریداری کا شکریہ!',       group: 'receipt' },
    { key: 'low_stock_threshold', value: '5',                       group: 'inventory' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ Settings seeded');

  // ── Categories ────────────────────────────────────────────────────────────
  const categories = [
    { nameEn: 'Smartphones',      nameUr: 'اسمارٹ فون',        sortOrder: 1 },
    { nameEn: 'Feature Phones',   nameUr: 'فیچر فون',          sortOrder: 2 },
    { nameEn: 'Tablets',          nameUr: 'ٹیبلیٹ',            sortOrder: 3 },
    { nameEn: 'Accessories',      nameUr: 'لوازمات',            sortOrder: 4 },
    { nameEn: 'Chargers & Cables',nameUr: 'چارجر اور کیبل',    sortOrder: 5 },
    { nameEn: 'Cases & Covers',   nameUr: 'کور اور کیس',       sortOrder: 6 },
    { nameEn: 'Earphones',        nameUr: 'ایئرفون',            sortOrder: 7 },
    { nameEn: 'Power Banks',      nameUr: 'پاور بینک',          sortOrder: 8 },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({ where: { nameEn: cat.nameEn } });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log('✅ Categories seeded');

  // ── Brands ────────────────────────────────────────────────────────────────
  const brands = [
    'Samsung', 'Apple', 'Xiaomi', 'Oppo', 'Vivo',
    'Realme', 'Nokia', 'Tecno', 'Infinix', 'OnePlus',
  ];

  for (const brand of brands) {
    const existing = await prisma.brand.findFirst({ where: { name: brand } });
    if (!existing) {
      await prisma.brand.create({ data: { name: brand } });
    }
  }
  console.log('✅ Brands seeded');

  // ── Sample Products ────────────────────────────────────────────────────────
  const catSmartphone = await prisma.category.findFirst({ where: { nameEn: 'Smartphones' } });
  const brandSamsung  = await prisma.brand.findFirst({ where: { name: 'Samsung' } });
  const brandApple    = await prisma.brand.findFirst({ where: { name: 'Apple' } });
  const brandXiaomi   = await prisma.brand.findFirst({ where: { name: 'Xiaomi' } });

  if (catSmartphone) {
    const sampleProducts = [
      {
        nameEn: 'Samsung Galaxy S24 Ultra', nameUr: 'سیمسنگ گلیکسی ایس 24 الٹرا',
        sku: 'MOB-S24U-256', barcode: '880609530001',
        categoryId: catSmartphone.id, brandId: brandSamsung?.id,
        purchasePrice: 380000, sellingPrice: 420000, gstRate: 17, currentStock: 8, minStockLevel: 3,
      },
      {
        nameEn: 'iPhone 15 Pro Max', nameUr: 'آئی فون 15 پرو میکس',
        sku: 'MOB-IP15PM-256', barcode: '195949000001',
        categoryId: catSmartphone.id, brandId: brandApple?.id,
        purchasePrice: 450000, sellingPrice: 495000, gstRate: 17, currentStock: 5, minStockLevel: 2,
      },
      {
        nameEn: 'Redmi Note 13 Pro', nameUr: 'ریڈمی نوٹ 13 پرو',
        sku: 'MOB-RN13P-128', barcode: '694181270001',
        categoryId: catSmartphone.id, brandId: brandXiaomi?.id,
        purchasePrice: 62000, sellingPrice: 74999, gstRate: 17, currentStock: 15, minStockLevel: 5,
      },
    ];

    for (const prod of sampleProducts) {
      const existing = await prisma.product.findFirst({ where: { sku: prod.sku } });
      if (!existing) {
        await prisma.product.create({ data: prod });
      }
    }
    console.log('✅ Sample products seeded');
  }

  // ── Sample Customer & Supplier ─────────────────────────────────────────────
  const existingCust = await prisma.customer.findFirst({ where: { phone: '03001234567' } });
  if (!existingCust) {
    await prisma.customer.create({
      data: { name: 'Ali Khan', phone: '03001234567', city: 'Lahore', address: 'Model Town' },
    });
  }

  const existingSup = await prisma.supplier.findFirst({ where: { name: 'Pak Telecom Wholesale' } });
  if (!existingSup) {
    await prisma.supplier.create({
      data: { name: 'Pak Telecom Wholesale', company: 'Pak Telecom Pvt Ltd', phone: '04235551234', ntn: '1234567-8', strn: '1234567890123' },
    });
  }
  console.log('✅ Sample customer & supplier seeded');

  console.log('\n🎉 Database seeding complete!');
  console.log('─────────────────────────────────────');
  console.log('Default login credentials:');
  console.log('  Admin:   admin / Admin@123');
  console.log('  Manager: manager / Manager@123');
  console.log('  Cashier: cashier / Cashier@123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
