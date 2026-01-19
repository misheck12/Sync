/**
 * Email Queue Service
 * 
 * Simple in-memory queue to handle email rate limiting.
 * Processes emails sequentially with configurable delays to avoid Gmail rate limits.
 */

import { sendEmailForTenant } from './emailService';

interface QueuedEmail {
    id: string;
    tenantId: string;
    to: string;
    subject: string;
    html: string;
    retries: number;
    addedAt: Date;
}

class EmailQueueService {
    private queue: QueuedEmail[] = [];
    private isProcessing: boolean = false;
    private delayMs: number = 1500; // 1.5 seconds between emails (safe for Gmail)
    private maxRetries: number = 3;
    private retryDelayMs: number = 5000; // 5 seconds before retry

    /**
     * Add an email to the queue
     */
    enqueue(tenantId: string, to: string, subject: string, html: string): string {
        const id = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        this.queue.push({
            id,
            tenantId,
            to,
            subject,
            html,
            retries: 0,
            addedAt: new Date(),
        });

        console.log(`📧 Email queued [${id}] to: ${to} | Queue size: ${this.queue.length}`);

        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }

        return id;
    }

    /**
     * Add multiple emails to the queue
     */
    enqueueBatch(emails: Array<{ tenantId: string; to: string; subject: string; html: string }>): string[] {
        const ids: string[] = [];
        for (const email of emails) {
            const id = this.enqueue(email.tenantId, email.to, email.subject, email.html);
            ids.push(id);
        }
        return ids;
    }

    /**
     * Process the queue
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;

        this.isProcessing = true;
        console.log('🚀 Email queue processor started');

        while (this.queue.length > 0) {
            const email = this.queue.shift();
            if (!email) continue;

            try {
                console.log(`📤 Sending email [${email.id}] to: ${email.to}`);
                const success = await sendEmailForTenant(email.tenantId, email.to, email.subject, email.html);

                if (success) {
                    console.log(`✅ Email sent [${email.id}] to: ${email.to}`);
                } else {
                    // Retry logic
                    if (email.retries < this.maxRetries) {
                        email.retries++;
                        console.log(`⚠️ Email failed, retrying (${email.retries}/${this.maxRetries}) [${email.id}]`);
                        this.queue.push(email); // Add back to queue
                        await this.sleep(this.retryDelayMs);
                    } else {
                        console.error(`❌ Email permanently failed after ${this.maxRetries} retries [${email.id}] to: ${email.to}`);
                    }
                }
            } catch (error: any) {
                // Check for temporary Gmail errors (421)
                if (error?.responseCode === 421) {
                    if (email.retries < this.maxRetries) {
                        email.retries++;
                        console.log(`⏳ Gmail rate limit hit, retrying in ${this.retryDelayMs}ms (${email.retries}/${this.maxRetries})`);
                        this.queue.unshift(email); // Add to front of queue for immediate retry
                        await this.sleep(this.retryDelayMs);
                    } else {
                        console.error(`❌ Email failed due to rate limiting [${email.id}] to: ${email.to}`);
                    }
                } else {
                    console.error(`❌ Email error [${email.id}]:`, error.message);
                }
            }

            // Delay before next email to avoid rate limiting
            if (this.queue.length > 0) {
                await this.sleep(this.delayMs);
            }
        }

        this.isProcessing = false;
        console.log('✅ Email queue processor finished');
    }

    /**
     * Get queue status
     */
    getStatus(): { queueSize: number; isProcessing: boolean } {
        return {
            queueSize: this.queue.length,
            isProcessing: this.isProcessing,
        };
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Set delay between emails (in milliseconds)
     */
    setDelay(ms: number): void {
        this.delayMs = ms;
    }
}

// Singleton instance
export const emailQueue = new EmailQueueService();

/**
 * Queue an email for sending (non-blocking)
 */
export const queueEmail = (tenantId: string, to: string, subject: string, html: string): string => {
    return emailQueue.enqueue(tenantId, to, subject, html);
};

/**
 * Queue multiple emails for sending
 */
export const queueEmails = (emails: Array<{ tenantId: string; to: string; subject: string; html: string }>): string[] => {
    return emailQueue.enqueueBatch(emails);
};

/**
 * Get email queue status
 */
export const getEmailQueueStatus = () => {
    return emailQueue.getStatus();
};

export default emailQueue;
