import { PrismaClient, UserRole, ServiceType, DayOfWeek, LeadStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.notificationJob.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.classInstance.deleteMany();
  await prisma.classTemplate.deleteMany();
  await prisma.room.deleteMany();
  await prisma.service.deleteMany();
  await prisma.creditBalance.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.tenantUser.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create demo tenant
  console.log('🏢 Creating demo tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'סטודיו פלא',
      slug: 'studio-pela',
      email: 'info@studiopela.co.il',
      phone: '03-1234567',
      timezone: 'Asia/Jerusalem',
      currency: 'ILS',
      locale: 'he',
      settings: {
        branding: {
          primaryColor: '#1e40af',
          secondaryColor: '#f97316',
        },
        booking: {
          advanceBookingDays: 14,
          cancellationHours: 4,
          allowWaitlist: true,
          maxWaitlistSize: 10,
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          reminderHours: 2,
        },
      },
    },
  });

  // Create demo users
  console.log('👥 Creating demo users...');
  const passwordHash = await hash('Demo1234!', 12);

  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      passwordHash,
      name: 'יוסי כהן',
      phone: '050-1234567',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash,
      name: 'מיכל לוי',
      phone: '050-2345678',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const coachUser = await prisma.user.create({
    data: {
      email: 'coach@demo.com',
      passwordHash,
      name: 'דנה שמש',
      phone: '050-3456789',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const frontDeskUser = await prisma.user.create({
    data: {
      email: 'frontdesk@demo.com',
      passwordHash,
      name: 'נועה אברהם',
      phone: '050-4567890',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  // Create tenant users
  console.log('🔗 Linking users to tenant...');
  const ownerTenantUser = await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: ownerUser.id,
      role: UserRole.OWNER,
      isActive: true,
    },
  });

  const adminTenantUser = await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: adminUser.id,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const coachTenantUser = await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: coachUser.id,
      role: UserRole.COACH,
      isActive: true,
    },
  });

  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: frontDeskUser.id,
      role: UserRole.FRONT_DESK,
      isActive: true,
    },
  });

  // Create branch
  console.log('🏠 Creating branch...');
  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'סניף תל אביב',
      slug: 'tel-aviv',
      address: 'רחוב דיזנגוף 99',
      city: 'תל אביב',
      phone: '03-1234567',
      timezone: 'Asia/Jerusalem',
      isActive: true,
    },
  });

  // Create rooms
  console.log('🚪 Creating rooms...');
  const yogaRoom = await prisma.room.create({
    data: {
      branchId: branch.id,
      name: 'אולם יוגה',
      capacity: 20,
      description: 'אולם מרווח עם תאורה טבעית',
    },
  });

  const fitnessRoom = await prisma.room.create({
    data: {
      branchId: branch.id,
      name: 'אולם כושר',
      capacity: 15,
      description: 'אולם עם ציוד מלא',
    },
  });

  // Create staff profiles
  console.log('👨‍🏫 Creating staff profiles...');
  const coachProfile = await prisma.staffProfile.create({
    data: {
      tenantUserId: coachTenantUser.id,
      branchId: branch.id,
      title: 'מדריכת יוגה בכירה',
      bio: 'מדריכה מוסמכת עם 10 שנות ניסיון',
      specialties: ['יוגה', 'פילאטיס', 'מדיטציה'],
      certifications: ['RYT-500', 'פילאטיס מט'],
      hourlyRate: 150,
      color: '#8b5cf6',
      isPublic: true,
    },
  });

  // Create services
  console.log('💪 Creating services...');
  const yogaService = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'יוגה',
      description: 'שיעור יוגה מרגיע לכל הרמות',
      type: ServiceType.GROUP_CLASS,
      duration: 60,
      defaultCapacity: 20,
      color: '#8b5cf6',
      price: 60,
      creditCost: 1,
      isActive: true,
    },
  });

  const pilatesService = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'פילאטיס',
      description: 'אימון פילאטיס לחיזוק הליבה',
      type: ServiceType.GROUP_CLASS,
      duration: 55,
      defaultCapacity: 15,
      color: '#ec4899',
      price: 65,
      creditCost: 1,
      isActive: true,
    },
  });

  const hiitService = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'HIIT',
      description: 'אימון אינטרוולים בעצימות גבוהה',
      type: ServiceType.GROUP_CLASS,
      duration: 45,
      defaultCapacity: 15,
      color: '#ef4444',
      price: 55,
      creditCost: 1,
      isActive: true,
    },
  });

  const personalService = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'אימון אישי',
      description: 'אימון פרטני מותאם אישית',
      type: ServiceType.PERSONAL,
      duration: 60,
      defaultCapacity: 1,
      color: '#f59e0b',
      price: 200,
      creditCost: 3,
      isActive: true,
    },
  });

  // Create class templates
  console.log('📅 Creating class templates...');
  const yogaMorning = await prisma.classTemplate.create({
    data: {
      branchId: branch.id,
      serviceId: yogaService.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה בוקר',
      dayOfWeek: DayOfWeek.SUNDAY,
      startTime: '07:00',
      endTime: '08:00',
      capacity: 20,
      waitlistLimit: 5,
      isActive: true,
    },
  });

  await prisma.classTemplate.create({
    data: {
      branchId: branch.id,
      serviceId: yogaService.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה ערב',
      dayOfWeek: DayOfWeek.SUNDAY,
      startTime: '18:00',
      endTime: '19:00',
      capacity: 20,
      waitlistLimit: 5,
      isActive: true,
    },
  });

  await prisma.classTemplate.create({
    data: {
      branchId: branch.id,
      serviceId: pilatesService.id,
      coachId: coachProfile.id,
      roomId: fitnessRoom.id,
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '09:55',
      capacity: 15,
      waitlistLimit: 5,
      isActive: true,
    },
  });

  await prisma.classTemplate.create({
    data: {
      branchId: branch.id,
      serviceId: hiitService.id,
      coachId: coachProfile.id,
      roomId: fitnessRoom.id,
      dayOfWeek: DayOfWeek.TUESDAY,
      startTime: '10:00',
      endTime: '10:45',
      capacity: 15,
      waitlistLimit: 5,
      isActive: true,
    },
  });

  // Create membership plans
  console.log('💳 Creating membership plans...');
  const monthlyPlan = await prisma.membershipPlan.create({
    data: {
      tenantId: tenant.id,
      name: 'מנוי חודשי',
      description: 'גישה בלתי מוגבלת לכל השיעורים',
      type: 'SUBSCRIPTION',
      price: 350,
      billingCycle: 'monthly',
      isActive: true,
      isPublic: true,
      features: ['שיעורים ללא הגבלה', 'ביטול עד 4 שעות לפני', 'גישה לאפליקציה'],
    },
  });

  const punchCard = await prisma.membershipPlan.create({
    data: {
      tenantId: tenant.id,
      name: 'כרטיסייה 10 כניסות',
      description: '10 כניסות לשיעורים לבחירה',
      type: 'PUNCH_CARD',
      price: 500,
      sessions: 10,
      validDays: 90,
      isActive: true,
      isPublic: true,
      features: ['10 כניסות', 'בחירה חופשית', 'תקף 3 חודשים'],
    },
  });

  const trialPlan = await prisma.membershipPlan.create({
    data: {
      tenantId: tenant.id,
      name: 'ניסיון חינם',
      description: 'שיעור ניסיון ראשון ללא עלות',
      type: 'TRIAL',
      price: 0,
      sessions: 1,
      validDays: 14,
      isActive: true,
      isPublic: true,
      features: ['שיעור אחד חינם', 'ללא התחייבות'],
    },
  });

  // Create demo customers
  console.log('🧑‍🤝‍🧑 Creating demo customers...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer1@demo.com',
        firstName: 'רחל',
        lastName: 'דוידוביץ',
        phone: '050-5678901',
        leadStatus: LeadStatus.CONVERTED,
        marketingConsent: true,
        tags: ['VIP', 'יוגה'],
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer2@demo.com',
        firstName: 'אורי',
        lastName: 'כהן',
        phone: '050-6789012',
        leadStatus: LeadStatus.CONVERTED,
        marketingConsent: true,
        tags: ['פילאטיס'],
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer3@demo.com',
        firstName: 'יעל',
        lastName: 'אברהם',
        phone: '050-7890123',
        leadStatus: LeadStatus.TRIAL,
        marketingConsent: false,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'lead1@demo.com',
        firstName: 'דני',
        lastName: 'לוי',
        phone: '050-8901234',
        leadStatus: LeadStatus.NEW,
        source: 'אתר',
      },
    }),
  ]);

  // Create memberships
  console.log('📋 Creating memberships...');
  await prisma.membership.create({
    data: {
      customerId: customers[0].id,
      planId: monthlyPlan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      autoRenew: true,
    },
  });

  await prisma.membership.create({
    data: {
      customerId: customers[1].id,
      planId: punchCard.id,
      status: 'ACTIVE',
      startDate: new Date(),
      sessionsRemaining: 8,
      autoRenew: false,
    },
  });

  await prisma.membership.create({
    data: {
      customerId: customers[2].id,
      planId: trialPlan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      sessionsRemaining: 1,
      autoRenew: false,
    },
  });

  // Create a class instance for today
  console.log('📆 Creating today\'s classes...');
  const today = new Date();
  today.setHours(7, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(8, 0, 0, 0);

  const todayClass = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      templateId: yogaMorning.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה בוקר',
      description: 'שיעור יוגה מרגיע לכל הרמות',
      startTime: today,
      endTime: todayEnd,
      capacity: 20,
      waitlistLimit: 5,
    },
  });

  // Create some bookings
  console.log('📝 Creating bookings...');
  await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      classInstanceId: todayClass.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });

  await prisma.booking.create({
    data: {
      customerId: customers[1].id,
      classInstanceId: todayClass.id,
      status: 'CONFIRMED',
      source: 'admin',
    },
  });

  // Create audit log
  console.log('📜 Creating initial audit log...');
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: ownerUser.id,
      action: 'tenant.create',
      entityType: 'tenant',
      entityId: tenant.id,
      newValues: { name: tenant.name },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📧 Demo accounts:');
  console.log('   Owner:     owner@demo.com / Demo1234!');
  console.log('   Admin:     admin@demo.com / Demo1234!');
  console.log('   Coach:     coach@demo.com / Demo1234!');
  console.log('   FrontDesk: frontdesk@demo.com / Demo1234!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
