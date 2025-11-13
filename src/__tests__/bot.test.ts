import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { WhatsAppBot } from '@/services/bot';
import { appConfig } from '@/utils/config';

describe('WhatsAppBot', () => {
    let bot: WhatsAppBot;

    beforeEach(() => {
        // Create bot instance for testing
        bot = new WhatsAppBot({
            ...appConfig,
            nodeEnv: 'test',
            port: 3001, // Use different port for testing
        });
    });

    afterEach(async () => {
        // Cleanup after each test
        if (bot.isRunning()) {
            await bot.stop();
        }
    });

    describe('Initialization', () => {
        it('should create bot instance successfully', () => {
            expect(bot).toBeDefined();
            expect(bot.getConfig()).toBeDefined();
            expect(bot.getDatabase()).toBeDefined();
            expect(bot.getWhatsAppClient()).toBeDefined();
            expect(bot.getCommandManager()).toBeDefined();
            expect(bot.getMiddlewareManager()).toBeDefined();
        });

        it('should have correct initial state', () => {
            expect(bot.isRunning()).toBe(false);
            expect(bot.getUptime()).toBeGreaterThanOrEqual(0);
        });

        it('should load configuration correctly', () => {
            const config = bot.getConfig();
            expect(config.nodeEnv).toBe('test');
            expect(config.port).toBe(3001);
            expect(config.sessionName).toBe('whatsapp-bot-session');
        });
    });

    describe('Command Management', () => {
        it('should register built-in commands', () => {
            const commandManager = bot.getCommandManager();
            const commands = commandManager.getCommands();

            expect(commands.length).toBeGreaterThan(0);

            // Check for specific built-in commands
            const helpCommand = commandManager.getCommand('help');
            expect(helpCommand).toBeDefined();
            expect(helpCommand?.name).toBe('help');
            expect(helpCommand?.aliases).toContain('h');
        });

        it('should handle command aliases correctly', () => {
            const commandManager = bot.getCommandManager();

            // Test help command aliases
            const helpAliases = commandManager.getCommandAliases('help');
            expect(helpAliases).toContain('h');
            expect(helpAliases).toContain('commands');
            expect(helpAliases).toContain('cmds');
        });

        it('should categorize commands correctly', () => {
            const commandManager = bot.getCommandManager();
            const categories = commandManager.getCommandCategories();

            expect(categories).toContain('general');

            const generalCommands = commandManager.getCommandsByCategory('general');
            expect(generalCommands.length).toBeGreaterThan(0);
        });
    });

    describe('Plugin Management', () => {
        it('should have plugin manager initialized', () => {
            const pluginManager = bot.getMiddlewareManager();
            expect(pluginManager).toBeDefined();

            const stats = pluginManager.getPluginStats();
            expect(stats.totalPlugins).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Rate Limiting', () => {
        it('should have rate limiter initialized', () => {
            const rateLimiter = bot.getRateLimiter();
            expect(rateLimiter).toBeDefined();
        });

        it('should have correct rate limit configuration', () => {
            const config = bot.getConfig();
            expect(config.rateLimitWindowMs).toBe(60000);
            expect(config.rateLimitMaxRequests).toBe(30);
        });
    });

    describe('Webhook Service', () => {
        it('should have webhook service initialized', () => {
            const webhookService = bot.getWebhookService();
            expect(webhookService).toBeDefined();
        });

        it('should generate valid webhook signatures', () => {
            const webhookService = bot.getWebhookService();
            const payload = 'test-payload';
            const signature = webhookService.generateSignature(payload);

            expect(signature).toBeDefined();
            expect(signature.length).toBe(64); // SHA256 hex length
        });

        it('should verify webhook signatures correctly', () => {
            const webhookService = bot.getWebhookService();
            const payload = 'test-payload';
            const signature = webhookService.generateSignature(payload);

            const isValid = webhookService.verifySignature(payload, signature);
            expect(isValid).toBe(true);

            const isInvalid = webhookService.verifySignature(payload, 'invalid-signature');
            expect(isInvalid).toBe(false);
        });
    });

    describe('Database Service', () => {
        it('should have database service initialized', () => {
            const database = bot.getDatabase();
            expect(database).toBeDefined();
        });

        it('should handle conversation history', async () => {
            const database = bot.getDatabase();

            const conversation = {
                id: 'test-id',
                chatId: 'test-chat',
                sender: 'test-sender',
                message: 'test message',
                timestamp: new Date(),
                isCommand: false,
            };

            await database.saveConversation(conversation);

            const history = await database.getConversationHistory('test-chat', 10);
            expect(history.length).toBeGreaterThan(0);
            expect(history[0]?.message).toBe('test message');
        });

        it('should handle rate limit data', async () => {
            const database = bot.getDatabase();

            await database.updateRateLimit('test-chat', 5, Date.now() + 60000);

            const rateLimit = await database.getRateLimit('test-chat');
            expect(rateLimit).toBeDefined();
            expect(rateLimit?.count).toBe(5);
        });
    });

    describe('Statistics', () => {
        it('should provide command statistics', () => {
            const commandManager = bot.getCommandManager();
            const stats = commandManager.getCommandStats();

            expect(stats.totalCommands).toBeGreaterThan(0);
            expect(stats.totalAliases).toBeGreaterThan(0);
            expect(stats.categories.length).toBeGreaterThan(0);
            expect(stats.commandsByCategory).toBeDefined();
        });

        it('should provide plugin statistics', () => {
            const pluginManager = bot.getMiddlewareManager();
            const stats = pluginManager.getPluginStats();

            expect(stats.totalPlugins).toBeGreaterThanOrEqual(0);
            expect(stats.pluginNames).toBeDefined();
        });

        it('should provide bot statistics', () => {
            const stats = bot.getStats();

            expect(stats.uptime).toBeGreaterThanOrEqual(0);
            expect(stats.memory).toBeDefined();
            expect(stats.commands).toBeDefined();
            expect(stats.plugins).toBeDefined();
            expect(stats.whatsapp).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid command registration gracefully', () => {
            const commandManager = bot.getCommandManager();

            // Try to register invalid command
            const invalidCommand = {
                name: '',
                aliases: [],
                description: 'Invalid command',
                usage: '!invalid',
                category: 'test',
                cooldown: 0,
                execute: async () => { },
            };

            expect(() => {
                commandManager.registerCommand(invalidCommand);
            }).toThrow();
        });

        it('should handle command validation', () => {
            const commandManager = bot.getCommandManager();

            const invalidCommand = {
                name: 'test',
                // Missing required execute function
            };

            const errors = commandManager.validateCommand(invalidCommand);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors).toContain('Command execute function is required');
        });
    });
});

describe('Configuration', () => {
    it('should load configuration correctly', () => {
        const config = appConfig;

        expect(config).toBeDefined();
        expect(config.port).toBeGreaterThan(0);
        expect(config.host).toBeDefined();
        expect(config.sessionName).toBeDefined();
        expect(config.databasePath).toBeDefined();
    });

    it('should have valid rate limit configuration', () => {
        const config = appConfig;

        expect(config.rateLimitWindowMs).toBeGreaterThan(0);
        expect(config.rateLimitMaxRequests).toBeGreaterThan(0);
    });

    it('should have valid webhook configuration', () => {
        const config = appConfig;

        expect(config.webhookSecret).toBeDefined();
        expect(config.webhookSecret.length).toBeGreaterThan(0);
        expect(config.jwtSecret).toBeDefined();
        expect(config.jwtSecret.length).toBeGreaterThan(0);
        expect(config.apiKey).toBeDefined();
        expect(config.apiKey.length).toBeGreaterThan(0);
    });
});