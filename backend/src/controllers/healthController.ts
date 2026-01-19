import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';

const prisma = new PrismaClient();

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number; // seconds
    timestamp: string;
    system: {
        memoryUsage: {
            rss: number; // MB
            heapTotal: number; // MB
            heapUsed: number; // MB
        };
        cpuLoad: number[];
        osUptime: number; // seconds
    };
    database: {
        status: 'connected' | 'disconnected';
        latencyMs: number;
    };
}

export const getSystemHealth = async (req: Request, res: Response) => {
    const start = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbLatency = 0;

    try {
        // Check DB connection
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
        dbLatency = Date.now() - start;
    } catch (error) {
        console.error('Health check DB error:', error);
    }

    const used = process.memoryUsage();

    const healthData: HealthStatus = {
        status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        system: {
            memoryUsage: {
                rss: Math.round(used.rss / 1024 / 1024),
                heapTotal: Math.round(used.heapTotal / 1024 / 1024),
                heapUsed: Math.round(used.heapUsed / 1024 / 1024),
            },
            cpuLoad: os.loadavg(),
            osUptime: os.uptime(),
        },
        database: {
            status: dbStatus,
            latencyMs: dbLatency,
        }
    };

    // If DB latency is high, mark degraded
    if (dbStatus === 'connected' && dbLatency > 500) {
        healthData.status = 'degraded';
    }

    const statusCode = healthData.status === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(healthData);
};
