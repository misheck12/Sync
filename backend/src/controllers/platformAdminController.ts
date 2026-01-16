import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// ==========================================
// PLATFORM ADMIN AUTHENTICATION
// ==========================================

const platformLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

/**
 * Platform admin login
 */
export const platformLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = platformLoginSchema.parse(req.body);

        // Find platform user
        const platformUser = await prisma.platformUser.findUnique({
            where: { email },
        });

        if (!platformUser || !platformUser.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, platformUser.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            {
                userId: platformUser.id,
                email: platformUser.email,
                role: platformUser.role,
                isPlatformUser: true,
            },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: platformUser.id,
                email: platformUser.email,
                fullName: platformUser.fullName,
                role: platformUser.role,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error('Platform login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ==========================================
// ANNOUNCEMENTS
// ==========================================

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { title, message, type, expiresAt } = req.body;
        const announcement = await prisma.platformAnnouncement.create({
            data: {
                title,
                message,
                type: type || 'INFO',
                isActive: true,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });
        res.json(announcement);
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
};

export const getAllAnnouncements = async (req: Request, res: Response) => {
    try {
        const announcements = await prisma.platformAnnouncement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcements);
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.platformAnnouncement.delete({ where: { id } });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
};

export const toggleAnnouncementStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const announcement = await prisma.platformAnnouncement.findUnique({ where: { id } });
        if (!announcement) return res.status(404).json({ error: 'Not found' });

        await prisma.platformAnnouncement.update({
            where: { id },
            data: { isActive: !announcement.isActive }
        });
        res.json({ message: 'Status updated' });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

/**
 * Get current platform user profile
 */
export const getPlatformProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).platformUser?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.platformUser.findUnique({
            where: { id: userId },
            select: { id: true, email: true, fullName: true, role: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ==========================================
// DASHBOARD & ANALYTICS
// ==========================================

/**
 * Get platform dashboard stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Get tenant counts by status
        const tenantsByStatus = await prisma.tenant.groupBy({
            by: ['status'],
            _count: true,
        });

        // Get tenant counts by tier
        const tenantsByTier = await prisma.tenant.groupBy({
            by: ['tier'],
            _count: true,
        });

        // Get total counts
        const [
            totalTenants,
            totalStudents,
            totalUsers,
            totalRevenue,
            recentPayments,
        ] = await Promise.all([
            prisma.tenant.count(),
            prisma.student.count(),
            prisma.user.count(),
            prisma.subscriptionPayment.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { totalAmount: true },
            }),
            prisma.subscriptionPayment.findMany({
                where: { status: 'COMPLETED' },
                orderBy: { paidAt: 'desc' },
                take: 5,
                include: {
                    tenant: { select: { name: true } },
                    plan: { select: { name: true } },
                },
            }),
        ]);

        // Get monthly revenue for chart (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyPayments = await prisma.subscriptionPayment.findMany({
            where: {
                status: 'COMPLETED',
                paidAt: { gte: sixMonthsAgo },
            },
            select: {
                totalAmount: true,
                paidAt: true,
            },
        });

        // Group by month
        const revenueByMonth: Record<string, number> = {};
        monthlyPayments.forEach((payment) => {
            if (payment.paidAt) {
                const month = payment.paidAt.toISOString().slice(0, 7); // YYYY-MM
                revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(payment.totalAmount);
            }
        });

        // Get expiring subscriptions (next 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const expiringSubscriptions = await prisma.tenant.findMany({
            where: {
                status: 'ACTIVE',
                subscriptionEndsAt: {
                    lte: sevenDaysFromNow,
                    gte: new Date(),
                },
            },
            select: {
                id: true,
                name: true,
                tier: true,
                subscriptionEndsAt: true,
            },
            take: 10,
        });

        res.json({
            totals: {
                tenants: totalTenants,
                students: totalStudents,
                users: totalUsers,
                revenue: Number(totalRevenue._sum.totalAmount || 0),
            },
            tenantsByStatus: tenantsByStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {} as Record<string, number>),
            tenantsByTier: tenantsByTier.reduce((acc, item) => {
                acc[item.tier] = item._count;
                return acc;
            }, {} as Record<string, number>),
            revenueByMonth,
            recentPayments: recentPayments.map((p) => ({
                id: p.id,
                tenantName: p.tenant.name,
                planName: p.plan.name,
                amount: Number(p.totalAmount),
                currency: p.currency,
                paidAt: p.paidAt,
            })),
            expiringSubscriptions,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

// ==========================================
// TENANT MANAGEMENT
// ==========================================

/**
 * Get all tenants with pagination and filters
 */
export const getAllTenants = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status as string;
        const tier = req.query.tier as string;
        const search = req.query.search as string;

        const where: any = {};
        if (status) where.status = status;
        if (tier) where.tier = tier;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [tenants, total] = await Promise.all([
            prisma.tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    email: true,
                    phone: true,
                    tier: true,
                    status: true,
                    currentStudentCount: true,
                    currentTeacherCount: true,
                    maxStudents: true,
                    subscriptionEndsAt: true,
                    trialEndsAt: true,
                    createdAt: true,
                    _count: {
                        select: {
                            users: true,
                            students: true,
                        },
                    },
                },
            }),
            prisma.tenant.count({ where }),
        ]);

        res.json({
            tenants,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all tenants error:', error);
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
};

// Validation schema for creating a tenant
const createTenantSchema = z.object({
    name: z.string().min(2, 'School name must be at least 2 characters'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    email: z.string().email('Valid email required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().default('ZM'),
    tier: z.string().default('FREE'),
    // Admin user details
    adminEmail: z.string().email('Valid admin email required'),
    adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
    adminFullName: z.string().min(2, 'Admin name must be at least 2 characters'),
});

/**
 * Create a new tenant (school) - PLATFORM_SUPERADMIN only
 * Creates tenant with initial admin user
 */
export const createTenant = async (req: Request, res: Response) => {
    try {
        const validatedData = createTenantSchema.parse(req.body);

        // Check if slug is already taken
        const existingSlug = await prisma.tenant.findUnique({
            where: { slug: validatedData.slug },
        });
        if (existingSlug) {
            return res.status(400).json({ error: 'School slug already exists. Please choose another.' });
        }

        // Check if tenant email is already used
        const existingEmail = await prisma.tenant.findFirst({
            where: { email: validatedData.email },
        });
        if (existingEmail) {
            return res.status(400).json({ error: 'School email already in use.' });
        }

        // Get plan limits based on tier
        const plan = await prisma.subscriptionPlan.findFirst({
            where: { tier: validatedData.tier as any },
        });

        const defaultLimits = {
            maxStudents: plan?.maxStudents || 50,
            maxTeachers: plan?.maxTeachers || 5,
            maxUsers: plan?.maxUsers || 10,
            maxClasses: plan?.maxClasses || 5,
        };

        // Calculate trial end date (14 days from now)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        // Hash admin password
        const adminPasswordHash = await bcrypt.hash(validatedData.adminPassword, 10);

        // Create tenant and admin user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: validatedData.name,
                    slug: validatedData.slug,
                    email: validatedData.email,
                    phone: validatedData.phone,
                    address: validatedData.address,
                    city: validatedData.city,
                    country: validatedData.country,
                    tier: validatedData.tier as any,
                    status: 'TRIAL',
                    trialEndsAt,
                    ...defaultLimits,
                },
            });

            // Create initial admin user for the tenant
            const adminUser = await tx.user.create({
                data: {
                    email: validatedData.adminEmail,
                    passwordHash: adminPasswordHash,
                    fullName: validatedData.adminFullName,
                    role: 'SUPER_ADMIN',
                    tenantId: tenant.id,
                    isActive: true,
                },
            });

            // Update tenant user count
            await tx.tenant.update({
                where: { id: tenant.id },
                data: { currentUserCount: 1 },
            });

            return { tenant, adminUser };
        });

        res.status(201).json({
            message: 'School created successfully',
            tenant: {
                id: result.tenant.id,
                name: result.tenant.name,
                slug: result.tenant.slug,
                email: result.tenant.email,
                tier: result.tenant.tier,
                status: result.tenant.status,
                trialEndsAt: result.tenant.trialEndsAt,
            },
            adminUser: {
                id: result.adminUser.id,
                email: result.adminUser.email,
                fullName: result.adminUser.fullName,
                role: result.adminUser.role,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error('Create tenant error:', error);
        res.status(500).json({ error: 'Failed to create school' });
    }
};

/**
 * Get single tenant details
 */
export const getTenantDetails = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.params;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                _count: {
                    select: {
                        users: true,
                        students: true,
                        classes: true,
                        subjects: true,
                    },
                },
            },
        });

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Get recent payments
        const recentPayments = await prisma.subscriptionPayment.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                plan: { select: { name: true, tier: true } },
            },
        });

        // Get admin users
        const adminUsers = await prisma.user.findMany({
            where: { tenantId, role: 'SUPER_ADMIN' },
            select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true,
            },
        });

        res.json({
            tenant: {
                ...tenant,
                smtpPassword: tenant.smtpPassword ? '********' : null,
                smsApiKey: tenant.smsApiKey ? '********' : null,
                smsApiSecret: tenant.smsApiSecret ? '********' : null,
            },
            recentPayments,
            adminUsers,
        });
    } catch (error) {
        console.error('Get tenant details error:', error);
        res.status(500).json({ error: 'Failed to fetch tenant details' });
    }
};

