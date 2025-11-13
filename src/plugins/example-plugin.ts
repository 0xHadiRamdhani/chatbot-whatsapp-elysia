import type { Plugin, MiddlewareContext } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Example plugin demonstrating the plugin system
 * This plugin adds a simple greeting feature
 */
export const examplePlugin: Plugin = {
    name: 'example-plugin',
    version: '1.0.0',
    description: 'Example plugin with greeting functionality',
    author: 'Bot Developer',
    enabled: true,

    async initialize() {
        logger.info('Example plugin initialized');
    },

    async destroy() {
        logger.info('Example plugin destroyed');
    },

    async middleware(context: any, next: () => Promise<void>) {
        // Check if message contains greeting keywords
        const greetingKeywords = ['hello', 'hi', 'hey', 'greetings'];
        const message = (context.message.body ?? '').toLowerCase();

        if (greetingKeywords.some(keyword => message.includes(keyword))) {
            // Add greeting response
            const responses = [
                'Hello! 👋 How can I help you?',
                'Hi there! 😊 What can I do for you?',
                'Hey! 🎉 Nice to meet you!',
                'Greetings! 🌟 Welcome!',
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            try {
                await context.message.reply(randomResponse || 'Hello!');
                logger.info({ chatId: context.chatId }, 'Greeting response sent');
            } catch (error) {
                logger.error({ err: error }, 'Failed to send greeting response');
            }
        }

        // Continue to next middleware
        await next();
    }
};

// Export as default for dynamic loading
export default examplePlugin;