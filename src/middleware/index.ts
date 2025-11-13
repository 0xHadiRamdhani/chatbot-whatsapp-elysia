import type { MiddlewareFunction, MiddlewareContext, Plugin } from '@/types';
import { logger } from '@/utils/logger';

export class MiddlewareManager {
    private middlewares: MiddlewareFunction[] = [];
    private plugins: Map<string, Plugin> = new Map();
    private pluginMiddlewares: Map<string, MiddlewareFunction[]> = new Map();

    use(middleware: MiddlewareFunction): void {
        this.middlewares.push(middleware);
        logger.info(`Middleware registered: ${middleware.name || 'anonymous'}`);
    }

    async execute(context: MiddlewareContext): Promise<void> {
        let index = 0;

        const next = async (): Promise<void> => {
            if (index >= this.middlewares.length) {
                return;
            }

            const middleware = this.middlewares[index++];
            if (middleware) {
                await middleware(context, next);
            }
        };

        await next();
    }

    registerPlugin(plugin: Plugin): void {
        if (!plugin.name || !plugin.initialize || !plugin.destroy) {
            throw new Error('Plugin must have name, initialize, and destroy methods');
        }

        // Check for duplicate plugin
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin already registered: ${plugin.name}`);
        }

        this.plugins.set(plugin.name, plugin);
        logger.info(`Plugin registered: ${plugin.name} v${plugin.version}`);

        // Register plugin middleware if provided
        if (plugin.middleware) {
            const pluginMiddlewares = this.pluginMiddlewares.get(plugin.name) || [];
            pluginMiddlewares.push(plugin.middleware);
            this.pluginMiddlewares.set(plugin.name, pluginMiddlewares);
            this.use(plugin.middleware);
        }

        // Initialize plugin
        if (plugin.enabled) {
            this.initializePlugin(plugin);
        }
    }

    unregisterPlugin(pluginName: string): void {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginName}`);
        }

        // Destroy plugin
        this.destroyPlugin(plugin);

        // Remove plugin middlewares
        const pluginMiddlewares = this.pluginMiddlewares.get(pluginName);
        if (pluginMiddlewares) {
            this.middlewares = this.middlewares.filter(middleware =>
                !pluginMiddlewares.includes(middleware)
            );
            this.pluginMiddlewares.delete(pluginName);
        }

        // Remove plugin
        this.plugins.delete(pluginName);
        logger.info(`Plugin unregistered: ${pluginName}`);
    }

    private async initializePlugin(plugin: Plugin): Promise<void> {
        try {
            await plugin.initialize();
            logger.info(`Plugin initialized: ${plugin.name}`);
        } catch (error) {
            logger.error({ err: error }, `Failed to initialize plugin: ${plugin.name}`);
            throw error;
        }
    }

    private async destroyPlugin(plugin: Plugin): Promise<void> {
        try {
            await plugin.destroy();
            logger.info(`Plugin destroyed: ${plugin.name}`);
        } catch (error) {
            logger.error({ err: error }, `Failed to destroy plugin: ${plugin.name}`);
            // Don't throw error to allow plugin unregistration even if destroy fails
        }
    }

    enablePlugin(pluginName: string): void {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginName}`);
        }

        if (!plugin.enabled) {
            plugin.enabled = true;
            this.initializePlugin(plugin);
            logger.info(`Plugin enabled: ${pluginName}`);
        }
    }

    disablePlugin(pluginName: string): void {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginName}`);
        }

        if (plugin.enabled) {
            plugin.enabled = false;
            this.destroyPlugin(plugin);
            logger.info(`Plugin disabled: ${pluginName}`);
        }
    }

    getPlugin(name: string): Plugin | null {
        return this.plugins.get(name) || null;
    }

    getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    getEnabledPlugins(): Plugin[] {
        return this.getPlugins().filter(plugin => plugin.enabled);
    }

    getDisabledPlugins(): Plugin[] {
        return this.getPlugins().filter(plugin => !plugin.enabled);
    }

    getPluginStats(): {
        totalPlugins: number;
        enabledPlugins: number;
        disabledPlugins: number;
        pluginNames: string[];
    } {
        const plugins = this.getPlugins();
        return {
            totalPlugins: plugins.length,
            enabledPlugins: this.getEnabledPlugins().length,
            disabledPlugins: this.getDisabledPlugins().length,
            pluginNames: plugins.map(p => p.name),
        };
    }

    // Load plugins from directory
    async loadPluginsFromDirectory(pluginDir: string): Promise<void> {
        try {
            const { readdir } = await import('fs/promises');
            const { join } = await import('path');

            const files = await readdir(pluginDir);

            for (const file of files) {
                if (file.endsWith('.js') || file.endsWith('.ts')) {
                    try {
                        const pluginPath = join(pluginDir, file);
                        const pluginModule = await import(pluginPath);

                        if (pluginModule.default && typeof pluginModule.default === 'object') {
                            const plugin = pluginModule.default as Plugin;
                            this.registerPlugin(plugin);
                        } else if (typeof pluginModule === 'object' && pluginModule.plugin) {
                            const plugin = pluginModule.plugin as Plugin;
                            this.registerPlugin(plugin);
                        }
                    } catch (error) {
                        logger.error({ err: error }, `Failed to load plugin: ${file}`);
                    }
                }
            }
        } catch (error) {
            logger.error({ err: error }, 'Failed to load plugins from directory');
        }
    }

    // Cleanup resources
    async cleanup(): Promise<void> {
        // Destroy all plugins
        for (const plugin of this.getEnabledPlugins()) {
            try {
                await this.destroyPlugin(plugin);
            } catch (error) {
                logger.error({ err: error }, `Error destroying plugin during cleanup: ${plugin.name}`);
            }
        }

        // Clear middlewares
        this.middlewares = [];
        this.pluginMiddlewares.clear();

        logger.info('Middleware manager cleaned up');
    }
}