/**
 * Update tenant subscription/status
 */
export const updateTenantSubscription = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.params;
        const {
            tier,
            status,
            subscriptionEndsAt,
            maxStudents,
            maxTeachers,
            maxUsers,
            maxClasses,
            notes,
        } = req.body;

        const updateData: any = {};
        if (tier) updateData.tier = tier;
        if (status) updateData.status = status;
        if (subscriptionEndsAt) updateData.subscriptionEndsAt = new Date(subscriptionEndsAt);
        if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
        if (maxTeachers !== undefined) updateData.maxTeachers = maxTeachers;
        if (maxUsers !== undefined) updateData.maxUsers = maxUsers;
        if (maxClasses !== undefined) updateData.maxClasses = maxClasses;

        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateData,
        });

        res.json({
            message: 'Tenant updated successfully',
            tenant: {
                id: tenant.id,
                name: tenant.name,
                tier: tenant.tier,
                status: tenant.status,
            },
        });
    } catch (error) {
        console.error('Update tenant error:', error);
        res.status(500).json({ error: 'Failed to update tenant' });
    }
};

/**
 * Suspend a tenant
 */
export const suspendTenant = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.params;
        const { reason } = req.body;

        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { status: 'SUSPENDED' },
        });

        res.json({
            message: 'Tenant suspended',
            tenant: {
                id: tenant.id,
                name: tenant.name,
                status: tenant.status,
            },
        });
    } catch (error) {
        console.error('Suspend tenant error:', error);
        res.status(500).json({ error: 'Failed to suspend tenant' });
    }
};

