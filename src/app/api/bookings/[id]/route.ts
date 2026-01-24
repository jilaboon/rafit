import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { createAuditLog } from '@/lib/security/audit';

const updateBookingSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED']).optional(),
  notes: z.string().optional(),
  cancelReason: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bookings/:id - Get booking details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
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
            coach: {
              select: {
                tenantUser: {
                  select: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            room: {
              select: {
                name: true,
              },
            },
            branch: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת ההזמנה' },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/:id - Update booking
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, notes, cancelReason } = parsed.data;

    // Get existing booking with tenant verification
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        customer: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        classInstance: {
          include: {
            bookings: {
              where: {
                status: 'WAITLISTED',
              },
              orderBy: {
                waitlistPosition: 'asc',
              },
            },
          },
        },
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    // Handle cancellation - promote from waitlist
    const updates: Record<string, unknown> = {};
    if (notes !== undefined) updates.notes = notes;

    if (status) {
      updates.status = status;

      if (status === 'CANCELLED') {
        updates.cancelledAt = new Date();
        updates.cancelReason = cancelReason;

        // Promote first person from waitlist
        const nextInWaitlist = existingBooking.classInstance.bookings[0];
        if (nextInWaitlist && existingBooking.status === 'CONFIRMED') {
          await prisma.booking.update({
            where: { id: nextInWaitlist.id },
            data: {
              status: 'CONFIRMED',
              waitlistPosition: null,
            },
          });

          // TODO: Send notification to promoted customer
        }
      }

      if (status === 'NO_SHOW') {
        updates.noShowAt = new Date();
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updates,
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

    // Audit log
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: status === 'CANCELLED' ? 'booking.cancel' : 'booking.update',
      entityType: 'booking',
      entityId: id,
      oldValues: { status: existingBooking.status },
      newValues: { status: booking.status },
    });

    return NextResponse.json({
      success: true,
      booking,
      message: status === 'CANCELLED' ? 'ההזמנה בוטלה' : 'ההזמנה עודכנה',
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון ההזמנה' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/:id - Cancel booking
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Delegate to PATCH with status=CANCELLED
  const { id } = await params;

  const patchRequest = new NextRequest(request.url, {
    method: 'PATCH',
    headers: request.headers,
    body: JSON.stringify({ status: 'CANCELLED' }),
  });

  return PATCH(patchRequest, { params: Promise.resolve({ id }) });
}
