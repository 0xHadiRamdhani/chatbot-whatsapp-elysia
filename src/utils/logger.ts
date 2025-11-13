import pino from 'pino';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type { LoggerConfig } from '@/types';

export function createLogger(config: LoggerConfig): pino.Logger {
    // Ensure log directory exists
    const logDir = dirname(config.file);
    try {
        mkdirSync(logDir, { recursive: true });
    } catch (error) {
        console.warn(`Failed to create log directory: ${logDir}`, error);
    }

    const logger = pino({
        level: config.level as pino.Level,
    });

    // File transport for production
    if (config.level !== 'silent') {
        const fileTransport = pino.destination({
            dest: config.file,
            sync: false,
            minLength: 4096,
        });

        const fileLogger = pino(
            {
                level: config.level as pino.Level,
            },
            fileTransport
        );

        // Create a wrapper that logs to both console and file
        return logger.child({
            logToFile: (level: pino.Level, msg: string, ...args: any[]) => {
                fileLogger[level](msg, ...args);
                logger[level](msg, ...args);
            },
        });
    }

    return logger;
}

export const logger = createLogger({
    level: (process.env['LOG_LEVEL'] as string) || 'info',
    file: (process.env['LOG_FILE'] as string) || './logs/whatsapp-bot.log',
    maxSize: (process.env['LOG_MAX_SIZE'] as string) || '10MB',
    maxFiles: Number(process.env['LOG_MAX_FILES']) || 5,
    prettyPrint: (process.env['NODE_ENV'] as string) !== 'production',
});