/**
 * Activate a tenant
 */
export const activateTenant = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.params;
        const { subscriptionEndsAt } = req.body;

        const updateData: any = { status: 'ACTIVE' };
        if (subscriptionEndsAt) {
            updateData.subscriptionEndsAt = new Date(subscriptionEndsAt);
        }

        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateData,
        });

        res.json({
            message: 'Tenant activated',
            tenant: {
                id: tenant.id,
                name: tenant.name,
                status: tenant.status,
            },
        });
    } catch (error) {
        console.error('Activate tenant error:', error);
        res.status(500).json({ error: 'Failed to activate tenant' });
    }
};

// ==========================================
// PAYMENT MANAGEMENT
// ==========================================

/**
 * Get all payments with filters
 */
export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status as string;
        const tenantId = req.query.tenantId as string;

        const where: any = {};
        if (status) where.status = status;
        if (tenantId) where.tenantId = tenantId;

        const [payments, total] = await Promise.all([
            prisma.subscriptionPayment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: { select: { name: true, slug: true } },
                    plan: { select: { name: true, tier: true } },
                },
            }),
            prisma.subscriptionPayment.count({ where }),
        ]);

        res.json({
            payments: payments.map((p) => ({
                ...p,
                totalAmount: Number(p.totalAmount),
                baseAmount: Number(p.baseAmount),
                overageAmount: Number(p.overageAmount),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

/**
 * Manually confirm a payment
 */
export const confirmPayment = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        const { externalRef, notes } = req.body;

        const payment = await prisma.subscriptionPayment.findUnique({
            where: { id: paymentId },
            include: { plan: true },
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status !== 'PENDING') {
            return res.status(400).json({ error: 'Payment already processed' });
        }

        // Update payment
        await prisma.subscriptionPayment.update({
            where: { id: paymentId },
            data: {
                status: 'COMPLETED',
                paidAt: new Date(),
                externalRef,
                notes,
                receiptNumber: `RCP-${Date.now()}`,
            },
        });

        // Activate tenant subscription
        await prisma.tenant.update({
            where: { id: payment.tenantId },
            data: {
                tier: payment.plan.tier,
                status: 'ACTIVE',
                subscriptionStartedAt: payment.periodStart,
                subscriptionEndsAt: payment.periodEnd,
                maxStudents: payment.plan.maxStudents,
                maxTeachers: payment.plan.maxTeachers,
                maxUsers: payment.plan.maxUsers,
                maxClasses: payment.plan.maxClasses,
                // Enable features based on plan
                smsEnabled: payment.plan.features.includes('sms_notifications'),
                onlineAssessmentsEnabled: payment.plan.features.includes('online_assessments'),
                parentPortalEnabled: payment.plan.features.includes('parent_portal'),
                advancedReportsEnabled: payment.plan.features.includes('advanced_reports'),
                apiAccessEnabled: payment.plan.features.includes('api_access'),
                timetableEnabled: payment.plan.features.includes('timetable'),
                syllabusEnabled: payment.plan.features.includes('syllabus_tracking'),
            },
        });

        res.json({ message: 'Payment confirmed and subscription activated' });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
};

/**
 * Reject a payment
 */
export const rejectPayment = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;

        const payment = await prisma.subscriptionPayment.update({
            where: { id: paymentId },
            data: {
                status: 'FAILED',
                failureReason: reason || 'Payment rejected by admin',
            },
        });

        res.json({ message: 'Payment rejected', payment });
    } catch (error) {
        console.error('Reject payment error:', error);
        res.status(500).json({ error: 'Failed to reject payment' });
    }
};

// ==========================================
// PLATFORM USER MANAGEMENT
// ==========================================

/**
 * Create a platform user
 */
export const createPlatformUser = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, role } = req.body;

        const existing = await prisma.platformUser.findUnique({
            where: { email },
        });

        if (existing) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.platformUser.create({
            data: {
                email,
                passwordHash: hashedPassword,
                fullName,
                role: role || 'PLATFORM_SUPPORT',
            },
        });

        res.status(201).json({
            message: 'Platform user created',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Create platform user error:', error);
        res.status(500).json({ error: 'Failed to create platform user' });
    }
};

/**
 * Get all platform users
 */
export const getPlatformUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.platformUser.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(users);
    } catch (error) {
        console.error('Get platform users error:', error);
        res.status(500).json({ error: 'Failed to fetch platform users' });
    }
};

