import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying DB connection...');
    try {
        const plans = await prisma.subscriptionPlan.findMany();
        console.log(`Found ${plans.length} plans.`);

        const tenant = await prisma.tenant.findUnique({ where: { slug: 'prestige' } });
        if (tenant) {
            console.log(`Found tenant: ${tenant.name}, ID: ${tenant.id}, Tier: ${tenant.tier} (Type: ${typeof tenant.tier})`);

            const user = await prisma.user.findFirst({ where: { email: 'admin@prestige.com', tenantId: tenant.id } });
            if (user) {
                console.log(`Found user: ${user.email}, Role: ${user.role}`);
            } else {
                console.log('User admin@prestige.com NOT found in tenant.');
            }
        } else {
            console.log('Tenant prestige NOT found.');
        }

    } catch (error) {
        console.error('DB Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
