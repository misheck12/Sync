import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendNotification, generatePaymentReceiptEmail } from '../services/notificationService';

const prisma = new PrismaClient();

const createPaymentSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_DEPOSIT']),
  notes: z.string().optional(),
});

// Generate unique transaction ID: TXN-XXXXXXXX (8 char UUID)
const generateTransactionId = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TXN-';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const parseResult = createPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors });
    }

    const { studentId, amount, method, notes } = parseResult.data;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Generate transaction ID
    const transactionId = generateTransactionId();

    const payment = await prisma.payment.create({
      data: {
        transactionId,
        studentId,
        amount,
        method,
        notes,
        recordedByUserId: userId,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
            guardianEmail: true,
            guardianName: true,
            guardianPhone: true,
            parent: {
              select: {
                email: true,
                fullName: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        recordedBy: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // Send Notification (Email & SMS) via Notification Service
    try {
      // Fetch school settings for the name
      const settings = await prisma.schoolSettings.findFirst();
      const schoolName = settings?.schoolName || 'School';

      const parentEmail = payment.student.parent?.email || payment.student.guardianEmail;
      const parentPhone = payment.student.guardianPhone;
      const guardianName = payment.student.parent?.fullName || payment.student.guardianName || 'Parent';

      if (parentEmail || parentPhone) {
        const { subject, text, html, sms } = generatePaymentReceiptEmail(
          guardianName,
          `${payment.student.firstName} ${payment.student.lastName}`,
          Number(amount),
          new Date(),
          method,
          transactionId,
          schoolName
        );

        // Send via service handling both channels based on settings
        sendNotification(
          parentEmail || undefined,
          parentPhone || undefined,
          subject,
          text,
          html,
          sms
        ).catch(err => console.error('Background notification failed:', err));

        console.log(`Notification queued for parent of student ${studentId}`);
      }
    } catch (notifyError) {
      console.error('Failed to process notifications:', notifyError);
      // Don't block the response, just log the error
    }

    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        recordedBy: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStudentPayments = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { studentId },
      include: {
        recordedBy: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(payments);
  } catch (error) {
    console.error('Get student payments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getFinanceStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Revenue (Sum of all payments)
    const totalRevenueAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    });
    const totalRevenue = Number(totalRevenueAgg._sum.amount || 0);
    const totalTransactions = totalRevenueAgg._count.id;

    // 2. Total Fees Assigned (Sum of all fee structures)
    const totalFeesAgg = await prisma.studentFeeStructure.aggregate({
      _sum: { amountDue: true },
    });
    const totalFeesAssigned = Number(totalFeesAgg._sum.amountDue || 0);

    // 3. Pending Fees
    const pendingFees = Math.max(0, totalFeesAssigned - totalRevenue);

    // 4. Overdue Students Count
    // Get total due per student
    const feesByStudent = await prisma.studentFeeStructure.groupBy({
      by: ['studentId'],
      _sum: { amountDue: true },
    });

    // Get total paid per student
    const paymentsByStudent = await prisma.payment.groupBy({
      by: ['studentId'],
      _sum: { amount: true },
    });

    // Create a map for quick lookup
    const paymentsMap = new Map<string, number>();
    paymentsByStudent.forEach(p => {
      paymentsMap.set(p.studentId, Number(p._sum.amount || 0));
    });

    let overdueCount = 0;
    feesByStudent.forEach(f => {
      const studentId = f.studentId;
      const due = Number(f._sum.amountDue || 0);
      const paid = paymentsMap.get(studentId) || 0;

      if (due > paid) {
        overdueCount++;
      }
    });

    res.json({
      totalRevenue,
      totalTransactions,
      pendingFees,
      overdueStudentsCount: overdueCount
    });

  } catch (error) {
    console.error('Get finance stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    // 1. Monthly Revenue (Current Year)
    const monthlyPayments = await prisma.payment.groupBy({
      by: ['paymentDate'],
      _sum: { amount: true },
      where: {
        paymentDate: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    // Process into months array [Jan, Feb, ...]
    const monthlyRevenue = Array(12).fill(0);
    monthlyPayments.forEach(p => {
      const month = new Date(p.paymentDate).getMonth();
      monthlyRevenue[month] += Number(p._sum.amount || 0);
    });

    // 2. Payment Methods Distribution
    const methodsStats = await prisma.payment.groupBy({
      by: ['method'],
      _count: { id: true },
      _sum: { amount: true }
    });

    // 3. Collection by Class
    // This is complex, so we'll do an aggregation
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        students: {
          select: {
            feeStructures: {
              select: { amountDue: true }
            },
            payments: {
              select: { amount: true }
            }
          }
        }
      }
    });

    const classCollection = classes.map(cls => {
      let totalDue = 0;
      let totalCollected = 0;

      cls.students.forEach(student => {
        student.feeStructures.forEach(fee => totalDue += Number(fee.amountDue));
        student.payments.forEach(pay => totalCollected += Number(pay.amount));
      });

      return {
        className: cls.name,
        totalDue,
        totalCollected,
        percentage: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0
      };
    }).sort((a, b) => b.percentage - a.percentage); // Best performing first

    res.json({
      monthlyRevenue,
      paymentMethods: methodsStats.map(m => ({
        method: m.method,
        count: m._count.id,
        amount: Number(m._sum.amount || 0)
      })),
      classCollection
    });

  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ message: 'Failed to generate financial report' });
  }
};