// ==========================================
// PLATFORM SETTINGS (SMS, Email, etc.)
// ==========================================

/**
 * Get platform settings
 */
export const getPlatformSettings = async (req: Request, res: Response) => {
    try {
        let settings = await prisma.platformSettings.findUnique({
            where: { id: 'default' },
        });

        // Create default settings if they don't exist
        if (!settings) {
            settings = await prisma.platformSettings.create({
                data: { id: 'default' },
            });
        }

        // Mask sensitive fields
        res.json({
            ...settings,
            smsApiKey: settings.smsApiKey ? '********' : null,
            smsApiSecret: settings.smsApiSecret ? '********' : null,
            emailApiKey: settings.emailApiKey ? '********' : null,
        });
    } catch (error) {
        console.error('Get platform settings error:', error);
        res.status(500).json({ error: 'Failed to fetch platform settings' });
    }
};

/**
 * Update platform settings
 */
export const updatePlatformSettings = async (req: Request, res: Response) => {
    try {
        const {
            smsProvider,
            smsApiUrl,
            smsApiKey,
            smsApiSecret,
            smsDefaultSenderId,
            smsCostPerUnit,
            emailProvider,
            emailApiKey,
            emailFromAddress,
            emailFromName,
            platformName,
            platformLogoUrl,
            supportEmail,
            supportPhone,
            allowTenantCustomSms,
            allowTenantCustomEmail,
        } = req.body;

        const updateData: any = {};

        // SMS settings
        if (smsProvider !== undefined) updateData.smsProvider = smsProvider;
        if (smsApiUrl !== undefined) updateData.smsApiUrl = smsApiUrl;
        if (smsApiKey && smsApiKey !== '********') updateData.smsApiKey = smsApiKey;
        if (smsApiSecret && smsApiSecret !== '********') updateData.smsApiSecret = smsApiSecret;
        if (smsDefaultSenderId !== undefined) updateData.smsDefaultSenderId = smsDefaultSenderId;
        if (smsCostPerUnit !== undefined) updateData.smsCostPerUnit = smsCostPerUnit;

        // Email settings
        if (emailProvider !== undefined) updateData.emailProvider = emailProvider;
        if (emailApiKey && emailApiKey !== '********') updateData.emailApiKey = emailApiKey;
        if (emailFromAddress !== undefined) updateData.emailFromAddress = emailFromAddress;
        if (emailFromName !== undefined) updateData.emailFromName = emailFromName;

        // Platform branding
        if (platformName !== undefined) updateData.platformName = platformName;
        if (platformLogoUrl !== undefined) updateData.platformLogoUrl = platformLogoUrl;
        if (supportEmail !== undefined) updateData.supportEmail = supportEmail;
        if (supportPhone !== undefined) updateData.supportPhone = supportPhone;

        // Feature toggles
        if (allowTenantCustomSms !== undefined) updateData.allowTenantCustomSms = allowTenantCustomSms;
        if (allowTenantCustomEmail !== undefined) updateData.allowTenantCustomEmail = allowTenantCustomEmail;

        // Dynamic configuration (features and tiers)
        const { availableFeatures, availableTiers } = req.body;
        if (availableFeatures !== undefined) updateData.availableFeatures = availableFeatures;
        if (availableTiers !== undefined) updateData.availableTiers = availableTiers;

        const settings = await prisma.platformSettings.upsert({
            where: { id: 'default' },
            update: updateData,
            create: { id: 'default', ...updateData },
        });

        res.json({
            message: 'Platform settings updated',
            settings: {
                ...settings,
                smsApiKey: settings.smsApiKey ? '********' : null,
                smsApiSecret: settings.smsApiSecret ? '********' : null,
                emailApiKey: settings.emailApiKey ? '********' : null,
            },
        });
    } catch (error) {
        console.error('Update platform settings error:', error);
        res.status(500).json({ error: 'Failed to update platform settings' });
    }
};

