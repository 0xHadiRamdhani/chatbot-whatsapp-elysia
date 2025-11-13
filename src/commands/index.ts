import type { Command, CommandContext } from '@/types';
import { logger } from '@/utils/logger';

export class CommandManager {
    private commands: Map<string, Command> = new Map();
    private commandAliases: Map<string, string> = new Map();
    private commandCooldowns: Map<string, Map<string, number>> = new Map();

    registerCommand(command: Command): void {
        // Validate command
        if (!command.name || !command.execute) {
            throw new Error('Command must have name and execute function');
        }

        // Register main command
        this.commands.set(command.name.toLowerCase(), command);
        logger.info(`Command registered: ${command.name}`);

        // Register aliases
        command.aliases.forEach(alias => {
            this.commandAliases.set(alias.toLowerCase(), command.name.toLowerCase());
            logger.info(`Alias registered: ${alias} -> ${command.name}`);
        });
    }

    unregisterCommand(commandName: string): void {
        const name = commandName.toLowerCase();
        const command = this.commands.get(name);

        if (!command) {
            throw new Error(`Command not found: ${commandName}`);
        }

        // Remove main command
        this.commands.delete(name);

        // Remove aliases
        command.aliases.forEach(alias => {
            this.commandAliases.delete(alias.toLowerCase());
        });

        // Remove cooldowns
        this.commandCooldowns.delete(name);

        logger.info(`Command unregistered: ${commandName}`);
    }

    async executeCommand(context: CommandContext): Promise<boolean> {
        const { message } = context;

        // Check if message is a command
        const messageBody = message.body ?? '';
        if (!messageBody.startsWith('!')) {
            return false;
        }

        // Parse command and arguments
        const parts = messageBody.slice(1).split(' ');
        const commandName = parts[0]?.toLowerCase() || '';
        const args = parts.slice(1);

        // Find command
        const command = this.findCommand(commandName);
        if (!command) {
            logger.warn(`Unknown command: ${commandName}`);
            return false;
        }

        // Update context with parsed arguments
        context.args = args;

        // Check cooldown
        if (await this.isOnCooldown(command.name, context.chatId)) {
            logger.info(`Command on cooldown: ${command.name} for chat ${context.chatId}`);
            return false;
        }

        // Execute command
        try {
            logger.info({
                chatId: context.chatId,
                sender: context.sender,
                args
            }, `Executing command: ${command.name}`);

            await command.execute(context);

            // Set cooldown
            this.setCooldown(command.name, context.chatId, command.cooldown);

            return true;
        } catch (error) {
            logger.error({ err: error }, `Error executing command: ${command.name}`);
            return false;
        }
    }

    private findCommand(commandName: string): Command | null {
        const name = commandName.toLowerCase();

        // Check direct command
        const directCommand = this.commands.get(name);
        if (directCommand) {
            return directCommand;
        }

        // Check aliases
        const aliasedCommand = this.commandAliases.get(name);
        if (aliasedCommand) {
            return this.commands.get(aliasedCommand) || null;
        }

        return null;
    }

    private async isOnCooldown(commandName: string, chatId: string): Promise<boolean> {
        const command = this.commands.get(commandName.toLowerCase());
        if (!command || command.cooldown <= 0) {
            return false;
        }

        const cooldowns = this.commandCooldowns.get(commandName.toLowerCase());
        if (!cooldowns) {
            return false;
        }

        const lastUsed = cooldowns.get(chatId);
        if (!lastUsed) {
            return false;
        }

        const now = Date.now();
        const cooldownEnd = lastUsed + command.cooldown;

        return now < cooldownEnd;
    }

    private setCooldown(commandName: string, chatId: string, cooldown: number): void {
        if (cooldown <= 0) {
            return;
        }

        const name = commandName.toLowerCase();
        if (!this.commandCooldowns.has(name)) {
            this.commandCooldowns.set(name, new Map());
        }

        const cooldowns = this.commandCooldowns.get(name)!;
        cooldowns.set(chatId, Date.now());
    }

    getCommands(): Command[] {
        return Array.from(this.commands.values());
    }

    getCommand(name: string): Command | null {
        return this.commands.get(name.toLowerCase()) || null;
    }

    getCommandAliases(commandName: string): string[] {
        const command = this.commands.get(commandName.toLowerCase());
        return command ? command.aliases : [];
    }

    getCommandCategories(): string[] {
        const categories = new Set<string>();
        this.commands.forEach(command => {
            categories.add(command.category);
        });
        return Array.from(categories);
    }

    getCommandsByCategory(category: string): Command[] {
        return this.getCommands().filter(command => command.category === category);
    }

