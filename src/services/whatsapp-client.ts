import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { EventEmitter } from 'events';
import type { BotConfig } from '@/types';
import { logger } from '@/utils/logger';
import { DatabaseService } from '@/database';

export class WhatsAppClient extends EventEmitter {
    private client: Client;
    private config: BotConfig;
    private database: DatabaseService;
    private reconnectAttempts = 0;
    private reconnecting = false;
    private qrRefreshTimer: NodeJS.Timeout | null = null;
    private healthCheckTimer: NodeJS.Timeout | null = null;

    constructor(config: BotConfig, database: DatabaseService) {
        super();
        this.config = config;
        this.database = database;

        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: `./sessions/${config.sessionName}`,
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            },
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.client.on('qr', (qr: string) => {
            logger.info('QR Code received, scan with WhatsApp');
            qrcode.generate(qr, { small: true });
            this.emit('qr', qr);

            // Set up QR refresh
            this.scheduleQRRefresh();
        });

        this.client.on('ready', () => {
            logger.info('WhatsApp client is ready!');
            this.emit('ready');
            this.reconnectAttempts = 0;
            this.reconnecting = false;
            this.clearQRRefresh();
            this.startHealthCheck();
        });

        this.client.on('authenticated', () => {
            logger.info('WhatsApp client authenticated');
            this.emit('authenticated');
        });

        this.client.on('auth_failure', (msg: string) => {
            logger.error({ message: msg }, 'WhatsApp authentication failed');
            this.emit('auth_failure', msg);
        });

        this.client.on('message', async (message: Message) => {
            try {
                await this.handleMessage(message);
            } catch (error) {
                logger.error({ err: error }, 'Error handling message');
            }
        });

        this.client.on('message_create', async (message: Message) => {
            if (message.fromMe) {
                try {
                    await this.handleMessage(message);
                } catch (error) {
                    logger.error({ err: error }, 'Error handling sent message');
                }
            }
        });

        this.client.on('disconnected', (reason: string) => {
            logger.warn({ reason }, 'WhatsApp client disconnected');
            this.emit('disconnected', reason);
            this.stopHealthCheck();

            if (reason !== 'NAVIGATION') {
                this.scheduleReconnection();
            }
        });

        this.client.on('change_state', (state: string) => {
            logger.info({ state }, 'WhatsApp client state changed');
            this.emit('state_change', state);
        });