/**
 * Update tenant SMS sender ID
 */
export const updateTenantSmsConfig = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.params;
        const { smsSenderId, smsEnabled } = req.body;

        // Validate sender ID (usually 3-11 alphanumeric characters)
        if (smsSenderId && !/^[A-Za-z0-9]{3,11}$/.test(smsSenderId)) {
            return res.status(400).json({
                error: 'Invalid Sender ID',
                message: 'Sender ID must be 3-11 alphanumeric characters',
            });
        }

        const updateData: any = {};
        if (smsSenderId !== undefined) updateData.smsSenderId = smsSenderId.toUpperCase();
        if (smsEnabled !== undefined) updateData.smsEnabled = smsEnabled;

        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateData,
            select: {
                id: true,
                name: true,
                smsSenderId: true,
                smsEnabled: true,
            },
        });

        res.json({
            message: 'Tenant SMS configuration updated',
            tenant,
        });
    } catch (error) {
        console.error('Update tenant SMS config error:', error);
        res.status(500).json({ error: 'Failed to update tenant SMS config' });
    }
};

/**
 * Get SMS configuration for all tenants
 */
export const getAllTenantsSmsConfig = async (req: Request, res: Response) => {
    try {
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                tier: true,
                status: true,
                smsEnabled: true,
                smsSenderId: true,
            },
            orderBy: { name: 'asc' },
        });

        // Get platform settings
        const platformSettings = await prisma.platformSettings.findUnique({
            where: { id: 'default' },
            select: {
                smsProvider: true,
                smsDefaultSenderId: true,
                smsBalanceUnits: true,
                smsCostPerUnit: true,
            },
        });

        res.json({
            platformSettings: platformSettings || {
                smsProvider: 'zamtel',
                smsDefaultSenderId: 'SYNC',
                smsBalanceUnits: 0,
                smsCostPerUnit: 0.15,
            },
            tenants,
        });
    } catch (error) {
        console.error('Get all tenants SMS config error:', error);
        res.status(500).json({ error: 'Failed to fetch SMS configuration' });
    }
};

