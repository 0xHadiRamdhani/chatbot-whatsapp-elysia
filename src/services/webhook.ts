import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { createHash, timingSafeEqual } from 'crypto';
import type { BotConfig, WebhookPayload } from '@/types';
import { logger } from '@/utils/logger';

export class WebhookService {
    private config: BotConfig;
    private secret: Uint8Array;

    constructor(config: BotConfig) {
        this.config = config;
        this.secret = new TextEncoder().encode(config.webhookSecret);
    }

    /**
     * Generate webhook signature for payload
     */
    generateSignature(payload: string): string {
        const hmac = createHash('sha256');
        hmac.update(payload + this.config.webhookSecret);
        return hmac.digest('hex');
    }

    /**
     * Verify webhook signature
     */
    verifySignature(payload: string, signature: string): boolean {
        const expectedSignature = this.generateSignature(payload);

        // Use timing-safe comparison to prevent timing attacks
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return timingSafeEqual(sigBuffer, expectedBuffer);
    }

    /**
     * Create signed JWT webhook payload
     */
    async createWebhookPayload(event: string, data: Record<string, unknown>): Promise<{
        payload: WebhookPayload;
        signature: string;
    }> {
        const timestamp = Date.now();

        const payload: WebhookPayload = {
            event,
            data,
            timestamp,
            signature: '', // Will be filled after JWT creation
        };

        // Create JWT
        const jwtPayload: JWTPayload = {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        };

        const jwt = await new SignJWT(jwtPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(this.secret);

        // Generate signature for the JWT
        const signature = this.generateSignature(jwt);

        return {
            payload: {
                ...payload,
                signature,
            },
            signature: jwt,
        };
    }

    /**
     * Verify and decode webhook JWT
     */
    async verifyWebhookPayload(jwt: string, signature: string): Promise<WebhookPayload | null> {
        try {
            // Verify JWT signature
            const { payload } = await jwtVerify(jwt, this.secret);

            // Verify webhook signature
            if (!this.verifySignature(jwt, signature)) {
                logger.warn('Webhook signature verification failed');
                return null;
            }

            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                logger.warn('Webhook payload expired');
                return null;
            }

            return payload as unknown as WebhookPayload;
        } catch (error) {
            logger.error({ err: error }, 'Webhook payload verification failed');
            return null;
        }
    }

    /**
     * Create webhook URL with signature
     */
    createWebhookUrl(baseUrl: string, event: string, data: Record<string, unknown>): Promise<string> {
        return this.createWebhookPayload(event, data).then(({ signature }) => {
            const params = new URLSearchParams({
                event,
                signature,
                timestamp: Date.now().toString(),
            });

            return `${baseUrl}?${params.toString()}`;
        });
    }

    /**
     * Parse webhook URL parameters
     */
    parseWebhookUrl(url: string): {
        event: string;
        signature: string;
        timestamp: number;
        isValid: boolean;
    } {
        try {
            const urlObj = new URL(url);
            const params = urlObj.searchParams;

            const event = params.get('event');
            const signature = params.get('signature');
            const timestamp = params.get('timestamp');

            if (!event || !signature || !timestamp) {
                return {
                    event: '',
                    signature: '',
                    timestamp: 0,
                    isValid: false,
                };
            }

            // Check timestamp freshness (prevent replay attacks)
            const now = Date.now();
            const timestampNum = parseInt(timestamp, 10);
            const timeDiff = now - timestampNum;

            if (timeDiff > this.config.webhookTimeout) {
                logger.warn({ timestamp, timeDiff }, 'Webhook URL timestamp too old');
                return {
                    event,
                    signature,
                    timestamp: timestampNum,
                    isValid: false,
                };
            }

            return {
                event,
                signature,
                timestamp: timestampNum,
                isValid: true,
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to parse webhook URL');
            return {
                event: '',
                signature: '',
                timestamp: 0,
                isValid: false,
            };
        }
    }

    /**
     * Generate API key for webhook authentication
     */
    generateApiKey(): string {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2);
        const hash = createHash('sha256');
        hash.update(timestamp + random + this.config.apiKey);
        return hash.digest('hex');
    }

    /**
     * Verify API key
     */
    verifyApiKey(apiKey: string): boolean {
        // In a real implementation, you would store and validate API keys
        // This is a simplified version
        return apiKey === this.config.apiKey;
    }

    /**
     * Create HMAC signature for request body
     */
    createHmacSignature(body: string): string {
        const hmac = createHash('sha256');
        hmac.update(body + this.config.webhookSecret);
        return hmac.digest('hex');
    }

    /**
     * Verify HMAC signature
     */
    verifyHmacSignature(body: string, signature: string): boolean {
        const expectedSignature = this.createHmacSignature(body);

        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return timingSafeEqual(sigBuffer, expectedBuffer);
    }

    /**
     * Rate limiting for webhook requests
     */
    async checkRateLimit(identifier: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: Date;
    }> {
        // This would typically integrate with your rate limiting service
        // For now, return a simple implementation
        return {
            allowed: true,
            remaining: 100,
            resetTime: new Date(Date.now() + 3600000), // 1 hour
        };
    }

    /**
     * Webhook security headers
     */
    getSecurityHeaders(): Record<string, string> {
        return {
            'X-Webhook-Signature': this.generateSignature(Date.now().toString()),
            'X-Webhook-Timestamp': Date.now().toString(),
            'X-Webhook-Version': '1.0',
            'Content-Type': 'application/json',
        };
    }

    /**
     * Validate webhook security headers
     */
    validateSecurityHeaders(headers: Record<string, string>): boolean {
        const signature = headers['x-webhook-signature'];
        const timestamp = headers['x-webhook-timestamp'];
        const version = headers['x-webhook-version'];

        if (!signature || !timestamp || !version) {
            logger.warn('Missing webhook security headers');
            return false;
        }

        // Check version
        if (version !== '1.0') {
            logger.warn({ version }, 'Invalid webhook version');
            return false;
        }

        // Check timestamp freshness
        const now = Date.now();
        const timestampNum = parseInt(timestamp, 10);
        const timeDiff = now - timestampNum;

        if (timeDiff > this.config.webhookTimeout) {
            logger.warn({ timestamp, timeDiff }, 'Webhook headers timestamp too old');
            return false;
        }

        // Verify signature
        if (!this.verifySignature(timestamp, signature)) {
            logger.warn('Invalid webhook signature in headers');
            return false;
        }

        return true;
    }

    /**
     * Create webhook response
     */
    createResponse(success: boolean, message: string, data?: Record<string, unknown>): {
        success: boolean;
        message: string;
        data?: Record<string, unknown>;
        timestamp: number;
    } {
        const response: {
            success: boolean;
            message: string;
            data?: Record<string, unknown>;
            timestamp: number;
        } = {
            success,
            message,
            timestamp: Date.now(),
        };

        if (data) {
            response.data = data;
        }

        return response;
    }

    /**
     * Log webhook activity
     */
    logWebhookActivity(event: string, data: Record<string, unknown>, success: boolean): void {
        logger.info({
            event,
            success,
            data,
            timestamp: Date.now(),
        }, 'Webhook activity');
    }
}