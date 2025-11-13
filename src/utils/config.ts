import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import type { BotConfig } from '@/types';

// Load environment variables
dotenvConfig();

const configSchema = z.object({
    NODE_ENV: z.string().default('development'),
    PORT: z.string().transform(Number).default('3000'),
    HOST: z.string().default('localhost'),
    SESSION_NAME: z.string().default('whatsapp-bot-session'),
    QR_REFRESH_INTERVAL: z.string().transform(Number).default('30000'),
    RECONNECT_INTERVAL: z.string().transform(Number).default('5000'),
    MAX_RECONNECT_ATTEMPTS: z.string().transform(Number).default('10'),
    DATABASE_PATH: z.string().default('./data/whatsapp-bot.db'),
    DATABASE_BACKUP_INTERVAL: z.string().transform(Number).default('3600000'),
    LOG_LEVEL: z.string().default('info'),
    LOG_FILE: z.string().default('./logs/whatsapp-bot.log'),
    LOG_MAX_SIZE: z.string().default('10MB'),
    LOG_MAX_FILES: z.string().transform(Number).default('5'),
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('30'),
    WEBHOOK_SECRET: z.string().min(1, 'WEBHOOK_SECRET is required'),
    WEBHOOK_TIMEOUT: z.string().transform(Number).default('30000'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    API_KEY: z.string().min(1, 'API_KEY is required'),
    HEALTH_CHECK_INTERVAL: z.string().transform(Number).default('30000'),
    PLUGIN_DIR: z.string().default('./plugins'),
    AUTO_LOAD_PLUGINS: z.string().transform(Boolean).default('true'),
});

export function loadConfig(): BotConfig {
    try {
        const env = configSchema.parse(process.env);

        return {
            nodeEnv: env.NODE_ENV,
            port: env.PORT,
            host: env.HOST,
            sessionName: env.SESSION_NAME,
            qrRefreshInterval: env.QR_REFRESH_INTERVAL,
            reconnectInterval: env.RECONNECT_INTERVAL,
            maxReconnectAttempts: env.MAX_RECONNECT_ATTEMPTS,
            databasePath: env.DATABASE_PATH,
            databaseBackupInterval: env.DATABASE_BACKUP_INTERVAL,
            logLevel: env.LOG_LEVEL,
            logFile: env.LOG_FILE,
            logMaxSize: env.LOG_MAX_SIZE,
            logMaxFiles: env.LOG_MAX_FILES,
            rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
            rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
            webhookSecret: env.WEBHOOK_SECRET,
            webhookTimeout: env.WEBHOOK_TIMEOUT,
            jwtSecret: env.JWT_SECRET,
            apiKey: env.API_KEY,
            healthCheckInterval: env.HEALTH_CHECK_INTERVAL,
            pluginDir: env.PLUGIN_DIR,
            autoLoadPlugins: env.AUTO_LOAD_PLUGINS,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Configuration validation errors:');
            error.errors.forEach((err) => {
                console.error(`  ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
}

export const appConfig = loadConfig();