/**
 * Add SMS credits to platform
 */
export const addSmsCredits = async (req: Request, res: Response) => {
    try {
        const { credits } = req.body;

        if (!credits || credits <= 0) {
            return res.status(400).json({ error: 'Invalid credit amount' });
        }

        const settings = await prisma.platformSettings.update({
            where: { id: 'default' },
            data: {
                smsBalanceUnits: { increment: credits },
            },
        });

        res.json({
            message: `Added ${credits} SMS credits`,
            newBalance: settings.smsBalanceUnits,
        });
    } catch (error) {
        console.error('Add SMS credits error:', error);
        res.status(500).json({ error: 'Failed to add SMS credits' });
    }
};

// ==========================================
// SUBSCRIPTION PLAN MANAGEMENT
// ==========================================

/**
 * Get all subscription plans (Admin)
 */
export const getAllPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { subscriptionPayments: true }
                }
            }
        });
        res.json(plans);
    } catch (error) {
        console.error('Get all plans error:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
};

/**
 * Create a new subscription plan
 */
export const createPlan = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        // Ensure tier is unique
        const existing = await prisma.subscriptionPlan.findUnique({
            where: { tier: data.tier }
        });

        if (existing) {
            return res.status(400).json({ error: 'Plan with this tier already exists' });
        }

        const plan = await prisma.subscriptionPlan.create({
            data: {
                name: data.name,
                tier: data.tier,
                description: data.description || '',
                // Pricing
                monthlyPriceZMW: data.monthlyPriceZMW || 0,
                yearlyPriceZMW: data.yearlyPriceZMW || 0,
                monthlyPriceUSD: data.monthlyPriceUSD || 0,
                yearlyPriceUSD: data.yearlyPriceUSD || 0,
                // Limits
                includedStudents: data.includedStudents || data.maxStudents || 50,
                maxStudents: data.maxStudents || 50,
                maxTeachers: data.maxTeachers || 5,
                maxUsers: data.maxUsers || 10,
                maxClasses: data.maxClasses || 5,
                maxStorageGB: data.maxStorageGB || 1,
                monthlyApiCallLimit: data.monthlyApiCallLimit || 0,
                // Features
                features: data.features || [],
                isActive: data.isActive !== undefined ? data.isActive : true,
                isPopular: data.isPopular || false,
                sortOrder: data.sortOrder || 0,
            }
        });

        res.status(201).json({ message: 'Plan created successfully', plan });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ error: 'Failed to create plan' });
    }
};

/**
 * Update an existing subscription plan
 */
export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;
        const data = req.body;

        // Remove fields that shouldn't be updated directly
        const { id, createdAt, updatedAt, _count, subscriptionPayments, ...updateData } = data;

        const plan = await prisma.subscriptionPlan.update({
            where: { id: planId },
            data: updateData
        });

        res.json({ message: 'Plan updated successfully', plan });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

/**
 * Toggle plan status (Active/Inactive)
 */
export const togglePlanStatus = async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;
        const { isActive } = req.body;

        const plan = await prisma.subscriptionPlan.update({
            where: { id: planId },
            data: { isActive }
        });

        res.json({ message: `Plan marked as ${isActive ? 'active' : 'inactive'}`, plan });
    } catch (error) {
        console.error('Toggle plan status error:', error);
        res.status(500).json({ error: 'Failed to update plan status' });
    }
};
