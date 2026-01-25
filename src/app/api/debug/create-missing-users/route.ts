import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hash } from 'bcryptjs';

// DEBUG ONLY - Remove after use
// POST /api/debug/create-missing-users - Create missing demo users
export async function POST() {
  try {
    const results: string[] = [];

    // Get existing tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Hash passwords
    const superAdminPassword = await hash('SuperAdmin123!', 12);
    const demoPassword = await hash('Demo1234!', 12);

    // Create Super Admin if not exists
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'admin@rafit.com' }
    });

    if (!existingSuperAdmin) {
      await prisma.user.create({
        data: {
          email: 'admin@rafit.com',
          passwordHash: superAdminPassword,
          name: 'Platform Admin',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        }
      });
      results.push('Created: admin@rafit.com (Super Admin)');
    } else {
      results.push('Already exists: admin@rafit.com');
    }

    // Create coach2 if not exists
    const existingCoach2 = await prisma.user.findUnique({
      where: { email: 'coach2@demo.com' }
    });

    if (!existingCoach2) {
      const coach2User = await prisma.user.create({
        data: {
          email: 'coach2@demo.com',
          passwordHash: demoPassword,
          name: 'יואב שמש',
          phone: '050-5678901',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        }
      });

      // Link to tenant as COACH
      await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: coach2User.id,
          role: 'COACH',
          isActive: true,
        }
      });
      results.push('Created: coach2@demo.com (Coach)');
    } else {
      results.push('Already exists: coach2@demo.com');
    }

    // Create accountant if not exists
    const existingAccountant = await prisma.user.findUnique({
      where: { email: 'accountant@demo.com' }
    });

    if (!existingAccountant) {
      const accountantUser = await prisma.user.create({
        data: {
          email: 'accountant@demo.com',
          passwordHash: demoPassword,
          name: 'שרה גולד',
          phone: '050-6789012',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        }
      });

      // Link to tenant as ACCOUNTANT
      await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: accountantUser.id,
          role: 'ACCOUNTANT',
          isActive: true,
        }
      });
      results.push('Created: accountant@demo.com (Accountant)');
    } else {
      results.push('Already exists: accountant@demo.com');
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error creating users:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
