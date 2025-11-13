import { Elysia } from 'elysia';
import type { BotConfig, HealthStatus, CommandContext, MiddlewareContext } from '@/types';
import { logger } from '@/utils/logger';
import { appConfig } from '@/utils/config';
import { DatabaseService } from '@/database';
import { WhatsAppClient } from '@/services/whatsapp-client';
import { RateLimiterService } from '@/services/rate-limiter';
import { WebhookService } from '@/services/webhook';
import { CommandManager, builtinCommands } from '@/commands';
import { MiddlewareManager, builtinMiddlewares } from '@/middleware';

export class WhatsAppBot {
    private config: BotConfig;
    private database: DatabaseService;
    private whatsappClient: WhatsAppClient;
    private rateLimiter: RateLimiterService;
    private webhookService: WebhookService;
    private commandManager: CommandManager;
    private middlewareManager: MiddlewareManager;
    private httpServer: Elysia;
    private running = false;
    private startTime = Date.now();

    constructor(config: BotConfig = appConfig) {
        this.config = config;

        // Initialize services
        this.database = new DatabaseService(config.databasePath, config.databaseBackupInterval);
        this.whatsappClient = new WhatsAppClient(config, this.database);
        this.rateLimiter = new RateLimiterService(
            config.rateLimitWindowMs,
            config.rateLimitMaxRequests,
            this.database
        );
        this.webhookService = new WebhookService(config);
        this.commandManager = new CommandManager();
        this.middlewareManager = new MiddlewareManager();

        // Initialize HTTP server
        this.httpServer = new Elysia();
        this.setupHttpServer();

        // Setup event handlers
        this.setupEventHandlers();

        // Register built-in commands
        this.registerBuiltinCommands();

        // Register built-in middleware
        this.registerBuiltinMiddleware();
    }

    private setupHttpServer(): void {
        // Health check endpoint
        this.httpServer.get('/health', async () => {
            const healthStatus = await this.getHealthStatus();
            return {
                status: healthStatus.status,
                timestamp: healthStatus.timestamp,
                checks: healthStatus.checks,
            };
        });

        // Status endpoint
        this.httpServer.get('/status', async () => {
            return {
                status: 'running',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
                platform: process.platform,
                whatsapp: {
                    connected: this.whatsappClient.isReady(),
                    reconnectAttempts: this.whatsappClient.getReconnectAttempts(),
                    isReconnecting: this.whatsappClient.isReconnecting(),
                },
                commands: this.commandManager.getCommandStats(),
                plugins: this.middlewareManager.getPluginStats(),
            };
        });

        // Webhook endpoint
        this.httpServer.post('/webhook', async (context) => {
            try {
                const body = await context.request.text();
                const signature = context.request.headers.get('x-webhook-signature') || '';

                // Verify webhook signature
                if (!this.webhookService.verifyHmacSignature(body, signature)) {
                    return { error: 'Invalid signature' };
                }

                // Parse webhook payload
                const payload = JSON.parse(body);

                // Process webhook event
                await this.processWebhookEvent(payload);

                return { success: true, message: 'Webhook processed' };
            } catch (error) {
                logger.error({ err: error }, 'Webhook processing failed');
                return { error: 'Webhook processing failed' };
            }
        });

        // Command stats endpoint
        this.httpServer.get('/commands', async () => {
            return this.commandManager.getCommandStats();
        });

        // Plugin stats endpoint
        this.httpServer.get('/plugins', async () => {
            return this.middlewareManager.getPluginStats();
        });

        // Rate limit stats endpoint
        this.httpServer.get('/rate-limits', async () => {
            return {
                windowMs: this.config.rateLimitWindowMs,
                maxRequests: this.config.rateLimitMaxRequests,
            };
        });

        // Default route
        this.httpServer.get('/', () => {
            return {
                name: 'WhatsApp Bot',
                version: '1.0.0',
                status: this.running ? 'running' : 'stopped',
                endpoints: [
                    '/health - Health check',
                    '/status - Bot status',
                    '/webhook - Webhook endpoint',
                    '/commands - Command statistics',
                    '/plugins - Plugin statistics',
                    '/rate-limits - Rate limiting configuration',
                ],
            };
        });
    }

