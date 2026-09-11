// server/src/bootstrapTenants.js — Startup Tenant Data Migration & Safeguard
import bcrypt from 'bcryptjs';
import { prisma } from './config/database.js';
import { logger } from './utils/logger.js';

export async function bootstrapTenants() {
  try {
    // 1. Super Admin Account: Hassan@009
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

    // 2. Safeguard Muhammad Usman Account
    let usman = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { contains: 'usman', mode: 'insensitive' } },
          { fullName: { contains: 'usman', mode: 'insensitive' } },
        ],
      },
    });

    if (!usman) {
      const usmanPass = await bcrypt.hash('123456', 12);
      usman = await prisma.user.create({
        data: {
          username: 'usman',
          fullName: 'Muhammad Usman',
          passwordHash: usmanPass,
          role: 'ADMIN',
          status: 'ACTIVE',
          phone: '+92-300-1112233',
        },
      });

      // Give Usman a lifetime license
      await prisma.license.create({
        data: {
          licenseKey: 'HT-LIFETIME-USMAN-001',
          shopName: 'Usman Mobile Communication',
          ownerName: 'Muhammad Usman',
          duration: 'LIFETIME',
          status: 'ACTIVE',
          userId: usman.id,
          notes: 'Permanent Client Account',
        },
      });
    }

    // 3. Migrate all existing unassigned Products, Customers & Suppliers to Muhammad Usman
    const usmanUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'usman', mode: 'insensitive' } },
          { fullName: { contains: 'usman', mode: 'insensitive' } },
        ],
      },
    });
    const targetUsmanId = usman?.id || usmanUsers[0]?.id;

    if (targetUsmanId) {
      const unassignedProducts = await prisma.product.count({ where: { userId: null } });
      if (unassignedProducts > 0) {
        await prisma.product.updateMany({
          where: { userId: null },
          data: { userId: targetUsmanId },
        });
        logger.info(`Safeguarded ${unassignedProducts} existing products for Muhammad Usman`);
      }

      await prisma.customer.updateMany({
        where: { userId: null },
        data: { userId: targetUsmanId },
      });
      await prisma.supplier.updateMany({
        where: { userId: null },
        data: { userId: targetUsmanId },
      });
    }

    // 4. Remove test 'Ali Khan' from polluting client shops
    await prisma.customer.deleteMany({
      where: {
        OR: [
          { phone: '03001234567' },
          { name: { contains: 'Ali Khan', mode: 'insensitive' } },
        ],
      },
    });

    logger.info('Tenant data isolation & Muhammad Usman data preservation initialized successfully.');
  } catch (err) {
    logger.warn('Bootstrap tenants note: ' + err.message);
  }
}
