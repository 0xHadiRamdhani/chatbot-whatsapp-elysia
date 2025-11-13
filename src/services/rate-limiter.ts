import { RateLimiterMemory, RateLimiterUnion, IRateLimiterStoreOptions } from 'rate-limiter-flexible';
import type { RateLimitEntry } from '@/types';
import { logger } from '@/utils/logger';
import { DatabaseService } from '@/database';

export class RateLimiterService {
    private rateLimiter: RateLimiterMemory;
    private database: DatabaseService;
    private windowMs: number;
    private maxRequests: number;

    constructor(
        windowMs: number,
        maxRequests: number,
        database: DatabaseService
    ) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.database = database;

        this.rateLimiter = new RateLimiterMemory({
            keyPrefix: 'whatsapp_bot',
            points: maxRequests,
            duration: windowMs / 1000, // Convert to seconds
        });

        // Cleanup expired rate limits periodically
        setInterval(() => {
            this.cleanupExpiredRateLimits();
        }, 60000); // Every minute
    }

    async checkRateLimit(chatId: string): Promise<{
        allowed: boolean;
        remainingPoints: number;
        msBeforeNext: number;
    }> {
        try {
            // Check in-memory rate limiter first
            const rateLimiterRes = await this.rateLimiter.consume(chatId);

            // Also check database for persistence across restarts
            const dbRateLimit = await this.database.getRateLimit(chatId);
            const now = Date.now();

            if (dbRateLimit) {
                if (dbRateLimit.resetTime < now) {
                    // Reset expired rate limit
                    await this.database.updateRateLimit(chatId, 1, now + this.windowMs);
                } else if (dbRateLimit.count >= this.maxRequests) {
                    // Rate limit exceeded in database
                    return {
                        allowed: false,
                        remainingPoints: 0,
                        msBeforeNext: dbRateLimit.resetTime - now,
                    };
                } else {
                    // Increment database counter
                    await this.database.updateRateLimit(
                        chatId,
                        dbRateLimit.count + 1,
                        dbRateLimit.resetTime
                    );
                }
            } else {
                // Create new rate limit entry
                await this.database.updateRateLimit(chatId, 1, now + this.windowMs);
            }

            return {
                allowed: true,
                remainingPoints: rateLimiterRes.remainingPoints,
                msBeforeNext: rateLimiterRes.msBeforeNext,
            };
        } catch (rateLimiterRes) {
            // Rate limit exceeded
            if (rateLimiterRes instanceof Error) {
                logger.error({ err: rateLimiterRes }, 'Rate limiter error');
                return {
                    allowed: true, // Allow on error to avoid blocking
                    remainingPoints: this.maxRequests,
                    msBeforeNext: 0,
                };
            }

            return {
                allowed: false,
                remainingPoints: 0,
                msBeforeNext: (rateLimiterRes as any).msBeforeNext,
            };
        }
    }

    async resetRateLimit(chatId: string): Promise<void> {
        try {
            // Reset in-memory rate limiter
            await this.rateLimiter.delete(chatId);

            // Reset database rate limit
            await this.database.updateRateLimit(chatId, 0, Date.now());

            logger.info('Rate limit reset');
        } catch (error) {
            logger.error({ err: error }, 'Failed to reset rate limit');
            throw error;
        }
    }

    async getRateLimitStatus(chatId: string): Promise<{
        current: number;
        limit: number;
        remaining: number;
        resetTime: Date;
    }> {
        try {
            const dbRateLimit = await this.database.getRateLimit(chatId);
            const now = Date.now();

            if (!dbRateLimit || dbRateLimit.resetTime < now) {
                return {
                    current: 0,
                    limit: this.maxRequests,
                    remaining: this.maxRequests,
                    resetTime: new Date(now + this.windowMs),
                };
            }

            return {
                current: dbRateLimit.count,
                limit: this.maxRequests,
                remaining: Math.max(0, this.maxRequests - dbRateLimit.count),
                resetTime: new Date(dbRateLimit.resetTime),
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to get rate limit status');
            throw error;
        }
    }

    private async cleanupExpiredRateLimits(): Promise<void> {
        try {
            await this.database.cleanupExpiredRateLimits();
            logger.info('Expired rate limits cleaned up');
        } catch (error) {
            logger.error({ err: error }, 'Failed to cleanup expired rate limits');
        }
    }

    // Batch rate limit check for multiple chat IDs
    async checkBatchRateLimits(chatIds: string[]): Promise<Record<string, {
        allowed: boolean;
        remainingPoints: number;
        msBeforeNext: number;
    }>> {
        const results: Record<string, {
            allowed: boolean;
            remainingPoints: number;
            msBeforeNext: number;
        }> = {};

        for (const chatId of chatIds) {
            results[chatId] = await this.checkRateLimit(chatId);
        }

        return results;
    }

    // Get global rate limiting statistics
    async getGlobalStats(): Promise<{
        totalRateLimited: number;
        averageRequestsPerMinute: number;
        topRateLimitedChats: Array<{ chatId: string; count: number }>;
    }> {
        try {
            // This would typically involve more complex queries
            // For now, return basic stats
            return {
                totalRateLimited: 0,
                averageRequestsPerMinute: 0,
                topRateLimitedChats: [],
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to get global rate limit stats');
            throw error;
        }
    }

    // Dynamic rate limit adjustment
    async updateRateLimits(windowMs: number, maxRequests: number): Promise<void> {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        // Update the in-memory rate limiter
        this.rateLimiter = new RateLimiterMemory({
            keyPrefix: 'whatsapp_bot',
            points: maxRequests,
            duration: windowMs / 1000,
        });

        logger.info('Rate limits updated');
    }
}