    private setupEventHandlers(): void {
        // WhatsApp client events
        this.whatsappClient.on('ready', () => {
            logger.info('WhatsApp client ready');
        });

        this.whatsappClient.on('qr', (qr: string) => {
            logger.info('QR Code generated');
        });

        this.whatsappClient.on('qr_refresh', () => {
            logger.info('QR Code refreshed');
        });

        this.whatsappClient.on('message_received', (message) => {
            this.processMessage(message);
        });

        this.whatsappClient.on('disconnected', (reason: string) => {
            logger.warn({ reason }, 'WhatsApp client disconnected');
        });

        this.whatsappClient.on('reconnect_failed', (error: Error) => {
            logger.error({ err: error }, 'WhatsApp reconnection failed');
        });

        this.whatsappClient.on('max_reconnect_attempts_reached', () => {
            logger.error('Max reconnection attempts reached');
            this.stop();
        });

        // Database cleanup
        setInterval(() => {
            this.database.cleanup();
        }, 24 * 60 * 60 * 1000); // Daily cleanup
    }

    private registerBuiltinCommands(): void {
        for (const command of builtinCommands) {
            this.commandManager.registerCommand(command);
        }
        logger.info('Built-in commands registered');
    }

    private registerBuiltinMiddleware(): void {
        // Rate limiting middleware
        this.middlewareManager.use(
            builtinMiddlewares.rateLimit(this.rateLimiter)
        );

        // Logging middleware
        this.middlewareManager.use(builtinMiddlewares.logging);

        // Error handling middleware
        this.middlewareManager.use(builtinMiddlewares.errorHandler);

        // Command processing middleware
        this.middlewareManager.use(
            builtinMiddlewares.commandProcessor(this.commandManager)
        );

        logger.info('Built-in middleware registered');
    }

    private async processMessage(message: any): Promise<void> {
        try {
            // Create middleware context
            const context: MiddlewareContext = {
                message,
                args: [],
                chatId: message.from,
                sender: message.from,
                isGroup: message.from.endsWith('@g.us'),
                timestamp: new Date(message.timestamp * 1000),
                bot: this,
                config: this.config,
                logger,
                database: this.database,
            };

            // Execute middleware chain
            await this.middlewareManager.execute(context);
        } catch (error) {
            logger.error({ err: error }, 'Error processing message');
        }
    }

    private async processWebhookEvent(payload: any): Promise<void> {
        try {
            logger.info({ event: payload.event }, 'Processing webhook event');

            // Handle different webhook events
            switch (payload.event) {
                case 'message':
                    // Process webhook message
                    if (payload.data && payload.data.message) {
                        await this.processMessage(payload.data.message);
                    }
                    break;

                case 'command':
                    // Execute command via webhook
                    if (payload.data && payload.data.command) {
                        const command = this.commandManager.getCommand(payload.data.command);
                        if (command) {
                            // Create mock message for webhook command
                            const mockMessage = {
                                id: {
                                    fromMe: false,
                                    remote: payload.data.chatId || 'webhook',
                                    id: `webhook-${Date.now()}`,
                                    _serialized: `webhook-${Date.now()}`,
                                },
                                ack: 1,
                                hasMedia: false,
                                body: `!${payload.data.command} ${payload.data.args?.join(' ') || ''}`,
                                type: 'chat',
                                timestamp: Date.now() / 1000,
                                from: payload.data.chatId || 'webhook',
                                to: 'bot',
                                author: undefined,
                                deviceType: 'web',
                                isForwarded: false,
                                isStatus: false,
                                broadcast: false,
                                fromMe: false,
                                hasQuotedMsg: false,
                                hasReaction: false,
                                duration: undefined,
                                location: undefined,
                                vCards: [],
                                inviteV4: undefined,
                                mentionedIds: [],
                                orderId: undefined,
                                token: undefined,
                                isGif: false,
                                isStarred: false,
                                isEphemeral: undefined,
                                links: [],
                                reply: async (text: string) => {
                                    logger.info({ text, command: payload.data.command }, 'Webhook command reply');
                                    return Promise.resolve();
                                },
                                react: async (reaction: string) => {
                                    logger.info({ reaction, command: payload.data.command }, 'Webhook command reaction');
                                    return Promise.resolve();
                                },
                                delete: async () => {
                                    logger.info({ command: payload.data.command }, 'Webhook command delete');
                                    return Promise.resolve();
                                },
                                downloadMedia: async () => {
                                    return undefined;
                                },
                                getChat: async () => {
                                    return Promise.resolve(undefined);
                                },
                                getContact: async () => {
                                    return Promise.resolve(undefined);
                                },
                                getMentions: async () => {
                                    return Promise.resolve([]);
                                },
                                getQuotedMessage: async () => {
                                    return Promise.resolve(undefined);
                                },
                                star: async () => {
                                    return Promise.resolve();
                                },
                                unstar: async () => {
                                    return Promise.resolve();
                                },
                            };

                            // Create webhook command context
                            const context: CommandContext = {
                                message: mockMessage as any,
                                args: payload.data.args || [],
                                chatId: payload.data.chatId || 'webhook',
                                sender: 'webhook',
                                isGroup: false,
                                timestamp: new Date(),
                            };

                            await command.execute(context);
                        }
                    }
                    break;

                case 'broadcast':
                    // Broadcast message to multiple chats
                    if (payload.data && payload.data.message && payload.data.chatIds) {
                        for (const chatId of payload.data.chatIds) {
                            await this.whatsappClient.sendMessage(chatId, payload.data.message);
                        }
                    }
                    break;

                default:
                    logger.warn({ event: payload.event }, 'Unknown webhook event');
            }
        } catch (error) {
            logger.error({ err: error }, 'Error processing webhook event');
            throw error;
        }
    }

