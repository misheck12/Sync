import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Adding parent to Prestige...');

    // Find Prestige tenant
    const tenant = await prisma.tenant.findFirst({
        where: { name: { contains: 'Prestige', mode: 'insensitive' } }
    });

    if (!tenant) {
        console.log('❌ Prestige tenant not found');
        return;
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

    // Create parent user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const parent = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'livingim2018@gmail.com'
            }
        },
        update: {},
        create: {
            tenantId: tenant.id,
            email: 'livingim2018@gmail.com',
            fullName: 'Test Parent',
            passwordHash: hashedPassword,
            role: 'PARENT',
            isActive: true
        }
    });

    console.log(`✅ Parent: ${parent.email} (${parent.id})`);

    // Find a class to assign student to
    const existingClass = await prisma.class.findFirst({
        where: { tenantId: tenant.id }
    });

    if (!existingClass) {
        console.log('⚠️ No class found, creating one...');

        // Find or create an academic term
        let term = await prisma.academicTerm.findFirst({ where: { tenantId: tenant.id } });
        if (!term) {
            term = await prisma.academicTerm.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Term 1 2026',
                    startDate: new Date(),
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                    isActive: true
                }
            });
        }

        // Find an admin to be teacher
        const admin = await prisma.user.findFirst({
            where: { tenantId: tenant.id, role: 'SUPER_ADMIN' }
        });

        if (!admin) {
            console.log('❌ No admin found to assign as teacher');
            return;
        }

        const newClass = await prisma.class.create({
            data: {
                tenantId: tenant.id,
                name: 'Grade 1A',
                gradeLevel: 1,
                teacherId: admin.id,
                academicTermId: term.id
            }
        });

        console.log(`✅ Created class: ${newClass.name}`);
    }

    const classToUse = existingClass || await prisma.class.findFirst({ where: { tenantId: tenant.id } });

    if (!classToUse) {
        console.log('❌ Still no class available');
        return;
    }

    // Check if student already exists
    const existingStudent = await prisma.student.findFirst({
        where: { tenantId: tenant.id, parentId: parent.id }
    });

    if (existingStudent) {
        console.log(`✅ Student already exists: ${existingStudent.firstName} ${existingStudent.lastName}`);
    } else {
        const student = await prisma.student.create({
            data: {
                tenantId: tenant.id,
                firstName: 'Junior',
                lastName: 'Test',
                admissionNumber: `TEST-${Date.now()}`,
                dateOfBirth: new Date('2018-01-01'),
                gender: 'MALE',
                classId: classToUse.id,
                parentId: parent.id,
                guardianName: 'Test Parent',
                guardianEmail: 'livingim2018@gmail.com',
                guardianPhone: '260779993730'
            }
        });
        console.log(`✅ Student created: ${student.firstName} ${student.lastName}`);
    }

    console.log('\n=============================================');
    console.log('🎉 DONE!');
    console.log('---------------------------------------------');
    console.log('Login as Parent:');
    console.log('Email: livingim2018@gmail.com');
    console.log('Password: password123');
    console.log('School: ' + tenant.name);
    console.log('=============================================');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
