import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'peter.mwamba@email.com';
    const guardianName = 'Peter Mwamba';

    console.log(`🔍 Checking for parent user: ${email}`);

    // 1. Check if user exists
    let parentUser = await prisma.user.findUnique({
        where: { email }
    });

    if (!parentUser) {
        const hashedPassword = await bcrypt.hash('parent123', 10);
        parentUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                fullName: guardianName,
                role: 'PARENT',
            }
        });
        console.log(`✅ Created parent user: ${email}`);
        console.log(`🔑 Credentials: ${email} / parent123`);
    } else {
        console.log(`ℹ️ Parent user already exists: ${email}`);
        console.log(`🔑 Credentials: ${email} / parent123`);
    }

    // 2. Link to Student
    console.log(`🔍 Linking to student with guardian email: ${email}`);
    const student = await prisma.student.findFirst({
        where: { guardianEmail: email }
    });

    if (student) {
        await prisma.student.update({
            where: { id: student.id },
            data: { parentId: parentUser.id }
        });
        console.log(`✅ Successfully linked parent ${email} to student: ${student.firstName} ${student.lastName} (Admission: ${student.admissionNumber})`);
    } else {
        console.log(`❌ No student found with guardian email ${email}`);
        // Try to find ANY student to link to for testing
        const anyStudent = await prisma.student.findFirst();
        if (anyStudent) {
            console.log(`⚠️ Fallback: Linking to first available student: ${anyStudent.firstName}`);
            await prisma.student.update({
                where: { id: anyStudent.id },
                data: { parentId: parentUser.id }
            });
        }
    }
}

main()
    .catch(e => {
        console.error('❌ Error seeding parent:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
