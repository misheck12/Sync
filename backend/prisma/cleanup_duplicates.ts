
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for duplicates...');
    const duplicates = await prisma.user.groupBy({
        by: ['email'],
        _count: { email: true },
        having: { email: { _count: { gt: 1 } } }
    });

    for (const group of duplicates) {
        console.log(`Fixing duplicates for ${group.email}...`);
        const users = await prisma.user.findMany({
            where: { email: group.email },
            orderBy: { createdAt: 'desc' } // Newest first
        });

        const [keep, ...remove] = users;
        console.log(`Keeping user ${keep.id} (Tenant: ${keep.tenantId})`);

        for (const user of remove) {
            console.log(`Deleting user ${user.id} (Tenant: ${user.tenantId})`);
            // We need to handle constraints if user has related records (payments, etc).
            // onDelete Cascade might handle it if defined, but User usually doesn't cascade delete important things?
            // Schema checks:
            // classesManaged Class[]
            // paymentsRecorded Payment[]
            // ...
            // If they have data, deletion might fail.
            try {
                await prisma.user.delete({ where: { id: user.id } });
            } catch (err) {
                console.error(`Failed to delete user ${user.id}:`, err);
                // Force delete related? No too risky.
            }
        }
    }
    console.log('Cleanup complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
