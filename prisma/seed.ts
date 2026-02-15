import { PrismaClient, UserRole, ServiceType, DayOfWeek, LeadStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.task.deleteMany();
  await prisma.leadActivity.deleteMany();
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
  await prisma.customerInvitation.deleteMany();
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

  // Create Super Admin user
  console.log('🛡️ Creating Super Admin user...');
  const superAdminPasswordHash = await hash('SuperAdmin123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@rafit.com' },
    update: { isSuperAdmin: true },
    create: {
      email: 'admin@rafit.com',
      passwordHash: superAdminPasswordHash,
      name: 'Platform Admin',
      isSuperAdmin: true,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
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

  const coach2User = await prisma.user.create({
    data: {
      email: 'coach2@demo.com',
      passwordHash,
      name: 'יואב שמש',
      phone: '050-5678901',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      email: 'accountant@demo.com',
      passwordHash,
      name: 'שרה גולד',
      phone: '050-6789012',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const networkUser = await prisma.user.create({
    data: {
      email: 'network@demo.com',
      passwordHash,
      name: 'אלון ברק',
      phone: '050-7777777',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@demo.com',
      passwordHash,
      name: 'רון כהן',
      phone: '050-9999999',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const coach3User = await prisma.user.create({
    data: {
      email: 'coach3@demo.com',
      passwordHash,
      name: 'ליאת ארז',
      phone: '050-8888888',
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
      role: UserRole.NETWORK_MANAGER,
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

  const coach2TenantUser = await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: coach2User.id,
      role: UserRole.COACH,
      isActive: true,
    },
  });

  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: accountantUser.id,
      role: UserRole.ACCOUNTANT,
      isActive: true,
    },
  });

  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: networkUser.id,
      role: UserRole.NETWORK_MANAGER,
      isActive: true,
    },
  });

  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: managerUser.id,
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  const coach3TenantUser = await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: coach3User.id,
      role: UserRole.COACH,
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

  // Create Jerusalem branch
  console.log('🏠 Creating Jerusalem branch...');
  const jlmBranch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'סניף ירושלים',
      slug: 'jerusalem',
      address: 'רחוב יפו 15',
      city: 'ירושלים',
      phone: '02-1234567',
      timezone: 'Asia/Jerusalem',
      isActive: true,
    },
  });

  const jlmYogaRoom = await prisma.room.create({
    data: {
      branchId: jlmBranch.id,
      name: 'אולם שלווה',
      capacity: 18,
      description: 'אולם יוגה שקט ומרווח',
    },
  });

  const jlmEnergyRoom = await prisma.room.create({
    data: {
      branchId: jlmBranch.id,
      name: 'אולם אנרגיה',
      capacity: 12,
      description: 'אולם לאימונים אינטנסיביים',
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

  const coach2Profile = await prisma.staffProfile.create({
    data: {
      tenantUserId: coach2TenantUser.id,
      branchId: branch.id,
      title: 'מאמן HIIT',
      bio: 'מאמן כושר מוסמך עם התמחות באימוני HIIT ופונקציונלי',
      specialties: ['HIIT', 'כושר פונקציונלי', 'TRX'],
      certifications: ['מאמן כושר מוסמך', 'TRX Level 2'],
      hourlyRate: 120,
      color: '#ef4444',
      isPublic: true,
    },
  });

  const coach3Profile = await prisma.staffProfile.create({
    data: {
      tenantUserId: coach3TenantUser.id,
      branchId: jlmBranch.id,
      title: 'מדריכת יוגה ופילאטיס',
      bio: 'מדריכה מוסמכת עם התמחות ביוגה טיפולית',
      specialties: ['יוגה', 'פילאטיס', 'יוגה טיפולית'],
      certifications: ['RYT-200', 'פילאטיס מכשירים'],
      hourlyRate: 130,
      color: '#10b981',
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

  // Create portal customer user (linked to customer record below)
  console.log('🔑 Creating portal demo customer user...');
  const portalCustomerUser = await prisma.user.create({
    data: {
      email: 'customer1@demo.com',
      passwordHash,
      name: 'רחל דוידוביץ',
      phone: '050-5678901',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  // Create demo customers
  console.log('🧑‍🤝‍🧑 Creating demo customers...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        userId: portalCustomerUser.id,
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
        dateOfBirth: new Date(Date.UTC(1990, new Date().getMonth(), new Date().getDate(), 12, 0, 0)), // Birthday today for demo (noon UTC to avoid timezone day-shift)
        leadStatus: LeadStatus.CONVERTED,
        marketingConsent: true,
        medicalNotes: 'בעיות ברכיים - להימנע מקפיצות ותרגילי אימפקט גבוה',
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
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer5@demo.com',
        firstName: 'מיכל',
        lastName: 'רוזן',
        phone: '050-1111111',
        dateOfBirth: new Date(Date.UTC(1985, 5, 15, 12, 0, 0)),
        leadStatus: LeadStatus.CONVERTED,
        marketingConsent: true,
        medicalNotes: 'אסתמה - משאף תמיד זמין. יש ליידע במקרה של קוצר נשימה',
        tags: ['HIIT', 'VIP'],
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer6@demo.com',
        firstName: 'אבי',
        lastName: 'פרידמן',
        phone: '050-2222222',
        leadStatus: LeadStatus.CONVERTED,
        marketingConsent: true,
        tags: ['יוגה'],
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer7@demo.com',
        firstName: 'שירה',
        lastName: 'בן דוד',
        phone: '050-3333333',
        leadStatus: LeadStatus.CONVERTED,
        marketingConsent: false,
        tags: ['פילאטיס', 'יוגה'],
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer8@demo.com',
        firstName: 'תומר',
        lastName: 'שפירא',
        phone: '050-4444444',
        dateOfBirth: new Date(Date.UTC(1992, 10, 3, 12, 0, 0)),
        leadStatus: LeadStatus.CONVERTED,
        marketingConsent: true,
        medicalNotes: 'פריצת דיסק L4-L5 - להימנע מהרמות כבדות וכפיפות גב',
        tags: ['HIIT'],
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer9@demo.com',
        firstName: 'נעמה',
        lastName: 'וינברג',
        phone: '050-5555555',
        leadStatus: LeadStatus.QUALIFIED,
        marketingConsent: true,
        source: 'חבר מביא חבר',
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: 'customer10@demo.com',
        firstName: 'גיל',
        lastName: 'מזרחי',
        phone: '050-6666666',
        leadStatus: LeadStatus.CONVERTED,
        marketingConsent: true,
        tags: ['אימון אישי'],
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

  // Create class instances for the full week (Sun-Thu)
  console.log('📆 Creating classes for the full week...');
  const now = new Date();

  // Helper to create date at specific hour
  const createDateTime = (daysOffset: number, hour: number, minute: number = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  // === Tel Aviv branch schedule ===

  // Sunday (day 0)
  const tlvSunYoga = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      templateId: yogaMorning.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה בוקר',
      description: 'שיעור יוגה מרגיע לכל הרמות',
      startTime: createDateTime(0, 7, 0),
      endTime: createDateTime(0, 8, 0),
      capacity: 20,
      waitlistLimit: 5,
    },
  });

  const tlvSunPilates = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: fitnessRoom.id,
      name: 'פילאטיס',
      description: 'אימון פילאטיס לחיזוק הליבה',
      startTime: createDateTime(0, 9, 0),
      endTime: createDateTime(0, 9, 55),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  const tlvSunHiit = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coach2Profile.id,
      roomId: fitnessRoom.id,
      name: 'HIIT',
      description: 'אימון אינטרוולים בעצימות גבוהה',
      startTime: createDateTime(0, 10, 30),
      endTime: createDateTime(0, 11, 15),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  const tlvSunYogaEve = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה ערב',
      description: 'שיעור יוגה מרגיע לסיום היום',
      startTime: createDateTime(0, 18, 0),
      endTime: createDateTime(0, 19, 0),
      capacity: 20,
      waitlistLimit: 5,
    },
  });

  // Monday (day 1)
  const tlvMonYoga = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(1, 7, 0),
      endTime: createDateTime(1, 8, 0),
      capacity: 20,
      waitlistLimit: 5,
    },
  });

  const tlvMonPilates = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: fitnessRoom.id,
      name: 'פילאטיס',
      startTime: createDateTime(1, 9, 0),
      endTime: createDateTime(1, 9, 55),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  const tlvMonHiit = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coach2Profile.id,
      roomId: fitnessRoom.id,
      name: 'HIIT',
      startTime: createDateTime(1, 17, 0),
      endTime: createDateTime(1, 17, 45),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  // Tuesday (day 2)
  const tlvTueYoga = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(2, 7, 0),
      endTime: createDateTime(2, 8, 0),
      capacity: 20,
      waitlistLimit: 5,
    },
  });

  const tlvTueHiit = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coach2Profile.id,
      roomId: fitnessRoom.id,
      name: 'HIIT',
      startTime: createDateTime(2, 10, 0),
      endTime: createDateTime(2, 10, 45),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  const tlvTuePilates = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: fitnessRoom.id,
      name: 'פילאטיס ערב',
      startTime: createDateTime(2, 18, 0),
      endTime: createDateTime(2, 18, 55),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  // Wednesday (day 3)
  const tlvWedYoga = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(3, 7, 0),
      endTime: createDateTime(3, 8, 0),
      capacity: 20,
      waitlistLimit: 5,
    },
  });

  const tlvWedPilates = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: fitnessRoom.id,
      name: 'פילאטיס',
      startTime: createDateTime(3, 9, 0),
      endTime: createDateTime(3, 9, 55),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  const tlvWedHiit = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coach2Profile.id,
      roomId: fitnessRoom.id,
      name: 'HIIT',
      startTime: createDateTime(3, 17, 0),
      endTime: createDateTime(3, 17, 45),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  const tlvWedYogaEve = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה ערב',
      startTime: createDateTime(3, 19, 0),
      endTime: createDateTime(3, 20, 0),
      capacity: 20,
      waitlistLimit: 5,
    },
  });

  // Thursday (day 4)
  const tlvThuYoga = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coachProfile.id,
      roomId: yogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(4, 7, 0),
      endTime: createDateTime(4, 8, 0),
      capacity: 20,
      waitlistLimit: 5,
    },
  });

  const tlvThuHiit = await prisma.classInstance.create({
    data: {
      branchId: branch.id,
      coachId: coach2Profile.id,
      roomId: fitnessRoom.id,
      name: 'HIIT',
      startTime: createDateTime(4, 10, 0),
      endTime: createDateTime(4, 10, 45),
      capacity: 15,
      waitlistLimit: 5,
    },
  });

  // === Jerusalem branch schedule ===

  // Sunday (day 0)
  const jlmSunYoga = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach3Profile.id,
      roomId: jlmYogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(0, 8, 0),
      endTime: createDateTime(0, 9, 0),
      capacity: 18,
      waitlistLimit: 5,
    },
  });

  const jlmSunPilates = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach3Profile.id,
      roomId: jlmYogaRoom.id,
      name: 'פילאטיס',
      startTime: createDateTime(0, 10, 0),
      endTime: createDateTime(0, 10, 55),
      capacity: 18,
      waitlistLimit: 5,
    },
  });

  const jlmSunHiit = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach2Profile.id,
      roomId: jlmEnergyRoom.id,
      name: 'HIIT',
      startTime: createDateTime(0, 17, 0),
      endTime: createDateTime(0, 17, 45),
      capacity: 12,
      waitlistLimit: 3,
    },
  });

  // Monday (day 1)
  const jlmMonYoga = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach3Profile.id,
      roomId: jlmYogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(1, 8, 0),
      endTime: createDateTime(1, 9, 0),
      capacity: 18,
      waitlistLimit: 5,
    },
  });

  const jlmMonPilates = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach3Profile.id,
      roomId: jlmYogaRoom.id,
      name: 'פילאטיס ערב',
      startTime: createDateTime(1, 18, 0),
      endTime: createDateTime(1, 18, 55),
      capacity: 18,
      waitlistLimit: 5,
    },
  });

  // Tuesday (day 2)
  const jlmTueYoga = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach3Profile.id,
      roomId: jlmYogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(2, 8, 0),
      endTime: createDateTime(2, 9, 0),
      capacity: 18,
      waitlistLimit: 5,
    },
  });

  const jlmTueHiit = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach2Profile.id,
      roomId: jlmEnergyRoom.id,
      name: 'HIIT',
      startTime: createDateTime(2, 17, 0),
      endTime: createDateTime(2, 17, 45),
      capacity: 12,
      waitlistLimit: 3,
    },
  });

  // Wednesday (day 3)
  const jlmWedYoga = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach3Profile.id,
      roomId: jlmYogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(3, 8, 0),
      endTime: createDateTime(3, 9, 0),
      capacity: 18,
      waitlistLimit: 5,
    },
  });

  const jlmWedPilates = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach3Profile.id,
      roomId: jlmYogaRoom.id,
      name: 'פילאטיס',
      startTime: createDateTime(3, 10, 0),
      endTime: createDateTime(3, 10, 55),
      capacity: 18,
      waitlistLimit: 5,
    },
  });

  // Thursday (day 4)
  const jlmThuYoga = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach3Profile.id,
      roomId: jlmYogaRoom.id,
      name: 'יוגה בוקר',
      startTime: createDateTime(4, 8, 0),
      endTime: createDateTime(4, 9, 0),
      capacity: 18,
      waitlistLimit: 5,
    },
  });

  const jlmThuHiit = await prisma.classInstance.create({
    data: {
      branchId: jlmBranch.id,
      coachId: coach2Profile.id,
      roomId: jlmEnergyRoom.id,
      name: 'HIIT',
      startTime: createDateTime(4, 17, 0),
      endTime: createDateTime(4, 17, 45),
      capacity: 12,
      waitlistLimit: 3,
    },
  });

  // Create bookings with various statuses (~35 total)
  console.log('📝 Creating bookings...');

  // === Sunday Tel Aviv bookings ===
  // Yoga morning - confirmed with check-ins
  await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      classInstanceId: tlvSunYoga.id,
      status: 'CONFIRMED',
      checkedInAt: createDateTime(0, 6, 55),
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[1].id,
      classInstanceId: tlvSunYoga.id,
      status: 'CONFIRMED',
      checkedInAt: createDateTime(0, 6, 58),
      source: 'admin',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[5].id,
      classInstanceId: tlvSunYoga.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[6].id,
      classInstanceId: tlvSunYoga.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });

  // Pilates Sunday
  await prisma.booking.create({
    data: {
      customerId: customers[1].id,
      classInstanceId: tlvSunPilates.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[6].id,
      classInstanceId: tlvSunPilates.id,
      status: 'CONFIRMED',
      source: 'app',
    },
  });

  // HIIT Sunday
  await prisma.booking.create({
    data: {
      customerId: customers[4].id,
      classInstanceId: tlvSunHiit.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[7].id,
      classInstanceId: tlvSunHiit.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  // Waitlisted for HIIT
  await prisma.booking.create({
    data: {
      customerId: customers[9].id,
      classInstanceId: tlvSunHiit.id,
      status: 'WAITLISTED',
      waitlistPosition: 1,
      source: 'app',
    },
  });

  // Evening yoga Sunday
  await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      classInstanceId: tlvSunYogaEve.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[2].id,
      classInstanceId: tlvSunYogaEve.id,
      status: 'CONFIRMED',
      source: 'admin',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[5].id,
      classInstanceId: tlvSunYogaEve.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });

  // === Monday Tel Aviv bookings ===
  await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      classInstanceId: tlvMonYoga.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[6].id,
      classInstanceId: tlvMonPilates.id,
      status: 'CONFIRMED',
      source: 'app',
    },
  });
  // Cancelled booking
  await prisma.booking.create({
    data: {
      customerId: customers[1].id,
      classInstanceId: tlvMonPilates.id,
      status: 'CANCELLED',
      cancelledAt: createDateTime(0, 14, 0),
      cancelReason: 'שינוי תוכניות',
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[4].id,
      classInstanceId: tlvMonHiit.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });

  // === Tuesday Tel Aviv bookings ===
  await prisma.booking.create({
    data: {
      customerId: customers[5].id,
      classInstanceId: tlvTueYoga.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  // No-show
  await prisma.booking.create({
    data: {
      customerId: customers[8].id,
      classInstanceId: tlvTueHiit.id,
      status: 'NO_SHOW',
      noShowAt: createDateTime(2, 10, 50),
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[7].id,
      classInstanceId: tlvTueHiit.id,
      status: 'CONFIRMED',
      source: 'app',
    },
  });
  // Completed booking (past class)
  await prisma.booking.create({
    data: {
      customerId: customers[1].id,
      classInstanceId: tlvTuePilates.id,
      status: 'COMPLETED',
      checkedInAt: createDateTime(2, 17, 55),
      source: 'web',
    },
  });

  // === Wednesday Tel Aviv bookings ===
  await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      classInstanceId: tlvWedYoga.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[6].id,
      classInstanceId: tlvWedPilates.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  // Cancelled
  await prisma.booking.create({
    data: {
      customerId: customers[4].id,
      classInstanceId: tlvWedHiit.id,
      status: 'CANCELLED',
      cancelledAt: createDateTime(2, 20, 0),
      cancelReason: 'לא מרגיש טוב',
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[7].id,
      classInstanceId: tlvWedHiit.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  // Waitlisted for evening yoga
  await prisma.booking.create({
    data: {
      customerId: customers[9].id,
      classInstanceId: tlvWedYogaEve.id,
      status: 'WAITLISTED',
      waitlistPosition: 1,
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      classInstanceId: tlvWedYogaEve.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });

  // === Thursday Tel Aviv bookings ===
  await prisma.booking.create({
    data: {
      customerId: customers[5].id,
      classInstanceId: tlvThuYoga.id,
      status: 'CONFIRMED',
      source: 'app',
    },
  });
  // No-show
  await prisma.booking.create({
    data: {
      customerId: customers[2].id,
      classInstanceId: tlvThuYoga.id,
      status: 'NO_SHOW',
      noShowAt: createDateTime(4, 8, 5),
      source: 'admin',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[4].id,
      classInstanceId: tlvThuHiit.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });

  // === Jerusalem branch bookings ===
  // Sunday
  await prisma.booking.create({
    data: {
      customerId: customers[6].id,
      classInstanceId: jlmSunYoga.id,
      status: 'COMPLETED',
      checkedInAt: createDateTime(0, 7, 55),
      source: 'web',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[1].id,
      classInstanceId: jlmSunPilates.id,
      status: 'COMPLETED',
      checkedInAt: createDateTime(0, 9, 50),
      source: 'app',
    },
  });
  await prisma.booking.create({
    data: {
      customerId: customers[7].id,
      classInstanceId: jlmSunHiit.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });

  // Monday Jerusalem
  await prisma.booking.create({
    data: {
      customerId: customers[5].id,
      classInstanceId: jlmMonYoga.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });
  // Cancelled
  await prisma.booking.create({
    data: {
      customerId: customers[9].id,
      classInstanceId: jlmMonPilates.id,
      status: 'CANCELLED',
      cancelledAt: createDateTime(1, 12, 0),
      cancelReason: 'התנגשות בלוח זמנים',
      source: 'web',
    },
  });

  // Tuesday Jerusalem
  await prisma.booking.create({
    data: {
      customerId: customers[0].id,
      classInstanceId: jlmTueYoga.id,
      status: 'CONFIRMED',
      source: 'app',
    },
  });
  // Waitlisted
  await prisma.booking.create({
    data: {
      customerId: customers[8].id,
      classInstanceId: jlmTueHiit.id,
      status: 'WAITLISTED',
      waitlistPosition: 2,
      source: 'web',
    },
  });

  // Wednesday Jerusalem
  await prisma.booking.create({
    data: {
      customerId: customers[6].id,
      classInstanceId: jlmWedYoga.id,
      status: 'CONFIRMED',
      source: 'web',
    },
  });

  // Thursday Jerusalem - completed
  await prisma.booking.create({
    data: {
      customerId: customers[5].id,
      classInstanceId: jlmThuYoga.id,
      status: 'COMPLETED',
      checkedInAt: createDateTime(4, 7, 50),
      source: 'web',
    },
  });

  // Create payments (~10 total)
  console.log('💰 Creating payments...');
  await prisma.payment.create({
    data: {
      customerId: customers[0].id,
      amount: 350,
      currency: 'ILS',
      status: 'COMPLETED',
      description: 'מנוי חודשי',
      createdAt: createDateTime(-5, 10, 0),
    },
  });

  await prisma.payment.create({
    data: {
      customerId: customers[1].id,
      amount: 500,
      currency: 'ILS',
      status: 'COMPLETED',
      description: 'כרטיסייה 10 כניסות',
      createdAt: createDateTime(-3, 14, 30),
    },
  });

  await prisma.payment.create({
    data: {
      customerId: customers[4].id,
      amount: 350,
      currency: 'ILS',
      status: 'COMPLETED',
      description: 'מנוי חודשי',
      createdAt: createDateTime(-1, 11, 0),
    },
  });

  await prisma.payment.create({
    data: {
      customerId: customers[9].id,
      amount: 200,
      currency: 'ILS',
      status: 'COMPLETED',
      description: 'אימון אישי',
      createdAt: createDateTime(0, 8, 30),
    },
  });

  await prisma.payment.create({
    data: {
      customerId: customers[7].id,
      amount: 350,
      currency: 'ILS',
      status: 'PENDING',
      description: 'מנוי חודשי - ממתין לאישור',
    },
  });

  await prisma.payment.create({
    data: {
      customerId: customers[8].id,
      amount: 500,
      currency: 'ILS',
      status: 'PENDING',
      description: 'כרטיסייה 10 כניסות',
    },
  });

  await prisma.payment.create({
    data: {
      customerId: customers[5].id,
      amount: 350,
      currency: 'ILS',
      status: 'COMPLETED',
      description: 'מנוי חודשי',
      createdAt: createDateTime(-2, 9, 0),
    },
  });

  await prisma.payment.create({
    data: {
      customerId: customers[6].id,
      amount: 60,
      currency: 'ILS',
      status: 'COMPLETED',
      description: 'יוגה - שיעור בודד',
      createdAt: createDateTime(-1, 8, 0),
    },
  });

  // Failed payment
  await prisma.payment.create({
    data: {
      customerId: customers[3].id,
      amount: 350,
      currency: 'ILS',
      status: 'FAILED',
      description: 'מנוי חודשי - כרטיס נדחה',
      createdAt: createDateTime(-1, 15, 0),
    },
  });

  // Refunded payment
  await prisma.payment.create({
    data: {
      customerId: customers[1].id,
      amount: 65,
      currency: 'ILS',
      status: 'REFUNDED',
      description: 'פילאטיס - שיעור בוטל',
      refundedAmount: 65,
      refundReason: 'שיעור בוטל על ידי הסטודיו',
      createdAt: createDateTime(-4, 11, 0),
    },
  });

  // Create audit logs for recent activity
  console.log('📜 Creating audit logs...');

  // Create activity logs
  const auditLogs = [
    {
      tenantId: tenant.id,
      userId: ownerUser.id,
      action: 'tenant.create',
      entityType: 'tenant',
      entityId: tenant.id,
      newValues: { name: tenant.name },
      createdAt: createDateTime(-7, 9, 0),
    },
    {
      tenantId: tenant.id,
      userId: networkUser.id,
      action: 'branch.create',
      entityType: 'branch',
      entityId: jlmBranch.id,
      newValues: { name: 'סניף ירושלים', city: 'ירושלים' },
      createdAt: createDateTime(-6, 10, 0),
    },
    {
      tenantId: tenant.id,
      userId: frontDeskUser.id,
      action: 'booking.create',
      entityType: 'booking',
      newValues: { customerName: 'רחל דוידוביץ', className: 'יוגה בוקר' },
      createdAt: createDateTime(-1, 18, 30),
    },
    {
      tenantId: tenant.id,
      userId: frontDeskUser.id,
      action: 'booking.create',
      entityType: 'booking',
      newValues: { customerName: 'אורי כהן', className: 'פילאטיס' },
      createdAt: createDateTime(-1, 19, 15),
    },
    {
      tenantId: tenant.id,
      userId: adminUser.id,
      action: 'customer.create',
      entityType: 'customer',
      newValues: { firstName: 'נעמה', lastName: 'וינברג' },
      createdAt: createDateTime(0, 8, 0),
    },
    {
      tenantId: tenant.id,
      userId: frontDeskUser.id,
      action: 'booking.checkin',
      entityType: 'booking',
      newValues: { customerName: 'רחל דוידוביץ' },
      createdAt: createDateTime(0, 6, 55),
    },
    {
      tenantId: tenant.id,
      userId: frontDeskUser.id,
      action: 'booking.checkin',
      entityType: 'booking',
      newValues: { customerName: 'אורי כהן' },
      createdAt: createDateTime(0, 6, 58),
    },
    {
      tenantId: tenant.id,
      userId: adminUser.id,
      action: 'membership.create',
      entityType: 'membership',
      newValues: { customerName: 'גיל מזרחי', planName: 'מנוי חודשי' },
      createdAt: createDateTime(0, 9, 30),
    },
    {
      tenantId: tenant.id,
      userId: frontDeskUser.id,
      action: 'payment.create',
      entityType: 'payment',
      newValues: { amount: 200, customerName: 'גיל מזרחי' },
      createdAt: createDateTime(0, 8, 30),
    },
    {
      tenantId: tenant.id,
      userId: frontDeskUser.id,
      action: 'booking.create',
      entityType: 'booking',
      newValues: { customerName: 'מיכל רוזן', className: 'HIIT' },
      createdAt: createDateTime(0, 7, 45),
    },
    {
      tenantId: tenant.id,
      userId: coachUser.id,
      action: 'user.login',
      createdAt: createDateTime(0, 6, 30),
    },
    {
      tenantId: tenant.id,
      userId: networkUser.id,
      action: 'user.login',
      createdAt: createDateTime(0, 8, 15),
    },
    {
      tenantId: tenant.id,
      userId: coach3User.id,
      action: 'user.login',
      createdAt: createDateTime(0, 7, 30),
    },
    {
      tenantId: tenant.id,
      userId: networkUser.id,
      action: 'branch.update',
      entityType: 'branch',
      entityId: jlmBranch.id,
      newValues: { action: 'עדכון לוח שיעורים ירושלים' },
      createdAt: createDateTime(-2, 14, 0),
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log as any });
  }

  // Create additional leads for pipeline demo
  console.log('🎯 Creating additional leads...');
  const lead2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      email: 'lead2@demo.com',
      firstName: 'ענבל',
      lastName: 'שושן',
      phone: '050-9012345',
      leadStatus: LeadStatus.CONTACTED,
      source: 'אינסטגרם',
      marketingConsent: true,
    },
  });

  const lead3 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      email: 'lead3@demo.com',
      firstName: 'רועי',
      lastName: 'אלון',
      phone: '050-0123456',
      leadStatus: LeadStatus.LOST,
      source: 'גוגל',
      notes: 'חיפש שיעורי יוגה, בחר סטודיו אחר בגלל מחיר',
    },
  });

  const lead4 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      email: 'lead4@demo.com',
      firstName: 'הילה',
      lastName: 'פישר',
      phone: '050-1122334',
      leadStatus: LeadStatus.NEW,
      source: 'פייסבוק',
    },
  });

  // Create lead activities for existing and new leads
  console.log('📋 Creating lead activities...');
  const leadActivities = [
    // דני לוי (NEW lead - customers[3])
    {
      customerId: customers[3].id,
      tenantId: tenant.id,
      type: 'NOTE' as const,
      description: 'ליד חדש מהאתר, התעניין בשיעורי יוגה',
      createdBy: frontDeskUser.id,
      createdAt: createDateTime(-3, 10, 0),
    },
    // נעמה וינברג (QUALIFIED - customers[8])
    {
      customerId: customers[8].id,
      tenantId: tenant.id,
      type: 'NOTE' as const,
      description: 'ליד חדש - הגיעה דרך חבר מביא חבר',
      createdBy: frontDeskUser.id,
      createdAt: createDateTime(-7, 9, 0),
    },
    {
      customerId: customers[8].id,
      tenantId: tenant.id,
      type: 'CALL' as const,
      description: 'שיחת היכרות - מתעניינת בפילאטיס, מגיעה לשיעור ניסיון',
      createdBy: adminUser.id,
      createdAt: createDateTime(-5, 14, 0),
    },
    {
      customerId: customers[8].id,
      tenantId: tenant.id,
      type: 'STATUS_CHANGE' as const,
      description: 'שינוי סטטוס מ-NEW ל-CONTACTED',
      createdBy: adminUser.id,
      createdAt: createDateTime(-5, 14, 5),
    },
    {
      customerId: customers[8].id,
      tenantId: tenant.id,
      type: 'STATUS_CHANGE' as const,
      description: 'שינוי סטטוס מ-CONTACTED ל-QUALIFIED',
      createdBy: adminUser.id,
      createdAt: createDateTime(-2, 11, 0),
    },
    // יעל אברהם (TRIAL - customers[2])
    {
      customerId: customers[2].id,
      tenantId: tenant.id,
      type: 'STATUS_CHANGE' as const,
      description: 'שינוי סטטוס מ-NEW ל-TRIAL',
      createdBy: frontDeskUser.id,
      createdAt: createDateTime(-4, 16, 0),
    },
    {
      customerId: customers[2].id,
      tenantId: tenant.id,
      type: 'NOTE' as const,
      description: 'הגיעה לשיעור ניסיון יוגה ערב, התלהבה מאוד',
      createdBy: coachUser.id,
      createdAt: createDateTime(-3, 19, 30),
    },
    // ענבל שושן (CONTACTED)
    {
      customerId: lead2.id,
      tenantId: tenant.id,
      type: 'NOTE' as const,
      description: 'פנתה דרך אינסטגרם, שואלת על מחירים',
      createdBy: frontDeskUser.id,
      createdAt: createDateTime(-2, 11, 0),
    },
    {
      customerId: lead2.id,
      tenantId: tenant.id,
      type: 'EMAIL' as const,
      description: 'נשלח מייל עם מחירון ופרטי שיעור ניסיון',
      createdBy: adminUser.id,
      createdAt: createDateTime(-1, 9, 0),
    },
    {
      customerId: lead2.id,
      tenantId: tenant.id,
      type: 'STATUS_CHANGE' as const,
      description: 'שינוי סטטוס מ-NEW ל-CONTACTED',
      createdBy: adminUser.id,
      createdAt: createDateTime(-1, 9, 5),
    },
    // רועי אלון (LOST)
    {
      customerId: lead3.id,
      tenantId: tenant.id,
      type: 'CALL' as const,
      description: 'שיחת היכרות - מתעניין ביוגה, משווה מחירים',
      createdBy: frontDeskUser.id,
      createdAt: createDateTime(-10, 11, 0),
    },
    {
      customerId: lead3.id,
      tenantId: tenant.id,
      type: 'STATUS_CHANGE' as const,
      description: 'שינוי סטטוס מ-NEW ל-CONTACTED',
      createdBy: frontDeskUser.id,
      createdAt: createDateTime(-10, 11, 5),
    },
    {
      customerId: lead3.id,
      tenantId: tenant.id,
      type: 'STATUS_CHANGE' as const,
      description: 'שינוי סטטוס ל-LOST - בחר סטודיו אחר',
      createdBy: adminUser.id,
      createdAt: createDateTime(-6, 15, 0),
    },
  ];

  for (const activity of leadActivities) {
    await prisma.leadActivity.create({ data: activity as any });
  }

  // Create demo tasks
  console.log('✅ Creating demo tasks...');

  // Get tenantUser IDs for task assignment
  const adminTenantUserId = adminTenantUser.id;
  const ownerTenantUserId = ownerTenantUser.id;
  const coachTenantUserId = coachTenantUser.id;

  const tasks = [
    // Overdue tasks
    {
      tenantId: tenant.id,
      title: 'לחזור לנעמה וינברג בנוגע לשיעור ניסיון',
      description: 'ליד מוכשר - הגיעה דרך חבר מביא חבר. לתאם שיעור ניסיון',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: createDateTime(-2, 17, 0),
      assigneeId: adminTenantUserId,
      createdById: ownerTenantUserId,
      entityType: 'customer',
      entityId: customers[8].id,
    },
    {
      tenantId: tenant.id,
      title: 'לטפל בתשלום ממתין של תומר שפירא',
      description: 'תשלום מנוי חודשי ממתין - לברר מצב תשלום',
      status: TaskStatus.PENDING,
      priority: TaskPriority.URGENT,
      dueDate: createDateTime(-1, 12, 0),
      assigneeId: adminTenantUserId,
      createdById: ownerTenantUserId,
      entityType: 'customer',
      entityId: customers[7].id,
    },
    // Due today
    {
      tenantId: tenant.id,
      title: 'להתקשר לענבל שושן - מעקב אחרי מייל',
      description: 'נשלח מייל עם מחירון אתמול, לוודא שקיבלה ולשאול אם מעוניינת בשיעור ניסיון',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: createDateTime(0, 14, 0),
      assigneeId: adminTenantUserId,
      createdById: adminTenantUserId,
      entityType: 'customer',
      entityId: lead2.id,
    },
    {
      tenantId: tenant.id,
      title: 'לעדכן הערות רפואיות של מיכל רוזן',
      description: 'ביקשה לעדכן את הרופא שלה בנוגע לאסתמה - לוודא שהמידע עדכני',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: createDateTime(0, 16, 0),
      assigneeId: adminTenantUserId,
      createdById: coachTenantUserId,
      entityType: 'customer',
      entityId: customers[4].id,
    },
    // Future tasks
    {
      tenantId: tenant.id,
      title: 'לשלוח תזכורת חידוש מנוי לרחל דוידוביץ',
      description: 'המנוי החודשי מתחדש בעוד שבוע - לשלוח תזכורת',
      status: TaskStatus.PENDING,
      priority: TaskPriority.LOW,
      dueDate: createDateTime(5, 10, 0),
      assigneeId: adminTenantUserId,
      createdById: ownerTenantUserId,
      entityType: 'customer',
      entityId: customers[0].id,
    },
    {
      tenantId: tenant.id,
      title: 'להכין לוח שיעורים לחודש הבא',
      description: 'לתכנן את לוח השיעורים לחודש הבא כולל חגים ומדריכים',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: createDateTime(7, 12, 0),
      assigneeId: ownerTenantUserId,
      createdById: ownerTenantUserId,
    },
    // Completed tasks
    {
      tenantId: tenant.id,
      title: 'לתאם שיעור ניסיון ליעל אברהם',
      description: 'ליד חדש - מתעניינת ביוגה. תואם שיעור ניסיון',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: createDateTime(-4, 12, 0),
      assigneeId: adminTenantUserId,
      createdById: ownerTenantUserId,
      completedAt: createDateTime(-4, 11, 30),
      entityType: 'customer',
      entityId: customers[2].id,
    },
    {
      tenantId: tenant.id,
      title: 'לבדוק ציוד באולם כושר',
      description: 'בדיקת בטיחות שגרתית לציוד באולם',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.MEDIUM,
      dueDate: createDateTime(-3, 9, 0),
      assigneeId: coachTenantUserId,
      createdById: ownerTenantUserId,
      completedAt: createDateTime(-3, 8, 45),
    },
    // Coach task
    {
      tenantId: tenant.id,
      title: 'להכין תוכנית אימונים לגיל מזרחי',
      description: 'לקוח חדש באימון אישי - להכין תוכנית מותאמת',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: createDateTime(1, 10, 0),
      assigneeId: coachTenantUserId,
      createdById: adminTenantUserId,
      entityType: 'customer',
      entityId: customers[9].id,
    },
    // Cancelled task
    {
      tenantId: tenant.id,
      title: 'להתקשר לרועי אלון - ניסיון שימור',
      description: 'ליד שאבד - לנסות להחזיר עם הצעה מיוחדת',
      status: TaskStatus.CANCELLED,
      priority: TaskPriority.LOW,
      dueDate: createDateTime(-5, 14, 0),
      assigneeId: adminTenantUserId,
      createdById: ownerTenantUserId,
      entityType: 'customer',
      entityId: lead3.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task as any });
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n🛡️ Super Admin account:');
  console.log('   Email:    admin@rafit.com');
  console.log('   Password: SuperAdmin123!');
  console.log('\n📧 Demo staff accounts (Password: Demo1234!):');
  console.log('   Owner:           owner@demo.com');
  console.log('   Network Mgr:     admin@demo.com');
  console.log('   Network Mgr:     network@demo.com');
  console.log('   Coach:           coach@demo.com');
  console.log('   Coach 2:         coach2@demo.com');
  console.log('   Coach 3:         coach3@demo.com');
  console.log('   FrontDesk:       frontdesk@demo.com');
  console.log('   Accountant:      accountant@demo.com');
  console.log('\n🏋️ Portal customer account (Password: Demo1234!):');
  console.log('   Customer:   customer1@demo.com  (רחל דוידוביץ)');
  console.log('\n📊 Demo data created:');
  console.log('   - 2 branches (Tel Aviv + Jerusalem)');
  console.log('   - 13 customers (7 converted, 3 leads, 1 trial, 1 qualified, 1 lost)');
  console.log('   - 27 class instances across the week (Sun-Thu)');
  console.log('   - ~35 bookings (confirmed, waitlisted, cancelled, no-show, completed)');
  console.log('   - 10 payments (6 completed, 2 pending, 1 failed, 1 refunded)');
  console.log('   - 13 lead activities across the pipeline');
  console.log('   - 10 tasks (2 overdue, 2 due today, 2 future, 2 completed, 1 in-progress, 1 cancelled)');
  console.log('   - Activity logs for the feed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
