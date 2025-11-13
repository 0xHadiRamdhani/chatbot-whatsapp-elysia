import { WhatsAppBot } from '@/services/bot';
import { appConfig } from '@/utils/config';
import { logger } from '@/utils/logger';

async function main() {
  try {
    logger.info('Starting WhatsApp Bot Application');
    logger.info({ config: appConfig }, 'Configuration loaded');

    // Create and start the bot
    const bot = new WhatsAppBot(appConfig);

    // Load plugins if auto-load is enabled
    await bot.loadPlugins();

    // Start the bot
    await bot.start();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await bot.stop();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      logger.error({ err: error }, 'Uncaught exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled rejection');
      process.exit(1);
    });

  } catch (error) {
    logger.error({ err: error }, 'Failed to start WhatsApp bot');
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch((error) => {
    logger.error({ err: error }, 'Application startup failed');
    process.exit(1);
  });
}

export { WhatsAppBot } from '@/services/bot';
export { appConfig } from '@/utils/config';
export { logger } from '@/utils/logger';
export * from '@/types';
