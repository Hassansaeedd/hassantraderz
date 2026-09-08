// prisma/seed.js — Base Seeder for Mobile Shop POS (Pakistan)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking system baseline & settings...');

  // ── 1. Super Admin User (Hassan@009 / shopco@123) ──────────────────────────
  const adminPassword = await bcrypt.hash('shopco@123', 12);
  await prisma.user.upsert({
    where: { username: 'Hassan@009' },
    update: { passwordHash: adminPassword, role: 'ADMIN', status: 'ACTIVE' },
    create: {
      username: 'Hassan@009',
      email: 'admin@hassantraderz.com',
      passwordHash: adminPassword,
      fullName: 'Hassan Saeed (Super Admin)',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Super Admin ready: Hassan@009');

  // ── 2. System Settings ─────────────────────────────────────────────────────
  const settings = [
    { key: 'shop_name',           value: 'Hassan Traderz POS',     group: 'general' },
    { key: 'shop_name_ur',        value: 'حسن ٹریڈرز پی او ایس',   group: 'general' },
    { key: 'shop_address',        value: 'Mobile Market, Pakistan',group: 'general' },
    { key: 'shop_phone',          value: '+92-300-0000000',        group: 'general' },
    { key: 'currency',            value: 'PKR',                    group: 'general' },
    { key: 'currency_symbol',     value: '₨',                      group: 'general' },
    { key: 'default_language',    value: 'en',                     group: 'general' },
    { key: 'receipt_width',       value: '80',                     group: 'receipt' },
    { key: 'receipt_header',      value: 'Hassan Traderz POS',     group: 'receipt' },
    { key: 'receipt_footer_en',   value: 'Thank you for shopping with us!', group: 'receipt' },
    { key: 'receipt_footer_ur',   value: 'ہماری دکان سے خریداری کا شکریہ!', group: 'receipt' },
    { key: 'low_stock_threshold', value: '3',                      group: 'inventory' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ System Settings seeded');

  // ── 3. Categories ──────────────────────────────────────────────────────────
  const categoriesList = [
    { nameEn: 'Smartphones', nameUr: 'اسمارٹ فون', sortOrder: 1 },
    { nameEn: 'Feature Phones', nameUr: 'فیچر فون', sortOrder: 2 },
    { nameEn: 'Accessories', nameUr: 'لوازمات', sortOrder: 3 },
    { nameEn: 'Chargers & Cables', nameUr: 'چارجر اور کیبل', sortOrder: 4 },
    { nameEn: 'Earphones & Audio', nameUr: 'ایئرفون اور آڈیو', sortOrder: 5 },
    { nameEn: 'Power Banks', nameUr: 'پاور بینک', sortOrder: 6 },
    { nameEn: 'Cases & Covers', nameUr: 'موبائل کور اور کیس', sortOrder: 7 },
    { nameEn: 'Tempered Glass & Protectors', nameUr: 'اسکرین پروٹیکٹر اور گلاس', sortOrder: 8 },
    { nameEn: 'Repair Parts & Tools', nameUr: 'مرمت کے پرزے اور اوزار', sortOrder: 9 },
  ];

  for (const cat of categoriesList) {
    const existing = await prisma.category.findFirst({ where: { nameEn: cat.nameEn } });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log('✅ Categories ready');

  // ── 4. Brands ──────────────────────────────────────────────────────────────
  const brandsList = [
    'Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme',
    'Infinix', 'Tecno', 'Nokia', 'OnePlus', 'Anker', 'Baseus',
    'Ronin', 'Audionic', 'Faster', 'Joyroom', 'Remax', 'Generic'
  ];

  for (const b of brandsList) {
    const existing = await prisma.brand.findFirst({ where: { name: b } });
    if (!existing) {
      await prisma.brand.create({ data: { name: b } });
    }
  }
  console.log('✅ Brands ready');

  console.log('\n🎉 Baseline setup complete. Products remain strictly user-managed (no forced re-seeding).');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
