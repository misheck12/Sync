import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest, getTenantId, getUserId, getUserRole, handleControllerError } from '../utils/tenantContext';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userRole = getUserRole(req);
    const userId = getUserId(req);

    if (userRole === 'TEACHER') {
      // 1. My Classes
      const myClasses = await prisma.class.findMany({
        where: { tenantId, teacherId: userId },
        include: { _count: { select: { students: true } } }
      });

      const totalStudents = myClasses.reduce((acc, curr) => acc + curr._count.students, 0);
      const classIds = myClasses.map(c => c.id);

      // 2. Today's Schedule
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayDay = days[new Date().getDay()];

      const todaySchedule = await prisma.timetablePeriod.findMany({
        where: {
          tenantId,
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
      const recentAssessments = await prisma.assessment.findMany({
        where: {
          tenantId,
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

      // 4. Pending Homework Submissions (New!)
      const pendingSubmissions = await prisma.homeworkSubmission.count({
        where: {
          homework: {
            subjectContent: {
              teacherId: userId,
              tenantId
            }
          },
          status: 'SUBMITTED' // Submitted but not graded
        }
      });

      // 5. My Homework with pending grades (New!)
      const homeworkWithPendingGrades = await prisma.homework.findMany({
        where: {
          subjectContent: {
            teacherId: userId,
            tenantId
          },
          submissions: {
            some: {
              status: 'SUBMITTED'
            }
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          subjectContent: {
            include: {
              class: true,
              subject: true
            }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        }
      });

      // 6. Today's Attendance Status (New!)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get student IDs for my classes
      const myStudentIds = await prisma.student.findMany({
        where: {
          classId: { in: classIds },
          status: 'ACTIVE'
        },
        select: { id: true }
      });
      const studentIds = myStudentIds.map(s => s.id);

      const todayAttendance = await prisma.attendance.findMany({
        where: {
          tenantId,
          classId: { in: classIds },
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length;
      const absentCount = todayAttendance.filter(a => a.status === 'ABSENT').length;
      const lateCount = todayAttendance.filter(a => a.status === 'LATE').length;
      const attendanceTaken = todayAttendance.length > 0;
      const attendanceRate = studentIds.length > 0
        ? Math.round(((presentCount + lateCount) / studentIds.length) * 100)
        : 0;

      // 7. Upcoming Homework Deadlines (Next 7 days) (New!)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingDeadlines = await prisma.homework.findMany({
        where: {
          subjectContent: {
            teacherId: userId,
            tenantId
          },
          dueDate: {
            gte: new Date(),
            lte: nextWeek
          }
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          subjectContent: {
            include: {
              class: true,
              subject: true
            }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        }
      });

      // 8. Recent Forum Posts from Students (New!)
      const recentForumPosts = await prisma.forumPost.findMany({
        where: {
          forum: {
            tenantId,
            OR: [
              { classId: { in: classIds } },
              { createdById: userId }
            ]
          },
          user: {
            role: { in: ['STUDENT', 'PARENT'] }
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              fullName: true,
              role: true
            }
          },
          forum: {
            select: {
              name: true
            }
          }
        }
      });

      // 9. Classes Needing Attendance Today (New!)
      const classesWithScheduleToday = todaySchedule.map(s => s.classId);
      const classesWithAttendanceToday = [...new Set(todayAttendance.map(a => a.classId))];
      const classesNeedingAttendance = myClasses.filter(
        c => classesWithScheduleToday.includes(c.id) && !classesWithAttendanceToday.includes(c.id)
      );

      return res.json({
        role: 'TEACHER',
        stats: {
          totalStudents,
          totalClasses: myClasses.length,
          todayScheduleCount: todaySchedule.length,
          pendingSubmissions,
          attendanceRate,
          attendanceTaken,
          upcomingDeadlinesCount: upcomingDeadlines.length,
          classesNeedingAttendance: classesNeedingAttendance.length
        },
        myClasses,
        todaySchedule,
        recentAssessments,
        homeworkWithPendingGrades,
        upcomingDeadlines,
        recentForumPosts,
        classesNeedingAttendance,
        attendanceStats: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          total: studentIds.length
        }
      });
    }

    // --- ADMIN / BURSAR View ---

    // 1. Total Revenue (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPayments = await prisma.payment.aggregate({
      where: {
        tenantId,
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
        tenantId,
        status: 'ACTIVE',
      },
    });

    // 3. Get student IDs for this tenant for fee calculations
    const students = await prisma.student.findMany({
      where: { tenantId },
      select: { id: true }
    });
    const studentIds = students.map(s => s.id);

    // 4. Outstanding Fees
    const feeStats = await prisma.studentFeeStructure.aggregate({
      where: { studentId: { in: studentIds } },
      _sum: {
        amountDue: true,
        amountPaid: true,
      },
    });

    const totalOutstanding = (Number(feeStats._sum.amountDue) || 0) - (Number(feeStats._sum.amountPaid) || 0);

    // 5. Recent Payments (Last 5)
    const recentPayments = await prisma.payment.findMany({
      where: { tenantId },
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

    // 6. Additional stats for admin
    const totalClasses = await prisma.class.count({ where: { tenantId } });
    const totalTeachers = await prisma.user.count({ where: { tenantId, role: 'TEACHER', isActive: true } });

    res.json({
      role: 'ADMIN',
      stats: {
        dailyRevenue: Number(todayPayments._sum.amount) || 0,
        activeStudents: activeStudentsCount,
        outstandingFees: totalOutstanding,
        totalClasses,
        totalTeachers,
      },
      recentPayments,
    });
  } catch (error) {
    handleControllerError(res, error, 'getDashboardStats');
  }
};

export const getTenantAnnouncements = async (req: TenantRequest, res: Response) => {
  try {
    const announcements = await prisma.platformAnnouncement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(announcements);
  } catch (error) {
    handleControllerError(res, error, 'getTenantAnnouncements');
  }
};
