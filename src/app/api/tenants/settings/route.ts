import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

// Settings schema - these are stored in the tenant.settings JSON field
const settingsSchema = z.object({
  // Business info
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),

  // Notifications
  notifications: z.object({
    emailReminder: z.boolean().optional(),
    smsReminder: z.boolean().optional(),
    reminderHoursBefore: z.number().int().min(1).max(48).optional(),
    bookingConfirmation: z.boolean().optional(),
    cancellationConfirmation: z.boolean().optional(),
  }).optional(),

  // Payments
  payments: z.object({
    vatRate: z.number().min(0).max(100).optional(),
    cancellationPolicyHours: z.number().int().min(0).max(168).optional(),
  }).optional(),

  // Branding
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }).optional(),
});

// Default settings
const defaultSettings = {
  notifications: {
    emailReminder: true,
    smsReminder: false,
    reminderHoursBefore: 2,
    bookingConfirmation: true,
    cancellationConfirmation: true,
  },
  payments: {
    vatRate: 17,
    cancellationPolicyHours: 4,
  },
  branding: {
    primaryColor: '#1e40af',
    secondaryColor: '#f97316',
  },
};

// GET /api/tenants/settings - Get tenant settings
export async function GET() {
  try {
    const session = await requirePermission('tenant:read');

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        logoUrl: true,
        timezone: true,
        currency: true,
        locale: true,
        settings: true,
        stripeCustomerId: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    // Merge stored settings with defaults
    const storedSettings = (tenant.settings as Record<string, unknown>) || {};
    const mergedSettings = {
      notifications: { ...defaultSettings.notifications, ...(storedSettings.notifications as object || {}) },
      payments: { ...defaultSettings.payments, ...(storedSettings.payments as object || {}) },
      branding: { ...defaultSettings.branding, ...(storedSettings.branding as object || {}) },
      address: storedSettings.address || null,
    };

    return NextResponse.json({
      settings: {
        // Basic info
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        phone: tenant.phone,
        logoUrl: tenant.logoUrl,
        timezone: tenant.timezone,
        currency: tenant.currency,
        locale: tenant.locale,
        // Payment connection status
        hasStripeConnection: !!tenant.stripeCustomerId,
        // Extended settings from JSON
        ...mergedSettings,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת ההגדרות' },
      { status: 500 }
    );
  }
}

// PATCH /api/tenants/settings - Update tenant settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await requirePermission('tenant:update');

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Get current tenant to preserve existing settings
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    });

    if (!currentTenant) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    const currentSettings = (currentTenant.settings as Record<string, unknown>) || {};

    // Build the settings JSON update
    const updatedSettings: Record<string, unknown> = { ...currentSettings };

    if (data.notifications) {
      updatedSettings.notifications = {
        ...((currentSettings.notifications as object) || {}),
        ...data.notifications,
      };
    }

    if (data.payments) {
      updatedSettings.payments = {
        ...((currentSettings.payments as object) || {}),
        ...data.payments,
      };
    }

    if (data.branding) {
      updatedSettings.branding = {
        ...((currentSettings.branding as object) || {}),
        ...data.branding,
      };
    }

    if (data.address !== undefined) {
      updatedSettings.address = data.address;
    }

    // Update tenant
    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        settings: updatedSettings,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        logoUrl: true,
        timezone: true,
        currency: true,
        locale: true,
        settings: true,
      },
    });

    // Audit log
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'settings.update',
      entityType: 'tenant',
      entityId: tenant.id,
      oldValues: {
        name: currentTenant.name,
        email: currentTenant.email,
        phone: currentTenant.phone,
      },
      newValues: data,
    });

    // Merge stored settings with defaults for response
    const storedSettings = (tenant.settings as Record<string, unknown>) || {};
    const mergedSettings = {
      notifications: { ...defaultSettings.notifications, ...(storedSettings.notifications as object || {}) },
      payments: { ...defaultSettings.payments, ...(storedSettings.payments as object || {}) },
      branding: { ...defaultSettings.branding, ...(storedSettings.branding as object || {}) },
      address: storedSettings.address || null,
    };

    return NextResponse.json({
      success: true,
      message: 'ההגדרות נשמרו בהצלחה',
      settings: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        phone: tenant.phone,
        logoUrl: tenant.logoUrl,
        timezone: tenant.timezone,
        currency: tenant.currency,
        locale: tenant.locale,
        ...mergedSettings,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בשמירת ההגדרות' },
      { status: 500 }
    );
  }
}