// Built-in middleware
export const builtinMiddlewares = {
    // Rate limiting middleware
    rateLimit: (rateLimiter: any) => {
        return async (context: MiddlewareContext, next: () => Promise<void>): Promise<void> => {
            try {
                const result = await rateLimiter.checkRateLimit(context.chatId);
                if (!result.allowed) {
                    logger.warn(`Rate limit exceeded for chat: ${context.chatId}`);
                    return;
                }
                await next();
            } catch (error) {
                logger.error({ err: error }, 'Rate limiting middleware error');
                await next(); // Allow on error
            }
        };
    },

    // Logging middleware
    logging: async (context: MiddlewareContext, next: () => Promise<void>): Promise<void> => {
        const start = Date.now();
        logger.info({
            chatId: context.chatId,
            sender: context.sender,
            message: context.message.body ?? '',
        }, 'Processing message');

        await next();

        const duration = Date.now() - start;
        logger.info({
            chatId: context.chatId,
            duration,
        }, 'Message processed');
    },

    // Permission middleware
    permission: (requiredPermission: string) => {
        return async (context: MiddlewareContext, next: () => Promise<void>): Promise<void> => {
            // Implement permission checking logic
            // This is a placeholder - implement based on your permission system
            const hasPermission = true; // Placeholder

            if (!hasPermission) {
                logger.warn(`Permission denied: ${requiredPermission} for chat: ${context.chatId}`);
                return;
            }

            await next();
        };
    },

    // Error handling middleware
    errorHandler: async (context: MiddlewareContext, next: () => Promise<void>): Promise<void> => {
        try {
            await next();
        } catch (error) {
            logger.error({ err: error }, 'Error in message processing');

            // Send error message to user
            try {
                await context.message.reply('An error occurred while processing your message. Please try again later.');
            } catch (replyError) {
                logger.error({ err: replyError }, 'Failed to send error reply');
            }
        }
    },

    // Command processing middleware
    commandProcessor: (commandManager: any) => {
        return async (context: MiddlewareContext, next: () => Promise<void>): Promise<void> => {
            try {
                const processed = await commandManager.executeCommand(context);
                if (processed) {
                    return; // Stop processing if command was executed
                }
            } catch (error) {
                logger.error({ err: error }, 'Error processing command');
            }

            await next();
        };
    },
};