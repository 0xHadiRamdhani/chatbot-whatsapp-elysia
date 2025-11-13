import type { Message } from 'whatsapp-web.js';

export interface BotConfig {
    nodeEnv: string;
    port: number;
    host: string;
    sessionName: string;
    qrRefreshInterval: number;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    databasePath: string;
    databaseBackupInterval: number;
    logLevel: string;
    logFile: string;
    logMaxSize: string;
    logMaxFiles: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    webhookSecret: string;
    webhookTimeout: number;
    jwtSecret: string;
    apiKey: string;
    healthCheckInterval: number;
    pluginDir: string;
    autoLoadPlugins: boolean;
}

export interface CommandContext {
    message: Message;
    args: string[];
    chatId: string;
    sender: string;
    isGroup: boolean;
    timestamp: Date;
}

export interface Command {
    name: string;
    aliases: string[];
    description: string;
    usage: string;
    category: string;
    cooldown: number;
    execute: (context: CommandContext) => Promise<void>;
}

export interface Plugin {
    name: string;
    version: string;
    description: string;
    author: string;
    enabled: boolean;
    initialize: () => Promise<void>;
    destroy: () => Promise<void>;
    middleware?: (context: CommandContext, next: () => Promise<void>) => Promise<void>;
}

export interface RateLimitEntry {
    chatId: string;
    count: number;
    resetTime: number;
}

export interface ConversationHistory {
    id: string;
    chatId: string;
    sender: string;
    message: string;
    timestamp: Date;
    isCommand: boolean;
    commandName?: string | undefined;
}

export interface WebhookPayload {
    event: string;
    data: Record<string, unknown>;
    timestamp: number;
    signature: string;
}

export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    checks: {
        database: boolean;
        whatsapp: boolean;
        memory: boolean;
        uptime: number;
    };
}

export interface ReconnectOptions {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

export interface LoggerConfig {
    level: string;
    file: string;
    maxSize: string;
    maxFiles: number;
    prettyPrint: boolean;
}

export interface MiddlewareContext extends CommandContext {
    bot: any;
    config: BotConfig;
    logger: any;
    database: any;
}

export type MiddlewareFunction = (
    context: MiddlewareContext,
    next: () => Promise<void>
) => Promise<void>;

export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    author: string;
    main: string;
    dependencies?: string[];
    permissions?: string[];
}