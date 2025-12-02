import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const createStudentSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  admissionNumber: z.string().optional(),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.enum(['MALE', 'FEMALE']),
  guardianName: z.string(),
  guardianPhone: z.string(),
  guardianEmail: z.string().email().optional(),
  address: z.string().optional(),
  classId: z.string().uuid(),
  scholarshipId: z.string().uuid().optional().nullable(),
});

const updateStudentSchema = createStudentSchema.partial().extend({
  status: z.enum(['ACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED_OUT']).optional(),
  reason: z.string().optional(), // For audit trail
});

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        class: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const data = createStudentSchema.parse(req.body);
    
    let parentId: string | null = null;

    // Auto-generate admission number if not provided
    let admissionNumber = data.admissionNumber;
    if (!admissionNumber) {
      const year = new Date().getFullYear();
      // Find the last student created this year to increment the number
      const lastStudent = await prisma.student.findFirst({
        where: {
          admissionNumber: {
            startsWith: `${year}-`
          }
        },
        orderBy: {
          admissionNumber: 'desc'
        }
      });

      let nextNum = 1;
      if (lastStudent) {
        const parts = lastStudent.admissionNumber.split('-');
        if (parts.length === 2) {
          const lastNum = parseInt(parts[1], 10);
          if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
          }
        }
      }
      
      admissionNumber = `${year}-${nextNum.toString().padStart(4, '0')}`;
    }

    // If guardian email is provided, try to link or create a parent account
    if (data.guardianEmail) {
      const existingParent = await prisma.user.findUnique({
        where: { email: data.guardianEmail }
      });

      if (existingParent) {
        parentId = existingParent.id;
      } else {
        // Create new parent account
        // Default password is 'password123' - in production, send an email with setup link
        const hashedPassword = await bcrypt.hash('password123', 10);
        const newParent = await prisma.user.create({
          data: {
            email: data.guardianEmail,
            fullName: data.guardianName,
            role: 'PARENT',
            passwordHash: hashedPassword,
          }
        });
        parentId = newParent.id;
      }
    }

    const student = await prisma.student.create({
      data: {
        ...data,
        admissionNumber,
        status: 'ACTIVE',
        parentId,
      },
    });
    
    res.status(201).json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
};

export const bulkCreateStudents = async (req: Request, res: Response) => {
  try {
    const studentsData = z.array(createStudentSchema).parse(req.body);
    
    // Generate admission numbers for those missing
    const year = new Date().getFullYear();
    
    // Find last admission number to start incrementing
    const lastStudent = await prisma.student.findFirst({
      where: { admissionNumber: { startsWith: `${year}-` } },
      orderBy: { admissionNumber: 'desc' }
    });

    let nextNum = 1;
    if (lastStudent) {
      const parts = lastStudent.admissionNumber.split('-');
      if (parts.length === 2) {
        const lastNum = parseInt(parts[1], 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
    }

    const dataToCreate = studentsData.map((s, index) => {
      let admissionNumber = s.admissionNumber;
      if (!admissionNumber) {
        admissionNumber = `${year}-${(nextNum + index).toString().padStart(4, '0')}`;
      }
      
      // Remove guardianEmail from the object passed to createMany as it might not be in the DB schema yet
      // and createMany doesn't support creating relations anyway.
      const { guardianEmail, ...studentData } = s;
      
      return {
        ...studentData,
        admissionNumber: admissionNumber!,
        status: 'ACTIVE' as const
      };
    });
    
    const result = await prisma.student.createMany({
      data: dataToCreate,
      skipDuplicates: true, 
    });
    
    res.status(201).json({ message: `Successfully imported ${result.count} students`, count: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Bulk create error:', error);
    res.status(500).json({ error: 'Failed to import students' });
  }
};

export const bulkDeleteStudents = async (req: Request, res: Response) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);
    
    const result = await prisma.student.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });
    
    res.json({ message: `Successfully deleted ${result.count} students`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete students' });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        scholarship: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        attendance: {
          take: 5,
          orderBy: { date: 'desc' }
        },
        feeStructures: {
          include: {
            feeTemplate: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, ...data } = updateStudentSchema.parse(req.body);
    const userId = (req as any).user?.userId;

    // If class is changing, we need to log it
    if (data.classId) {
      const currentStudent = await prisma.student.findUnique({
        where: { id },
        select: { classId: true }
      });

      if (currentStudent && currentStudent.classId !== data.classId) {
        await prisma.classMovementLog.create({
          data: {
            studentId: id,
            fromClassId: currentStudent.classId,
            toClassId: data.classId,
            reason: reason || 'Class update',
            changedByUserId: userId
          }
        });
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data,
    });

    res.json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

export const getMyChildren = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    const students = await prisma.student.findMany({
      where: {
        parentId: userId
      },
      include: {
        class: true,
        attendance: {
          take: 5,
          orderBy: { date: 'desc' }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        feeStructures: {
          include: {
            feeTemplate: true
          }
        },
        assessmentResults: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            assessment: {
              include: {
                subject: true
              }
            }
          }
        },
        termResults: {
          include: {
            subject: true,
            term: true
          },
          orderBy: {
            term: { startDate: 'asc' }
          }
        },
        termReports: {
          include: {
            term: true
          },
          orderBy: {
            term: { startDate: 'desc' }
          }
        }
      }
    });

    const studentsWithBalance = students.map(student => {
      const totalFees = student.feeStructures.reduce((sum, fee) => sum + Number(fee.amountDue), 0);
      const totalPaid = student.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const balance = totalFees - totalPaid;

      // We only want to send the last 5 payments to the frontend to keep payload small, 
      // but we needed all of them for calculation.
      const recentPayments = student.payments.slice(0, 5);

      return {
        ...student,
        payments: recentPayments,
        balance
      };
    });
    
    res.json(studentsWithBalance);
  } catch (error) {
    console.error('Get my children error:', error);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
};
