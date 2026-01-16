
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Payment Test Data...');

    // 1. Create or Find Tenant
    const tenantSlug = 'payment-test-school';
    let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'Payment Test School',
                slug: tenantSlug,
                email: 'admin@paymenttest.com',
                primaryColor: '#2563eb',
                secondaryColor: '#475569',
                status: 'ACTIVE',
            },
        });
        console.log(`✅ Created Tenant: ${tenant.name}`);
    }

    // 2. Create Parent User (The Payer)
    const parentEmail = 'parent@test.com';
    const hashedPassword = await bcrypt.hash('password123', 10);

    let parent = await prisma.user.findFirst({
        where: {
            tenantId: tenant.id,
            email: parentEmail
        }
    });

    if (!parent) {
        parent = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: parentEmail,
                fullName: 'Test Parent',
                passwordHash: hashedPassword,
                role: 'PARENT',
                isActive: true,
            }
        });
        console.log(`✅ Created Parent: ${parent.email} (Password: password123)`);
    }

    // 3. Create Teacher/Admin (To verify)
    const adminEmail = 'admin@test.com';
    let admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: adminEmail } });

    if (!admin) {
        admin = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: adminEmail,
                fullName: 'School Admin',
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN', // Gives full access
                isActive: true,
            }
        });
        console.log(`✅ Created Admin: ${admin.email} (Password: password123)`);
    }

    // 4. Create Academic Term
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

    // 5. Create Class
    let grade1 = await prisma.class.findFirst({ where: { tenantId: tenant.id, name: 'Grade 1A' } });
    if (!grade1) {
        grade1 = await prisma.class.create({
            data: {
                tenantId: tenant.id,
                name: 'Grade 1A',
                gradeLevel: 1,
                teacherId: admin.id,
                academicTermId: term.id
            }
        });
    }

    // 6. Create Student (Linked to Parent)
    const studentAdm = 'ST-2026-001';
    let student = await prisma.student.findUnique({
        where: {
            tenantId_admissionNumber: {
                tenantId: tenant.id,
                admissionNumber: studentAdm
            }
        }
    });

    if (!student) {
        student = await prisma.student.create({
            data: {
                tenantId: tenant.id,
                firstName: 'Junior',
                lastName: 'Test',
                admissionNumber: studentAdm,
                dateOfBirth: new Date('2018-01-01'),
                gender: 'MALE',
                classId: grade1.id,
                parentId: parent.id, // Linked to our user
                guardianName: 'Test Parent',
                guardianEmail: parentEmail,
                guardianPhone: '260779993730', // Your Number
                address: 'Lusaka, Zambia'
            }
        });
        console.log(`✅ Created Student: ${student.firstName} (Linked to ${parent.email}) with phone 260779993730`);
    } else {
        // efficient update if exists to ensure phone number is correct
        student = await prisma.student.update({
            where: { id: student.id },
            data: { guardianPhone: '260779993730' }
        });
        console.log(`✅ Updated Student Phone: 260779993730`);
    }

    console.log('\n=============================================');
    console.log('🎉 SEEDING COMPLETE');
    console.log('---------------------------------------------');
    console.log('Login as Parent:');
    console.log(`Email: ${parentEmail}`);
    console.log(`Password: password123`);
    console.log(`Student ID to pay for: ${student.id}`);
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
