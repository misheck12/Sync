import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Seeding Platform Settings with Features and Tiers...');

    const defaultFeatures = [
        { key: 'attendance', label: 'Attendance Tracking' },
        { key: 'fee_management', label: 'Fee Management' },
        { key: 'report_cards', label: 'Report Cards' },
        { key: 'parent_portal', label: 'Parent Portal' },
        { key: 'email_notifications', label: 'Email Notifications' },
        { key: 'sms_notifications', label: 'SMS Notifications' },
        { key: 'online_assessments', label: 'Online Assessments' },
        { key: 'timetable', label: 'Timetable Management' },
        { key: 'syllabus_tracking', label: 'Syllabus Tracking' },
        { key: 'advanced_reports', label: 'Advanced Reports' },
        { key: 'api_access', label: 'API Access' },
        { key: 'white_label', label: 'White Label Branding' },
        { key: 'data_export', label: 'Data Export' },
        { key: 'basic_reports', label: 'Basic Reports' },
        { key: 'dedicated_support', label: 'Dedicated Support' },
        { key: 'custom_integrations', label: 'Custom Integrations' },
        { key: 'priority_support', label: 'Priority Support' },
    ];

    const defaultTiers = [
        { key: 'FREE', label: 'Free' },
        { key: 'STARTER', label: 'Starter' },
        { key: 'PROFESSIONAL', label: 'Professional' },
        { key: 'ENTERPRISE', label: 'Enterprise' },
    ];

    await prisma.platformSettings.upsert({
        where: { id: 'default' },
        update: {
            availableFeatures: defaultFeatures,
            availableTiers: defaultTiers,
        },
        create: {
            id: 'default',
            availableFeatures: defaultFeatures,
            availableTiers: defaultTiers,
        },
    });

    console.log('✅ Platform settings updated with features and tiers!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
