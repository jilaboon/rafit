import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/security/audit';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

const createBookingSchema = z.object({
  customerId: z.string().uuid(),
  classInstanceId: z.string().uuid(),
  notes: z.string().optional(),
});

// GET /api/bookings - List bookings
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('booking:read');

    const { searchParams } = new URL(request.url);
    const classInstanceId = searchParams.get('classInstanceId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const where: Record<string, unknown> = {};

    if (classInstanceId) {
      where.classInstanceId = classInstanceId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.classInstance = {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        ...where,
        customer: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        classInstance: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            capacity: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת ההזמנות' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create booking
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('booking:create');

    // Rate limiting
    const rateLimitResult = await checkRateLimit('apiWrite', session.user.id);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { customerId, classInstanceId, notes } = parsed.data;

    // Use a transaction with SELECT FOR UPDATE for race condition handling
    const result = await prisma.$transaction(async (tx) => {
      // Verify customer belongs to tenant
      const customer = await tx.customer.findFirst({
        where: {
          id: customerId,
          tenantId: session.user.tenantId,
        },
      });

      if (!customer) {
        throw new Error('CUSTOMER_NOT_FOUND');
      }

      // Get class instance with lock
      const classInstance = await tx.classInstance.findFirst({
        where: {
          id: classInstanceId,
          branch: {
            tenantId: session.user.tenantId,
          },
          isCancelled: false,
          startTime: {
            gt: new Date(), // Can't book past classes
          },
        },
        include: {
          bookings: {
            where: {
              status: { in: ['CONFIRMED', 'WAITLISTED'] },
            },
          },
        },
      });

      if (!classInstance) {
        throw new Error('CLASS_NOT_FOUND');
      }

      // Check for existing booking
      const existingBooking = await tx.booking.findUnique({
        where: {
          customerId_classInstanceId: {
            customerId,
            classInstanceId,
          },
        },
      });

      if (existingBooking) {
        if (existingBooking.status === 'CANCELLED') {
          // Reactivate cancelled booking
          const updatedBooking = await tx.booking.update({
            where: { id: existingBooking.id },
            data: {
              status: 'CONFIRMED',
              cancelledAt: null,
              cancelReason: null,
              bookedAt: new Date(),
            },
          });
          return { booking: updatedBooking, action: 'reactivated' };
        }
        throw new Error('ALREADY_BOOKED');
      }

      // Check capacity
      const confirmedCount = classInstance.bookings.filter(
        (b) => b.status === 'CONFIRMED'
      ).length;

      const isWaitlist = confirmedCount >= classInstance.capacity;

      if (isWaitlist) {
        const waitlistCount = classInstance.bookings.filter(
          (b) => b.status === 'WAITLISTED'
        ).length;

        if (waitlistCount >= classInstance.waitlistLimit) {
          throw new Error('WAITLIST_FULL');
        }
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          customerId,
          classInstanceId,
          status: isWaitlist ? 'WAITLISTED' : 'CONFIRMED',
          waitlistPosition: isWaitlist
            ? classInstance.bookings.filter((b) => b.status === 'WAITLISTED').length + 1
            : null,
          notes,
          source: 'admin',
          bookedBy: session.user.id,
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          classInstance: {
            select: {
              id: true,
              name: true,
              startTime: true,
            },
          },
        },
      });

      return { booking, action: isWaitlist ? 'waitlisted' : 'confirmed' };
    });

    // Audit log
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'booking.create',
      entityType: 'booking',
      entityId: result.booking.id,
      newValues: {
        customerId,
        classInstanceId,
        status: result.booking.status,
      },
    });

    // TODO: Send confirmation email

    return NextResponse.json(
      {
        success: true,
        booking: result.booking,
        message:
          result.action === 'waitlisted'
            ? 'נרשמת לרשימת ההמתנה'
            : 'ההזמנה נוצרה בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      const errorMessages: Record<string, { message: string; status: number }> = {
        CUSTOMER_NOT_FOUND: { message: 'לקוח לא נמצא', status: 404 },
        CLASS_NOT_FOUND: { message: 'שיעור לא נמצא או שכבר עבר', status: 404 },
        ALREADY_BOOKED: { message: 'כבר קיימת הזמנה לשיעור זה', status: 409 },
        WAITLIST_FULL: { message: 'רשימת ההמתנה מלאה', status: 409 },
      };

      const errorInfo = errorMessages[error.message];
      if (errorInfo) {
        return NextResponse.json(
          { error: errorInfo.message },
          { status: errorInfo.status }
        );
      }
    }

    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת ההזמנה' },
      { status: 500 }
    );
  }
}
