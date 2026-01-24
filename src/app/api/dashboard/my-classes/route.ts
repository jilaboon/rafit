import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireTenant, handleAuthError } from '@/lib/auth/permissions';

// GET /api/dashboard/my-classes - Get coach's upcoming classes
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant();
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const daysAhead = parseInt(searchParams.get('days') || '7', 10);

    // Get the coach's staff profile
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        tenantId,
        userId,
      },
      include: {
        staffProfile: true,
      },
    });

    if (!tenantUser?.staffProfile) {
      return NextResponse.json({
        classes: [],
        summary: {
          totalThisWeek: 0,
          totalStudents: 0,
          nextClass: null,
        },
      });
    }

    const coachId = tenantUser.staffProfile.id;

    // Get upcoming classes for this coach
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const classes = await prisma.classInstance.findMany({
      where: {
        coachId,
        startTime: {
          gte: now,
          lte: futureDate,
        },
        isCancelled: false,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
          where: {
            status: 'CONFIRMED',
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
    });

    // Format response
    const formattedClasses = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      startTime: cls.startTime.toISOString(),
      endTime: cls.endTime.toISOString(),
      capacity: cls.capacity,
      bookedCount: cls.bookings.length,
      roomName: cls.room?.name,
      branchName: cls.branch?.name,
      isCancelled: cls.isCancelled,
    }));

    // Calculate summary
    const totalThisWeek = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + cls.bookings.length, 0);
    const nextClass = classes.length > 0
      ? {
          name: classes[0].name,
          startTime: classes[0].startTime.toISOString(),
          bookedCount: classes[0].bookings.length,
        }
      : null;

    return NextResponse.json({
      classes: formattedClasses,
      summary: {
        totalThisWeek,
        totalStudents,
        nextClass,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching my classes:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת השיעורים' },
      { status: 500 }
    );
  }
}
