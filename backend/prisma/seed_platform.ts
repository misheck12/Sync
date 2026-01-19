import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding Platform Admin...');

    const email = 'admin@sync.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.platformUser.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            role: 'PLATFORM_SUPERADMIN' as any,
            isActive: true
        },
        create: {
            email,
            fullName: 'Sync System Admin',
            passwordHash: hashedPassword,
            role: 'PLATFORM_SUPERADMIN' as any, // Cast to any to avoid Enum type issues if not generated
            isActive: true,
        } as any
    });

    console.log(`✅ Platform Admin seeded: ${admin.email}`);
    console.log(`🔑 Credentials: ${email} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
