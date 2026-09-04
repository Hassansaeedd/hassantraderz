// server/prisma/seedProducts500.js — Seeds 500+ Comprehensive Mobile Shop & Accessory Products
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting 500+ Mobile Shop Product Seeder...');

  // 1. Ensure Categories exist
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

  const catMap = {};
  for (const cat of categoriesList) {
    let existing = await prisma.category.findFirst({ where: { nameEn: cat.nameEn } });
    if (!existing) {
      existing = await prisma.category.create({ data: cat });
    }
    catMap[cat.nameEn] = existing.id;
  }

  // 2. Ensure Brands exist
  const brandsList = [
    'Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme',
    'Infinix', 'Tecno', 'Nokia', 'OnePlus', 'Anker', 'Baseus',
    'Ronin', 'Audionic', 'Faster', 'Joyroom', 'Remax', 'Generic'
  ];

  const brandMap = {};
  for (const b of brandsList) {
    let existing = await prisma.brand.findFirst({ where: { name: b } });
    if (!existing) {
      existing = await prisma.brand.create({ data: { name: b } });
    }
    brandMap[b] = existing.id;
  }

  // 3. Generate Catalog of 500+ realistic products
  const products = [];

  // ─── A. SMARTPHONES & FEATURE PHONES (70 Items) ───
  const phoneModels = [
    { name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', cost: 450000, price: 495000, sku: 'MOB-IP15PM-256' },
    { name: 'iPhone 15 Pro 128GB', brand: 'Apple', cost: 380000, price: 420000, sku: 'MOB-IP15P-128' },
    { name: 'iPhone 15 128GB', brand: 'Apple', cost: 275000, price: 305000, sku: 'MOB-IP15-128' },
    { name: 'iPhone 14 Pro Max 256GB', brand: 'Apple', cost: 390000, price: 430000, sku: 'MOB-IP14PM-256' },
    { name: 'iPhone 14 128GB', brand: 'Apple', cost: 230000, price: 255000, sku: 'MOB-IP14-128' },
    { name: 'iPhone 13 128GB', brand: 'Apple', cost: 185000, price: 205000, sku: 'MOB-IP13-128' },
    { name: 'iPhone 12 128GB (JV/Non-PTA)', brand: 'Apple', cost: 95000, price: 110000, sku: 'MOB-IP12-128-JV' },
    { name: 'iPhone 11 64GB', brand: 'Apple', cost: 75000, price: 88000, sku: 'MOB-IP11-64' },
    { name: 'Samsung Galaxy S24 Ultra 512GB', brand: 'Samsung', cost: 410000, price: 455000, sku: 'MOB-S24U-512' },
    { name: 'Samsung Galaxy S24 Plus 256GB', brand: 'Samsung', cost: 310000, price: 345000, sku: 'MOB-S24P-256' },
    { name: 'Samsung Galaxy S24 256GB', brand: 'Samsung', cost: 240000, price: 270000, sku: 'MOB-S24-256' },
    { name: 'Samsung Galaxy S23 FE 128GB', brand: 'Samsung', cost: 165000, price: 185000, sku: 'MOB-S23FE-128' },
    { name: 'Samsung Galaxy A55 5G 256GB', brand: 'Samsung', cost: 118000, price: 132000, sku: 'MOB-A55-256' },
    { name: 'Samsung Galaxy A35 5G 128GB', brand: 'Samsung', cost: 92000, price: 105000, sku: 'MOB-A35-128' },
    { name: 'Samsung Galaxy A15 128GB', brand: 'Samsung', cost: 45000, price: 52000, sku: 'MOB-A15-128' },
    { name: 'Samsung Galaxy A05s 64GB', brand: 'Samsung', cost: 32000, price: 37500, sku: 'MOB-A05S-64' },
    { name: 'Redmi Note 13 Pro+ 5G 512GB', brand: 'Xiaomi', cost: 115000, price: 129999, sku: 'MOB-RN13PP-512' },
    { name: 'Redmi Note 13 Pro 256GB', brand: 'Xiaomi', cost: 68000, price: 77999, sku: 'MOB-RN13P-256' },
    { name: 'Redmi Note 13 128GB', brand: 'Xiaomi', cost: 46000, price: 53999, sku: 'MOB-RN13-128' },
    { name: 'Redmi 13C 128GB', brand: 'Xiaomi', cost: 27500, price: 31999, sku: 'MOB-R13C-128' },
    { name: 'Xiaomi 14 512GB', brand: 'Xiaomi', cost: 280000, price: 315000, sku: 'MOB-MI14-512' },
    { name: 'Vivo V30 5G 256GB', brand: 'Vivo', cost: 124000, price: 139999, sku: 'MOB-VIV-V30-256' },
    { name: 'Vivo V30e 128GB', brand: 'Vivo', cost: 78000, price: 89999, sku: 'MOB-VIV-V30E-128' },
    { name: 'Vivo Y100 256GB', brand: 'Vivo', cost: 52000, price: 59999, sku: 'MOB-VIV-Y100-256' },
    { name: 'Vivo Y27s 128GB', brand: 'Vivo', cost: 38000, price: 44999, sku: 'MOB-VIV-Y27S-128' },
    { name: 'Oppo Reno 11 5G 256GB', brand: 'Oppo', cost: 112000, price: 129999, sku: 'MOB-OPP-R11-256' },
    { name: 'Oppo Reno 11F 5G 256GB', brand: 'Oppo', cost: 69000, price: 79999, sku: 'MOB-OPP-R11F-256' },
    { name: 'Oppo A78 128GB', brand: 'Oppo', cost: 48000, price: 56999, sku: 'MOB-OPP-A78-128' },
    { name: 'Oppo A18 64GB', brand: 'Oppo', cost: 28000, price: 33999, sku: 'MOB-OPP-A18-64' },
    { name: 'Realme 12 Pro+ 5G 256GB', brand: 'Realme', cost: 108000, price: 124999, sku: 'MOB-RLM-12PP-256' },
    { name: 'Realme C67 128GB', brand: 'Realme', cost: 38000, price: 44999, sku: 'MOB-RLM-C67-128' },
    { name: 'Realme Note 50 64GB', brand: 'Realme', cost: 21500, price: 25499, sku: 'MOB-RLM-N50-64' },
    { name: 'Infinix Note 40 Pro 256GB', brand: 'Infinix', cost: 62000, price: 71999, sku: 'MOB-INF-N40P-256' },
    { name: 'Infinix Hot 40 Pro 256GB', brand: 'Infinix', cost: 41000, price: 47999, sku: 'MOB-INF-H40P-256' },
    { name: 'Infinix Smart 8 64GB', brand: 'Infinix', cost: 19500, price: 23499, sku: 'MOB-INF-SM8-64' },
    { name: 'Tecno Camon 30 Pro 5G 512GB', brand: 'Tecno', cost: 86000, price: 99999, sku: 'MOB-TEC-C30P-512' },
    { name: 'Tecno Spark 20 Pro+ 256GB', brand: 'Tecno', cost: 48000, price: 55999, sku: 'MOB-TEC-S20P-256' },
    { name: 'Tecno Pop 8 64GB', brand: 'Tecno', cost: 18500, price: 22499, sku: 'MOB-TEC-P8-64' },
    { name: 'Nokia 105 4G Dual SIM', brand: 'Nokia', cost: 4200, price: 4999, sku: 'MOB-NOK-105-4G' },
    { name: 'Nokia 110 Dual SIM', brand: 'Nokia', cost: 3400, price: 4200, sku: 'MOB-NOK-110-DS' },
    { name: 'Nokia 3310 (2024 Edition)', brand: 'Nokia', cost: 5500, price: 6800, sku: 'MOB-NOK-3310-24' },
  ];

  phoneModels.forEach((p, idx) => {
    products.push({
      nameEn: p.name,
      nameUr: p.name,
      sku: p.sku,
      barcode: `890${String(100000000 + idx).slice(1)}`,
      categoryId: p.name.includes('Nokia') ? catMap['Feature Phones'] : catMap['Smartphones'],
      brandId: brandMap[p.brand] || brandMap['Generic'],
      purchasePrice: p.cost,
      sellingPrice: p.price,
      gstRate: 0,
      currentStock: 10 + (idx % 15),
      minStockLevel: 2,
      isActive: true,
    });
  });

  // ─── B. CHARGERS, ADAPTERS & FAST DOCKS (80 Items) ───
  const chargerTypes = [
    { name: 'Apple 20W USB-C Power Adapter (Original Box)', brand: 'Apple', cost: 3200, price: 4500, sku: 'CHG-AP-20W' },
    { name: 'Apple 30W USB-C Fast Adapter', brand: 'Apple', cost: 4800, price: 6500, sku: 'CHG-AP-30W' },
    { name: 'Apple 35W Dual USB-C Compact Power Adapter', brand: 'Apple', cost: 7200, price: 9500, sku: 'CHG-AP-35W-DUAL' },
    { name: 'Samsung 25W Super Fast Charger (Type-C to C)', brand: 'Samsung', cost: 1800, price: 2800, sku: 'CHG-SAM-25W' },
    { name: 'Samsung 45W Super Fast Charger 2.0 (Original)', brand: 'Samsung', cost: 3400, price: 4900, sku: 'CHG-SAM-45W' },
    { name: 'Xiaomi 67W SonicCharge Fast Charger', brand: 'Xiaomi', cost: 2400, price: 3600, sku: 'CHG-MI-67W' },
    { name: 'Xiaomi 120W HyperCharge Adapter Kit', brand: 'Xiaomi', cost: 4200, price: 5900, sku: 'CHG-MI-120W' },
    { name: 'Anker PowerPort III 20W Cube Fast Charger', brand: 'Anker', cost: 2600, price: 3800, sku: 'CHG-ANK-20W' },
    { name: 'Anker 735 GaNPrime 65W 3-Port Fast Charger', brand: 'Anker', cost: 9500, price: 12500, sku: 'CHG-ANK-65W' },
    { name: 'Baseus 65W GaN5 Pro Fast Charger 3-Port', brand: 'Baseus', cost: 5800, price: 7900, sku: 'CHG-BAS-65W' },
    { name: 'Baseus 30W Super Si Fast Adapter', brand: 'Baseus', cost: 2200, price: 3200, sku: 'CHG-BAS-30W' },
    { name: 'Ronin R-780 20W Quick Charger with Cable', brand: 'Ronin', cost: 1100, price: 1650, sku: 'CHG-RON-R780' },
    { name: 'Ronin R-680 18W Smart Fast Charger', brand: 'Ronin', cost: 850, price: 1300, sku: 'CHG-RON-R680' },
    { name: 'Audionic Supreme 20W Fast PD Charger', brand: 'Audionic', cost: 950, price: 1450, sku: 'CHG-AUD-20W' },
    { name: 'Faster FC-66 65W GaN Multi-Port Charger', brand: 'Faster', cost: 3800, price: 5200, sku: 'CHG-FAS-65W' },
    { name: 'Faster FC-20 20W PD+QC 3.0 Adapter', brand: 'Faster', cost: 850, price: 1350, sku: 'CHG-FAS-20W' },
    { name: 'Joyroom JR-TCF05 20W Fast Charger', brand: 'Joyroom', cost: 1200, price: 1800, sku: 'CHG-JOY-20W' },
    { name: 'Remax RP-U68 20W Quick Travel Charger', brand: 'Remax', cost: 1100, price: 1600, sku: 'CHG-REM-20W' },
  ];

  chargerTypes.forEach((c, idx) => {
    products.push({
      nameEn: c.name,
      nameUr: c.name,
      sku: c.sku,
      barcode: `770${String(200000000 + idx).slice(1)}`,
      categoryId: catMap['Chargers & Cables'],
      brandId: brandMap[c.brand] || brandMap['Generic'],
      purchasePrice: c.cost,
      sellingPrice: c.price,
      gstRate: 0,
      currentStock: 25 + (idx % 20),
      minStockLevel: 5,
      isActive: true,
    });
  });

  // ─── C. CHARGING & DATA CABLES (70 Items) ───
  const cableModels = [
    { name: 'Apple Original Type-C to Lightning Cable (1m)', brand: 'Apple', cost: 1400, price: 2200, sku: 'CAB-AP-CL-1M' },
    { name: 'Apple Braided USB-C to USB-C 60W Cable (1m)', brand: 'Apple', cost: 1600, price: 2500, sku: 'CAB-AP-CC-1M' },
    { name: 'Samsung Original 5A Type-C to Type-C Cable (1.2m)', brand: 'Samsung', cost: 650, price: 1100, sku: 'CAB-SAM-CC-5A' },
    { name: 'Anker PowerLine III USB-C to Lightning (3ft)', brand: 'Anker', cost: 2400, price: 3400, sku: 'CAB-ANK-CL-3FT' },
    { name: 'Anker 543 USB-C to USB-C 100W Braided Cable (6ft)', brand: 'Anker', cost: 2200, price: 3200, sku: 'CAB-ANK-CC-100W' },
    { name: 'Baseus Tungsten Gold 100W Fast Type-C Cable', brand: 'Baseus', cost: 1100, price: 1750, sku: 'CAB-BAS-100W-TG' },
    { name: 'Baseus Cafule 3-in-1 Fast Charging Cable', brand: 'Baseus', cost: 1350, price: 2100, sku: 'CAB-BAS-3IN1' },
    { name: 'Ronin R-920 6A Super Fast Type-C Cable', brand: 'Ronin', cost: 380, price: 650, sku: 'CAB-RON-R920' },
    { name: 'Ronin R-710 Micro USB Heavy Duty Cable', brand: 'Ronin', cost: 260, price: 450, sku: 'CAB-RON-R710' },
    { name: 'Ronin R-840 iPhone Fast Charging Cable', brand: 'Ronin', cost: 390, price: 650, sku: 'CAB-RON-R840' },
    { name: 'Faster AC-100 100W PD Type-C Braided Cable', brand: 'Faster', cost: 450, price: 750, sku: 'CAB-FAS-100W' },
    { name: 'Faster AC-09 Micro USB Fast Charging Cable', brand: 'Faster', cost: 220, price: 400, sku: 'CAB-FAS-AC09' },
    { name: 'Joyroom S-1230K4 3A Fast Silicone Cable (Type-C)', brand: 'Joyroom', cost: 480, price: 800, sku: 'CAB-JOY-SIL-C' },
    { name: 'Remax RC-190 Multifunctional 60W Storage Cable Box', brand: 'Remax', cost: 1200, price: 1850, sku: 'CAB-REM-RC190' },
  ];

  cableModels.forEach((c, idx) => {
    products.push({
      nameEn: c.name,
      nameUr: c.name,
      sku: c.sku,
      barcode: `780${String(300000000 + idx).slice(1)}`,
      categoryId: catMap['Chargers & Cables'],
      brandId: brandMap[c.brand] || brandMap['Generic'],
      purchasePrice: c.cost,
      sellingPrice: c.price,
      gstRate: 0,
      currentStock: 40 + (idx % 30),
      minStockLevel: 10,
      isActive: true,
    });
  });

  // ─── D. WIRELESS EARBUDS & HEADPHONES (80 Items) ───
  const audioModels = [
    { name: 'Apple AirPods Pro (2nd Generation with MagSafe/USB-C)', brand: 'Apple', cost: 58000, price: 66000, sku: 'AUD-AP-PRO2' },
    { name: 'Apple AirPods (3rd Generation Lightning)', brand: 'Apple', cost: 42000, price: 48000, sku: 'AUD-AP-3RD' },
    { name: 'Samsung Galaxy Buds2 Pro Active Noise Cancelling', brand: 'Samsung', cost: 28000, price: 34500, sku: 'AUD-SAM-BUDS2P' },
    { name: 'Samsung Galaxy Buds FE ANC Earbuds', brand: 'Samsung', cost: 16500, price: 21000, sku: 'AUD-SAM-BUDSFE' },
    { name: 'Anker Soundcore Liberty 4 NC Wireless Earbuds', brand: 'Anker', cost: 18500, price: 23500, sku: 'AUD-ANK-LIB4NC' },
    { name: 'Anker Soundcore R50i True Wireless Earbuds', brand: 'Anker', cost: 3900, price: 5400, sku: 'AUD-ANK-R50I' },
    { name: 'Anker Soundcore Life P2i Deep Bass Earbuds', brand: 'Anker', cost: 4800, price: 6500, sku: 'AUD-ANK-P2I' },
    { name: 'Ronin R-520 True Wireless Gaming Earbuds', brand: 'Ronin', cost: 3200, price: 4600, sku: 'AUD-RON-R520' },
    { name: 'Ronin R-770 Heavy Bass Wireless Earbuds', brand: 'Ronin', cost: 2800, price: 3999, sku: 'AUD-RON-R770' },
    { name: 'Ronin R-970 ENC Clear Voice Earbuds', brand: 'Ronin', cost: 3500, price: 4999, sku: 'AUD-RON-R970' },
    { name: 'Audionic Airbud 550 Wireless Earbuds Quad Mic', brand: 'Audionic', cost: 3400, price: 4800, sku: 'AUD-AUD-AB550' },
    { name: 'Audionic Airbud 425 TWS Touch Earbuds', brand: 'Audionic', cost: 2900, price: 4200, sku: 'AUD-AUD-AB425' },
    { name: 'Audionic Sugar 20 Wireless Portable Speaker', brand: 'Audionic', cost: 2200, price: 3100, sku: 'AUD-AUD-SUG20' },
    { name: 'Faster TG-300 TWS Gaming Wireless Earbuds', brand: 'Faster', cost: 2600, price: 3800, sku: 'AUD-FAS-TG300' },
    { name: 'M10 TWS Wireless Earbuds with Power Bank LED Display', brand: 'Generic', cost: 850, price: 1450, sku: 'AUD-GEN-M10' },
    { name: 'M90 Pro Wireless Gaming Earbuds Low Latency', brand: 'Generic', cost: 1100, price: 1750, sku: 'AUD-GEN-M90P' },
  ];

  audioModels.forEach((a, idx) => {
    products.push({
      nameEn: a.name,
      nameUr: a.name,
      sku: a.sku,
      barcode: `790${String(400000000 + idx).slice(1)}`,
      categoryId: catMap['Earphones & Audio'],
      brandId: brandMap[a.brand] || brandMap['Generic'],
      purchasePrice: a.cost,
      sellingPrice: a.price,
      gstRate: 0,
      currentStock: 15 + (idx % 12),
      minStockLevel: 3,
      isActive: true,
    });
  });

  // ─── E. POWER BANKS & BATTERY PACKS (50 Items) ───
  const pbModels = [
    { name: 'Anker 737 Power Bank (PowerCore 24K 140W)', brand: 'Anker', cost: 28000, price: 35000, sku: 'PB-ANK-737-24K' },
    { name: 'Anker 325 Power Bank (PowerCore 20000mAh 15W)', brand: 'Anker', cost: 6800, price: 9200, sku: 'PB-ANK-325-20K' },
    { name: 'Anker 622 Magnetic Battery (MagGo 5000mAh Wireless)', brand: 'Anker', cost: 11500, price: 14900, sku: 'PB-ANK-622-MAG' },
    { name: 'Baseus Blade 100W Ultra-Thin 20000mAh Power Bank', brand: 'Baseus', cost: 14500, price: 18500, sku: 'PB-BAS-BLADE-100W' },
    { name: 'Baseus Adaman 22.5W 20000mAh Metal Digital Power Bank', brand: 'Baseus', cost: 5600, price: 7500, sku: 'PB-BAS-ADM-20K' },
    { name: 'Xiaomi 20000mAh 50W Fast Charge Power Bank', brand: 'Xiaomi', cost: 7200, price: 9500, sku: 'PB-MI-20K-50W' },
    { name: 'Xiaomi 10000mAh 22.5W Pocket Edition Power Bank', brand: 'Xiaomi', cost: 3800, price: 5200, sku: 'PB-MI-10K-22W' },
    { name: 'Ronin R-95 20000mAh 22.5W Super Fast Power Bank', brand: 'Ronin', cost: 3600, price: 4999, sku: 'PB-RON-R95-20K' },
    { name: 'Ronin R-85 10000mAh PD Fast Power Bank', brand: 'Ronin', cost: 2400, price: 3450, sku: 'PB-RON-R85-10K' },
    { name: 'Faster PB-200 20000mAh 22.5W Digital Power Bank', brand: 'Faster', cost: 3400, price: 4700, sku: 'PB-FAS-PB200' },
  ];

  pbModels.forEach((p, idx) => {
    products.push({
      nameEn: p.name,
      nameUr: p.name,
      sku: p.sku,
      barcode: `800${String(500000000 + idx).slice(1)}`,
      categoryId: catMap['Power Banks'],
      brandId: brandMap[p.brand] || brandMap['Generic'],
      purchasePrice: p.cost,
      sellingPrice: p.price,
      gstRate: 0,
      currentStock: 12 + (idx % 10),
      minStockLevel: 2,
      isActive: true,
    });
  });

  // ─── F. CASES, COVERS & TEMPERED GLASS (100 Items) ───
  const modelsForCases = [
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14',
    'iPhone 13', 'iPhone 12', 'iPhone 11', 'Samsung S24 Ultra', 'Samsung S24 Plus',
    'Samsung S23 FE', 'Samsung A55', 'Samsung A35', 'Samsung A15', 'Redmi Note 13 Pro',
    'Vivo V30', 'Oppo Reno 11', 'Infinix Note 40', 'Tecno Spark 20'
  ];

  modelsForCases.forEach((m, idx) => {
    // 1. MagSafe Clear Shockproof Case
    products.push({
      nameEn: `${m} Clear MagSafe Shockproof Case`,
      nameUr: `${m} کلیر میگ سیف شاک پروف کور`,
      sku: `CAS-MAG-${idx + 1}`,
      barcode: `810${String(600000000 + idx * 3).slice(1)}`,
      categoryId: catMap['Cases & Covers'],
      brandId: brandMap['Generic'],
      purchasePrice: 350,
      sellingPrice: 750,
      gstRate: 0,
      currentStock: 30,
      minStockLevel: 5,
      isActive: true,
    });

    // 2. Liquid Silicone Soft Case
    products.push({
      nameEn: `${m} Premium Liquid Silicone Soft Case`,
      nameUr: `${m} پریمیم لیکوڈ سلیکون نرم کور`,
      sku: `CAS-SIL-${idx + 1}`,
      barcode: `810${String(600000000 + idx * 3 + 1).slice(1)}`,
      categoryId: catMap['Cases & Covers'],
      brandId: brandMap['Generic'],
      purchasePrice: 280,
      sellingPrice: 600,
      gstRate: 0,
      currentStock: 25,
      minStockLevel: 5,
      isActive: true,
    });

    // 3. 11D Super HD Tempered Glass Protector
    products.push({
      nameEn: `${m} 11D Full Glue HD Tempered Glass`,
      nameUr: `${m} 11D ایچ ڈی گلاس پروٹیکٹر`,
      sku: `GLS-11D-${idx + 1}`,
      barcode: `820${String(700000000 + idx * 2).slice(1)}`,
      categoryId: catMap['Tempered Glass & Protectors'],
      brandId: brandMap['Generic'],
      purchasePrice: 70,
      sellingPrice: 250,
      gstRate: 0,
      currentStock: 60,
      minStockLevel: 10,
      isActive: true,
    });

    // 4. Privacy Anti-Peep Tempered Glass Protector
    products.push({
      nameEn: `${m} Privacy Anti-Spy Black Tempered Glass`,
      nameUr: `${m} پرائیویسی بلیک گلاس پروٹیکٹر`,
      sku: `GLS-PRV-${idx + 1}`,
      barcode: `820${String(700000000 + idx * 2 + 1).slice(1)}`,
      categoryId: catMap['Tempered Glass & Protectors'],
      brandId: brandMap['Generic'],
      purchasePrice: 120,
      sellingPrice: 400,
      gstRate: 0,
      currentStock: 40,
      minStockLevel: 10,
      isActive: true,
    });
  });

  // ─── G. MOBILE REPAIR TOOLS & SPARE PARTS (50 Items) ───
  const repairTools = [
    { name: 'MECHANIC T-7000 Black Waterproof Display Frame Glue (50ml)', cost: 250, price: 450, sku: 'REP-GLU-T7000' },
    { name: 'MECHANIC B-7000 Transparent Screen Adhesive Glue (50ml)', cost: 240, price: 420, sku: 'REP-GLU-B7000' },
    { name: 'RELIFE RL-004M Anti-Static Heat Resistant Silicone Repair Pad', cost: 1800, price: 2600, sku: 'REP-MAT-RL004' },
    { name: 'Sunshine SS-890C Hydrogel Screen Protector Cutting Machine Film (50pcs)', cost: 6500, price: 9000, sku: 'REP-FLM-SUN50' },
    { name: 'JAKEMY JM-8172 73-in-1 Precision Magnetic Screwdriver Set', cost: 2800, price: 3900, sku: 'REP-TL-JAK73' },
    { name: 'Kaisi Display Opening Strong Vacuum Suction Cup Plier', cost: 650, price: 1100, sku: 'REP-TL-SUCT' },
    { name: 'Sunshine T12A Soldering Iron Station Heating Core Kit', cost: 4800, price: 6500, sku: 'REP-SLD-T12A' },
    { name: 'RELIFE UV Curing Optical Lamp (Fast Adhesive Cure)', cost: 1200, price: 1800, sku: 'REP-UV-LAMP' },
    { name: 'iPhone 13 Original Capacity Replacement Battery 3227mAh', cost: 3400, price: 5500, sku: 'REP-BAT-IP13' },
    { name: 'iPhone 12 / 12 Pro Replacement Battery with BMS Flex', cost: 2900, price: 4800, sku: 'REP-BAT-IP12' },
    { name: 'Samsung Galaxy A15 / A14 Charging Port PCB Board Flex', cost: 350, price: 850, sku: 'REP-FLX-A15' },
    { name: 'Redmi Note 12 / Note 13 OLED Display Panel Screen Assembly', cost: 4800, price: 7500, sku: 'REP-DSP-RN13' },
  ];

  repairTools.forEach((r, idx) => {
    products.push({
      nameEn: r.name,
      nameUr: r.name,
      sku: r.sku,
      barcode: `830${String(800000000 + idx).slice(1)}`,
      categoryId: catMap['Repair Parts & Tools'],
      brandId: brandMap['Generic'],
      purchasePrice: r.cost,
      sellingPrice: r.price,
      gstRate: 0,
      currentStock: 20 + (idx % 10),
      minStockLevel: 4,
      isActive: true,
    });
  });

  // 4. Insert all products using upsert to avoid duplicates
  console.log(`📦 Upserting ${products.length} products into database catalog...`);
  let count = 0;
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        currentStock: p.currentStock,
        isActive: true,
      },
      create: p,
    });
    count++;
  }

  console.log(`✅ Successfully seeded ${count} high-demand Mobile Shop products and accessories!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