    private async getHealthStatus(): Promise<HealthStatus> {
        const checks = {
            database: this.database.getDatabase().open,
            whatsapp: this.whatsappClient.isReady(),
            memory: process.memoryUsage().heapUsed < 100 * 1024 * 1024, // Less than 100MB
            uptime: process.uptime(),
        };

        const status: 'healthy' | 'unhealthy' | 'degraded' =
            checks.database && checks.whatsapp && checks.memory
                ? 'healthy'
                : checks.database || checks.whatsapp
                    ? 'degraded'
                    : 'unhealthy';

        return {
            status,
            timestamp: new Date(),
            checks,
        };
    }

    async start(): Promise<void> {
        if (this.running) {
            logger.warn('Bot is already running');
            return;
        }

        try {
            logger.info('Starting WhatsApp bot');

            // Start HTTP server
            this.httpServer.listen(this.config.port, () => {
                logger.info(`HTTP server started on port ${this.config.port}`);
            });

            // Initialize WhatsApp client
            await this.whatsappClient.initialize();

            this.running = true;
            this.startTime = Date.now();

            logger.info('WhatsApp bot started successfully');
        } catch (error) {
            logger.error({ err: error }, 'Failed to start WhatsApp bot');
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.warn('Bot is not running');
            return;
        }

        try {
            logger.info('Stopping WhatsApp bot');

            this.running = false;

            // Stop HTTP server
            // Note: Elysia doesn't have a built-in stop method, so we just log
            logger.info('HTTP server stopped');

            // Destroy WhatsApp client
            await this.whatsappClient.destroy();

            // Cleanup middleware
            await this.middlewareManager.cleanup();

            // Close database
            this.database.close();

            logger.info('WhatsApp bot stopped');
        } catch (error) {
            logger.error({ err: error }, 'Error stopping WhatsApp bot');
            throw error;
        }
    }

    // Public API methods
    getConfig(): BotConfig {
        return this.config;
    }

    getDatabase(): DatabaseService {
        return this.database;
    }

    getWhatsAppClient(): WhatsAppClient {
        return this.whatsappClient;
    }

    getCommandManager(): CommandManager {
        return this.commandManager;
    }

    getMiddlewareManager(): MiddlewareManager {
        return this.middlewareManager;
    }

    getRateLimiter(): RateLimiterService {
        return this.rateLimiter;
    }

    getWebhookService(): WebhookService {
        return this.webhookService;
    }

    isRunning(): boolean {
        return this.running;
    }

    getUptime(): number {
        return Date.now() - this.startTime;
    }

    // Plugin management
    async loadPlugins(): Promise<void> {
        if (this.config.autoLoadPlugins) {
            await this.middlewareManager.loadPluginsFromDirectory(this.config.pluginDir);
        }
    }

    // Command management
    registerCommand(command: any): void {
        this.commandManager.registerCommand(command);
    }

    unregisterCommand(commandName: string): void {
        this.commandManager.unregisterCommand(commandName);
    }

    // Middleware management
    use(middleware: any): void {
        this.middlewareManager.use(middleware);
    }

    // Send message
    async sendMessage(chatId: string, message: string): Promise<any> {
        return await this.whatsappClient.sendMessage(chatId, message);
    }

    // Get stats
    getStats(): any {
        return {
            uptime: this.getUptime(),
            memory: process.memoryUsage(),
            commands: this.commandManager.getCommandStats(),
            plugins: this.middlewareManager.getPluginStats(),
            whatsapp: {
                connected: this.whatsappClient.isReady(),
                reconnectAttempts: this.whatsappClient.getReconnectAttempts(),
                isReconnecting: this.whatsappClient.isReconnecting(),
            },
        };
    }
}