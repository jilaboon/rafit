import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional().nullable(),
  leadStatus: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).optional(),
  marketingConsent: z.boolean().optional(),
});

// GET /api/customers/:id - Get single customer
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('customer:read');
    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      include: {
        memberships: {
          include: {
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: {
            classInstance: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
              },
            },
          },
          orderBy: { bookedAt: 'desc' },
          take: 20,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: {
              where: { checkedInAt: { not: null } },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({
      customer: {
        ...customer,
        totalVisits: customer._count.bookings,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הלקוח' },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/:id - Update customer
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('customer:update');
    const { id } = await params;

    const body = await request.json();
    const parsed = updateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get current customer
    const existing = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
    }

    const data = parsed.data;

    // Check email uniqueness if changed
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.customer.findFirst({
        where: {
          tenantId: session.user.tenantId,
          email: data.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'לקוח אחר עם אימייל זה כבר קיים' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
    if (data.emergencyPhone !== undefined) updateData.emergencyPhone = data.emergencyPhone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.medicalNotes !== undefined) updateData.medicalNotes = data.medicalNotes;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.leadStatus !== undefined) updateData.leadStatus = data.leadStatus;
    if (data.marketingConsent !== undefined) {
      updateData.marketingConsent = data.marketingConsent;
      if (data.marketingConsent && !existing.marketingConsent) {
        updateData.consentDate = new Date();
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'customer.update',
      entityType: 'customer',
      entityId: id,
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
      },
      newValues: updateData,
    });

    return NextResponse.json({
      success: true,
      customer,
      message: 'הלקוח עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון הלקוח' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/:id - Soft delete customer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('customer:delete');
    const { id } = await params;

    const existing = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
    }

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'customer.delete',
      entityType: 'customer',
      entityId: id,
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'הלקוח נמחק בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה במחיקת הלקוח' },
      { status: 500 }
    );
  }
}
