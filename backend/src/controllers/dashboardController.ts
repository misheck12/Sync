import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.userId;

    if (userRole === 'TEACHER') {
      // 1. My Classes
      const myClasses = await prisma.class.findMany({
        where: { teacherId: userId },
        include: { _count: { select: { students: true } } }
      });

      const totalStudents = myClasses.reduce((acc, curr) => acc + curr._count.students, 0);

      // 2. Today's Schedule
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayDay = days[new Date().getDay()];

      const todaySchedule = await prisma.timetablePeriod.findMany({
        where: {
          teacherId: userId,
          dayOfWeek: todayDay as any
        },
        include: {
          class: true,
          subject: true
        },
        orderBy: { startTime: 'asc' }
      });

      // 3. Recent Assessments (Created for my classes)
      const classIds = myClasses.map(c => c.id);
      const recentAssessments = await prisma.assessment.findMany({
        where: {
          classId: { in: classIds }
        },
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          class: true,
          subject: true,
          _count: { select: { results: true } }
        }
      });

      return res.json({
        role: 'TEACHER',
        stats: {
          totalStudents,
          totalClasses: myClasses.length,
          todayScheduleCount: todaySchedule.length
        },
        myClasses,
        todaySchedule,
        recentAssessments
      });
    }

    // --- ADMIN / BURSAR View (Existing) ---

    // 1. Total Revenue (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: today,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // 2. Active Students
    const activeStudentsCount = await prisma.student.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // 3. Outstanding Fees
    // Calculate total amount due - total amount paid across all fee structures
    const feeStats = await prisma.studentFeeStructure.aggregate({
      _sum: {
        amountDue: true,
        amountPaid: true,
      },
    });

    const totalOutstanding = (Number(feeStats._sum.amountDue) || 0) - (Number(feeStats._sum.amountPaid) || 0);

    // 4. Recent Payments (Last 5)
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      role: 'ADMIN',
      dailyRevenue: Number(todayPayments._sum.amount) || 0,
      activeStudents: activeStudentsCount,
      outstandingFees: totalOutstanding,
      recentPayments,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
