import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

const recordAttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().datetime(),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
  })),
});

export const recordAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date, records } = recordAttendanceSchema.parse(req.body);
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const attendanceDate = new Date(date);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Use a transaction to ensure all records are created or none
    const result = await prisma.$transaction(async (prisma) => {
      // Delete existing attendance for this class and date to avoid duplicates
      await prisma.attendance.deleteMany({
        where: {
          classId,
          date: {
            gte: attendanceDate,
            lt: nextDay,
          },
        },
      });

      // Create new records
      return Promise.all(
        records.map((record) =>
          prisma.attendance.create({
            data: {
              classId,
              date: attendanceDate,
              studentId: record.studentId,
              status: record.status,
              recordedByUserId: userId,
            },
          })
        )
      );
    });

    res.status(201).json({ message: 'Attendance recorded successfully', count: result.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Record attendance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getClassAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date } = req.query;

    if (!classId || typeof classId !== 'string') {
      return res.status(400).json({ message: 'Class ID is required' });
    }

    const whereClause: any = { classId };
    if (date && typeof date === 'string') {
      // Filter by date (ignoring time for simplicity in this example, 
      // but in production you'd want to handle timezones carefully)
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.date = {
        gte: searchDate,
        lt: nextDay,
      };
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
      },
      orderBy: {
        student: {
          lastName: 'asc',
        },
      },
    });

    res.json(attendance);
  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const attendance = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: {
        date: 'desc',
      },
    });

    res.json(attendance);
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