        this.client.on('change_battery', (batteryInfo: any) => {
            logger.debug('Battery info changed', batteryInfo);
            this.emit('battery_change', batteryInfo);
        });
    }

    private async handleMessage(message: Message): Promise<void> {
        // Save conversation to database
        const messageBody = message.body ?? '';
        const isCommand = messageBody.startsWith('!');
        let commandName: string | undefined;
        if (isCommand && messageBody.length > 1) {
            const firstPart = messageBody.split(' ')[0];
            if (firstPart && firstPart.length > 1) {
                commandName = firstPart.substring(1);
            }
        }

        const conversation = {
            id: message.id.id,
            chatId: message.from,
            sender: message.from,
            message: messageBody,
            timestamp: new Date(message.timestamp * 1000),
            isCommand,
            commandName,
        };

        try {
            await this.database.saveConversation(conversation);
            this.emit('message_received', message);
        } catch (error) {
            logger.error({ err: error }, 'Failed to save conversation');
        }
    }

    private scheduleQRRefresh(): void {
        if (this.qrRefreshTimer) {
            clearTimeout(this.qrRefreshTimer);
        }

        this.qrRefreshTimer = setTimeout(() => {
            logger.info('Refreshing QR code');
            this.emit('qr_refresh');
            // QR will be regenerated automatically by the client
        }, this.config.qrRefreshInterval);
    }

    private clearQRRefresh(): void {
        if (this.qrRefreshTimer) {
            clearTimeout(this.qrRefreshTimer);
            this.qrRefreshTimer = null;
        }
    }

    private startHealthCheck(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);
    }

    private stopHealthCheck(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }

    private async performHealthCheck(): Promise<void> {
        try {
            const state = await this.client.getState();
            logger.debug({ state }, 'WhatsApp client health check');

            if (state !== 'CONNECTED') {
                logger.warn({ state }, 'WhatsApp client not connected');
                this.emit('health_check_failed', state);
            }
        } catch (error) {
            logger.error({ err: error }, 'WhatsApp client health check failed');
            this.emit('health_check_failed', error);

            // If health check fails, consider triggering reconnection logic
            if (this.reconnectAttempts < this.config.maxReconnectAttempts && !this.reconnecting) {
                logger.info('Health check failed, scheduling reconnection');
                this.scheduleReconnection();
            }
        }
    }

    private scheduleReconnection(): void {
        if (this.reconnecting) {
            return;
        }

        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            logger.error('Max reconnection attempts reached');
            this.emit('max_reconnect_attempts_reached');
            return;
        }

        this.reconnecting = true;
        const delay = this.calculateReconnectDelay();

        logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

        setTimeout(() => {
            this.reconnect();
        }, delay);
    }

    private calculateReconnectDelay(): number {
        // Exponential backoff with jitter
        const baseDelay = this.config.reconnectInterval;
        const maxDelay = baseDelay * Math.pow(2, this.reconnectAttempts);
        const jitter = Math.random() * 0.1 * maxDelay; // 10% jitter
        return Math.min(maxDelay, 30000) + jitter; // Max 30 seconds
    }

    private async reconnect(): Promise<void> {
        this.reconnectAttempts++;
        logger.info(`Reconnection attempt ${this.reconnectAttempts}`);

        try {
            await this.initialize();
        } catch (error) {
            logger.error({ err: error }, 'Reconnection failed');
            this.emit('reconnect_failed', error);

            if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
                this.scheduleReconnection();
            } else {
                this.emit('max_reconnect_attempts_reached');
            }
        }
    }

    async initialize(): Promise<void> {
        try {
            logger.info('Initializing WhatsApp client');
            await this.client.initialize();
        } catch (error) {
            logger.error({ err: error }, 'Failed to initialize WhatsApp client');
            throw error;
        }
    }

    async destroy(): Promise<void> {
        try {
            logger.info('Destroying WhatsApp client');
            this.clearQRRefresh();
            this.stopHealthCheck();

            if (this.client) {
                await this.client.destroy();
            }
        } catch (error) {
            logger.error({ err: error }, 'Error destroying WhatsApp client');
            throw error;
        }
    }

    async sendMessage(chatId: string, message: string): Promise<Message> {
        try {
            const sentMessage = await this.client.sendMessage(chatId, message);
            logger.info({ chatId, messageId: sentMessage.id.id }, 'Message sent');
            return sentMessage;
        } catch (error) {
            logger.error({ err: error }, 'Failed to send message');
            throw error;
        }
    }

    async getChats(): Promise<any[]> {
        try {
            const chats = await this.client.getChats();
            return chats;
        } catch (error) {
            logger.error({ err: error }, 'Failed to get chats');
            throw error;
        }
    }

    async getChatById(chatId: string): Promise<any> {
        try {
            const chat = await this.client.getChatById(chatId);
            return chat;
        } catch (error) {
            logger.error({ err: error }, 'Failed to get chat by ID');
            throw error;
        }
    }

    getClient(): Client {
        return this.client;
    }

    getState(): string {
        try {
            return this.client.info ? 'CONNECTED' : 'DISCONNECTED';
        } catch (error) {
            logger.debug('Error getting client state, assuming DISCONNECTED');
            return 'DISCONNECTED';
        }
    }

    isReady(): boolean {
        try {
            return this.client.info !== null && this.client.info !== undefined;
        } catch (error) {
            logger.debug('Error checking client readiness');
            return false;
        }
    }

    getReconnectAttempts(): number {
        return this.reconnectAttempts;
    }

    isReconnecting(): boolean {
        return this.reconnecting;
    }

    // Utility methods
    formatPhoneNumber(phone: string): string {
        if (!phone || typeof phone !== 'string') {
            logger.warn('Invalid phone number provided');
            return '';
        }

        try {
            // Remove all non-numeric characters
            const cleaned = phone.replace(/\D/g, '');

            if (cleaned.length === 0) {
                logger.warn('Phone number contains no valid digits');
                return '';
            }

            // Add country code if not present and format for WhatsApp
            if (cleaned.length === 10) {
                return `1${cleaned}@c.us`;
            } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
                return `${cleaned}@c.us`;
            } else if (cleaned.length === 12 && cleaned.startsWith('55')) {
                return `${cleaned}@c.us`;
            } else {
                return `${cleaned}@c.us`;
            }
        } catch (error) {
            logger.error({ err: error, phone }, 'Error formatting phone number');
            return '';
        }
    }

    isValidChatId(chatId: string): boolean {
        return /^[0-9]+(@c\.us|@g\.us)$/.test(chatId);
    }

    getChatType(chatId: string): 'private' | 'group' {
        return chatId.endsWith('@g.us') ? 'group' : 'private';
    }
}