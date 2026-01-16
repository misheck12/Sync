import 'dotenv/config';
import { PrismaClient, PlatformRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedPlatformAdmin() {
    console.log('🔧 Seeding platform admin users...\n');

    const defaultPassword = 'Admin@123'; // Change this in production!
    console.log('   Note: Using default password Admin@123');

    let hashedPassword;
    try {
        console.log('   Encryping password...');
        hashedPassword = await bcrypt.hash(defaultPassword, 10);
        console.log('   Password encrypted.');
    } catch (err) {
        console.error('   ❌ Error hashing password:', err);
        throw err;
    }

    try {
        console.log('   Upserting superadmin...');
        // Create default platform superadmin
        const superadmin = await prisma.platformUser.upsert({
            where: { email: 'admin@sync.com' },
            update: {},
            create: {
                email: 'admin@sync.com',
                passwordHash: hashedPassword,
                fullName: 'Platform Administrator',
                role: 'PLATFORM_SUPERADMIN' as PlatformRole,
                isActive: true,
            },
        });
        console.log(`   ✅ Created platform superadmin: ${superadmin.email}`);
    } catch (err) {
        console.error('   ❌ Error upserting superadmin:', err);
        throw err;
    }


    console.log('⚠️  IMPORTANT: Change the password immediately in production!');
    console.log('');

    // Create a support user
    const support = await prisma.platformUser.upsert({
        where: { email: 'support@sync.com' },
        update: {},
        create: {
            email: 'support@sync.com',
            passwordHash: hashedPassword,
            fullName: 'Support Agent',
            role: 'PLATFORM_SUPPORT' as PlatformRole,
            isActive: true,
        },
    });

    console.log(`   ✅ Created platform support: ${support.email}`);

    // Create a sales user
    const sales = await prisma.platformUser.upsert({
        where: { email: 'sales@sync.com' },
        update: {},
        create: {
            email: 'sales@sync.com',
            passwordHash: hashedPassword,
            fullName: 'Sales Representative',
            role: 'PLATFORM_SALES' as PlatformRole,
            isActive: true,
        },
    });

    console.log(`   ✅ Created platform sales: ${sales.email}`);

    console.log('\n🎉 Platform admin users seeded successfully!');
    console.log('\n📝 Platform Admin API Endpoints:');
    console.log('   POST /api/platform/auth/login - Login');
    console.log('   GET  /api/platform/dashboard - Dashboard stats');
    console.log('   GET  /api/platform/tenants - All tenants');
    console.log('   GET  /api/platform/tenants/:id - Tenant details');
    console.log('   POST /api/platform/tenants/:id/suspend - Suspend tenant');
    console.log('   POST /api/platform/tenants/:id/activate - Activate tenant');
    console.log('   GET  /api/platform/payments - All payments');
    console.log('   POST /api/platform/payments/:id/confirm - Confirm payment');
}

seedPlatformAdmin()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