    getCommandStats(): {
        totalCommands: number;
        totalAliases: number;
        categories: string[];
        commandsByCategory: Record<string, number>;
    } {
        const commands = this.getCommands();
        const categories = this.getCommandCategories();

        const commandsByCategory: Record<string, number> = {};
        categories.forEach(category => {
            commandsByCategory[category] = this.getCommandsByCategory(category).length;
        });

        return {
            totalCommands: commands.length,
            totalAliases: this.commandAliases.size,
            categories,
            commandsByCategory,
        };
    }

    // Cleanup expired cooldowns periodically
    cleanupCooldowns(): void {
        const now = Date.now();

        for (const [commandName, cooldowns] of this.commandCooldowns.entries()) {
            for (const [chatId, lastUsed] of cooldowns.entries()) {
                const command = this.commands.get(commandName);
                if (command && now - lastUsed > command.cooldown) {
                    cooldowns.delete(chatId);
                }
            }

            // Remove empty cooldown maps
            if (cooldowns.size === 0) {
                this.commandCooldowns.delete(commandName);
            }
        }
    }

    // Validate command structure
    validateCommand(command: Partial<Command>): string[] {
        const errors: string[] = [];

        if (!command.name || command.name.trim().length === 0) {
            errors.push('Command name is required');
        }

        if (!command.execute || typeof command.execute !== 'function') {
            errors.push('Command execute function is required');
        }

        if (command.cooldown !== undefined && (command.cooldown < 0 || !Number.isInteger(command.cooldown))) {
            errors.push('Command cooldown must be a non-negative integer');
        }

        if (command.aliases && !Array.isArray(command.aliases)) {
            errors.push('Command aliases must be an array');
        }

        if (command.category && typeof command.category !== 'string') {
            errors.push('Command category must be a string');
        }

        return errors;
    }
}

// Built-in commands
export const builtinCommands: Command[] = [
    {
        name: 'help',
        aliases: ['h', 'commands', 'cmds'],
        description: 'Show available commands',
        usage: '!help [command]',
        category: 'general',
        cooldown: 5000,
        execute: async (context: CommandContext) => {
            const { message, args } = context;

            if (args.length > 0) {
                // Show help for specific command
                const commandName = args[0]?.toLowerCase() || '';
                const commandManager = new CommandManager();
                const command = commandManager.getCommand(commandName);

                if (command) {
                    await message.reply(
                        `**Command:** ${command.name}\n` +
                        `**Description:** ${command.description}\n` +
                        `**Usage:** ${command.usage}\n` +
                        `**Category:** ${command.category}\n` +
                        `**Cooldown:** ${command.cooldown}ms\n` +
                        `**Aliases:** ${command.aliases.join(', ')}`
                    );
                } else {
                    await message.reply(`Command not found: ${commandName}`);
                }
            } else {
                // Show general help
                await message.reply(
                    'Available commands:\n' +
                    '!help - Show this help message\n' +
                    '!ping - Check bot responsiveness\n' +
                    '!status - Show bot status\n' +
                    '!stats - Show command statistics\n' +
                    '\nUse !help <command> for detailed information about a specific command.'
                );
            }
        },
    },
    {
        name: 'ping',
        aliases: ['p'],
        description: 'Check bot responsiveness',
        usage: '!ping',
        category: 'general',
        cooldown: 3000,
        execute: async (context: CommandContext) => {
            const start = Date.now();
            await context.message.reply('Pong!');
            const end = Date.now();
            await context.message.reply(`Response time: ${end - start}ms`);
        },
    },
    {
        name: 'status',
        aliases: ['s'],
        description: 'Show bot status',
        usage: '!status',
        category: 'general',
        cooldown: 10000,
        execute: async (context: CommandContext) => {
            const uptime = process.uptime();
            const memory = process.memoryUsage();

            const status = `**Bot Status:**
- Uptime: ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s
- Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB
- Node.js: ${process.version}
- Platform: ${process.platform}`;

            await context.message.reply(status);
        },
    },
    {
        name: 'stats',
        aliases: ['statistics'],
        description: 'Show command statistics',
        usage: '!stats',
        category: 'general',
        cooldown: 15000,
        execute: async (context: CommandContext) => {
            const commandManager = new CommandManager();
            const stats = commandManager.getCommandStats();

            const statsMessage = `**Command Statistics:**
- Total Commands: ${stats.totalCommands}
- Total Aliases: ${stats.totalAliases}
- Categories: ${stats.categories.join(', ')}
- Commands by Category:
${Object.entries(stats.commandsByCategory)
                    .map(([category, count]) => `  - ${category}: ${count}`)
                    .join('\n')}`;

            await context.message.reply(statsMessage);
        },
    },
];