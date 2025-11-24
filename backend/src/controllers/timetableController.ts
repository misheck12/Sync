import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createPeriodSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),   // HH:MM
  academicTermId: z.string().uuid(),
});

export const getTimetableByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { termId } = req.query;

    if (!termId) {
      return res.status(400).json({ message: 'Academic Term ID is required' });
    }

    const periods = await prisma.timetablePeriod.findMany({
      where: {
        classId,
        academicTermId: termId as string,
      },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(periods);
  } catch (error) {
    console.error('Get class timetable error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTimetableByTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const { termId } = req.query;

    if (!termId) {
      return res.status(400).json({ message: 'Academic Term ID is required' });
    }

    const periods = await prisma.timetablePeriod.findMany({
      where: {
        teacherId,
        academicTermId: termId as string,
      },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(periods);
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTimetablePeriod = async (req: Request, res: Response) => {
  try {
    const data = createPeriodSchema.parse(req.body);

    // 1. Check for Teacher Conflict
    const teacherConflict = await prisma.timetablePeriod.findFirst({
      where: {
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        academicTermId: data.academicTermId,
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } },
            ],
          },
        ],
      },
    });

    if (teacherConflict) {
      return res.status(409).json({ 
        message: 'Teacher is already booked for this time slot',
        conflict: teacherConflict 
      });
    }

    // 2. Check for Class Conflict
    const classConflict = await prisma.timetablePeriod.findFirst({
      where: {
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        academicTermId: data.academicTermId,
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } },
            ],
          },
        ],
      },
    });

    if (classConflict) {
      return res.status(409).json({ 
        message: 'Class already has a period in this time slot',
        conflict: classConflict 
      });
    }

    const period = await prisma.timetablePeriod.create({
      data,
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.status(201).json(period);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Create timetable period error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTimetablePeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.timetablePeriod.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Delete timetable period error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
