import { PrismaClient, Role, Gender, PaymentMethod, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
      passwordHash,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      email: 'teacher@school.com',
      fullName: 'John Teacher',
      role: Role.TEACHER,
      passwordHash,
    },
  });

  const bursar = await prisma.user.upsert({
    where: { email: 'bursar@school.com' },
    update: {},
    create: {
      email: 'bursar@school.com',
      fullName: 'Jane Bursar',
      role: Role.BURSAR,
      passwordHash,
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: 'parent@school.com' },
    update: {},
    create: {
      email: 'parent@school.com',
      fullName: 'Mr. Banda',
      role: Role.PARENT,
      passwordHash,
    },
  });

  console.log('Users created.');

  // 2. Create Academic Term
  const term = await prisma.academicTerm.create({
    data: {
      name: 'Term 1 2025',
      startDate: new Date('2025-01-13'),
      endDate: new Date('2025-04-11'),
      isActive: true,
    },
  });

  console.log('Academic Term created.');

  // 3. Create Class
  const grade10A = await prisma.class.create({
    data: {
      name: 'Grade 10 A',
      gradeLevel: 10,
      teacherId: teacher.id,
      academicTermId: term.id,
    },
  });

  console.log('Class created.');

  // 4. Create Students
  const studentsData = [
    { firstName: 'Alice', lastName: 'Banda', gender: Gender.FEMALE, admissionNumber: '2025001' },
    { firstName: 'Brian', lastName: 'Phiri', gender: Gender.MALE, admissionNumber: '2025002' },
    { firstName: 'Catherine', lastName: 'Zulu', gender: Gender.FEMALE, admissionNumber: '2025003' },
    { firstName: 'David', lastName: 'Lungu', gender: Gender.MALE, admissionNumber: '2025004' },
    { firstName: 'Esther', lastName: 'Mwape', gender: Gender.FEMALE, admissionNumber: '2025005' },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await prisma.student.create({
      data: {
        firstName: s.firstName,
        lastName: s.lastName,
        admissionNumber: s.admissionNumber,
        dateOfBirth: new Date('2008-01-01'),
        gender: s.gender,
        guardianName: 'Parent ' + s.lastName,
        guardianPhone: '0977000000',
        classId: grade10A.id,
        parentId: s.lastName === 'Banda' ? parent.id : undefined,
      },
    });
    students.push(student);
  }

  console.log('Students created.');

  // 5. Create Payments
  await prisma.payment.create({
    data: {
      studentId: students[0].id,
      amount: 1500.00,
      method: PaymentMethod.CASH,
      recordedByUserId: bursar.id,
      referenceNumber: 'REC001',
    },
  });

  await prisma.payment.create({
    data: {
      studentId: students[1].id,
      amount: 2000.00,
      method: PaymentMethod.MOBILE_MONEY,
      recordedByUserId: bursar.id,
      referenceNumber: 'MM123456',
    },
  });

  console.log('Payments created.');

  // 6. Create Attendance
  await prisma.attendance.create({
    data: {
      studentId: students[0].id,
      classId: grade10A.id,
      date: new Date(),
      status: AttendanceStatus.PRESENT,
      recordedByUserId: teacher.id,
    },
  });

  await prisma.attendance.create({
    data: {
      studentId: students[1].id,
      classId: grade10A.id,
      date: new Date(),
      status: AttendanceStatus.ABSENT,
      recordedByUserId: teacher.id,
    },
  });

  console.log('Attendance created.');
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
