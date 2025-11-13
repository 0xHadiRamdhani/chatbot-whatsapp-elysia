import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import type { ConversationHistory } from '@/types';
import { logger } from '@/utils/logger';

export class DatabaseService {
    private db: Database.Database;
    private backupInterval: number;

    constructor(databasePath: string, backupInterval: number = 3600000) {
        // Ensure database directory exists
        const dbDir = dirname(databasePath);
        if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(databasePath);
        this.backupInterval = backupInterval;
        this.initializeDatabase();
        this.setupBackup();
    }

    private initializeDatabase(): void {
        // Create conversations table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_command BOOLEAN DEFAULT FALSE,
        command_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for better performance
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversations_chat_id ON conversations(chat_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_conversations_sender ON conversations(sender);
    `);

        // Create rate limits table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        chat_id TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        reset_time INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create command usage statistics table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS command_stats (
        command_name TEXT PRIMARY KEY,
        usage_count INTEGER DEFAULT 0,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        logger.info('Database initialized successfully');
    }

    private setupBackup(): void {
        if (this.backupInterval > 0) {
            setInterval(() => {
                this.backup();
            }, this.backupInterval);
        }
    }

    private backup(): void {
        try {
            const backupPath = `${this.db.name}.backup`;
            this.db.backup(backupPath)
                .then(() => {
                    logger.info('Database backup completed');
                })
                .catch((error: Error) => {
                    logger.error({ err: error }, 'Database backup failed');
                });
        } catch (error) {
            logger.error({ err: error }, 'Database backup error');
        }
    }

    // Conversation history methods
    async saveConversation(conversation: ConversationHistory): Promise<void> {
        const stmt = this.db.prepare(`
      INSERT INTO conversations (
        id, chat_id, sender, message, timestamp, is_command, command_name
      ) VALUES (
        @id, @chatId, @sender, @message, @timestamp, @isCommand, @commandName
      )
    `);

        try {
            stmt.run({
                id: conversation.id,
                chatId: conversation.chatId,
                sender: conversation.sender,
                message: conversation.message,
                timestamp: conversation.timestamp.toISOString(),
                isCommand: conversation.isCommand,
                commandName: conversation.commandName,
            });
        } catch (error) {
            logger.error({ err: error }, 'Failed to save conversation');
            throw error;
        }
    }

    async getConversationHistory(chatId: string, limit: number = 100): Promise<ConversationHistory[]> {
        const stmt = this.db.prepare(`
      SELECT * FROM conversations
      WHERE chat_id = @chatId
      ORDER BY timestamp DESC
      LIMIT @limit
    `);

        try {
            const rows = stmt.all({ chatId, limit }) as any[];
            return rows.map(row => ({
                id: row.id,
                chatId: row.chat_id,
                sender: row.sender,
                message: row.message,
                timestamp: new Date(row.timestamp),
                isCommand: Boolean(row.is_command),
                commandName: row.command_name,
            }));
        } catch (error) {
            logger.error({ err: error }, 'Failed to get conversation history');
            throw error;
        }
    }

    async getConversationStats(chatId: string): Promise<{
        totalMessages: number;
        commandMessages: number;
        lastMessage: Date | null;
    }> {
        const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN is_command = TRUE THEN 1 ELSE 0 END) as command_messages,
        MAX(timestamp) as last_message
      FROM conversations
      WHERE chat_id = @chatId
    `);

        try {
            const row = stmt.get({ chatId }) as any;
            return {
                totalMessages: row.total_messages,
                commandMessages: row.command_messages,
                lastMessage: row.last_message ? new Date(row.last_message) : null,
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to get conversation stats');
            throw error;
        }
    }

    // Rate limiting methods
    async getRateLimit(chatId: string): Promise<{ count: number; resetTime: number } | null> {
        const stmt = this.db.prepare(`
      SELECT count, reset_time FROM rate_limits
      WHERE chat_id = @chatId
    `);

        try {
            const row = stmt.get({ chatId }) as any;
            if (!row) return null;

            return {
                count: row.count,
                resetTime: row.reset_time,
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to get rate limit');
            throw error;
        }
    }

    async updateRateLimit(chatId: string, count: number, resetTime: number): Promise<void> {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO rate_limits (
        chat_id, count, reset_time, updated_at
      ) VALUES (
        @chatId, @count, @resetTime, CURRENT_TIMESTAMP
      )
    `);

        try {
            stmt.run({ chatId, count, resetTime });
        } catch (error) {
            logger.error({ err: error }, 'Failed to update rate limit');
            throw error;
        }
    }

    async cleanupExpiredRateLimits(): Promise<void> {
        const stmt = this.db.prepare(`
      DELETE FROM rate_limits
      WHERE reset_time < @currentTime
    `);

        try {
            const currentTime = Date.now();
            stmt.run({ currentTime });
        } catch (error) {
            logger.error({ err: error }, 'Failed to cleanup expired rate limits');
            throw error;
        }
    }

    // Command statistics methods
    async incrementCommandUsage(commandName: string): Promise<void> {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO command_stats (
        command_name, usage_count, last_used, updated_at
      ) VALUES (
        @commandName, 
        COALESCE((SELECT usage_count FROM command_stats WHERE command_name = @commandName), 0) + 1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);

        try {
            stmt.run({ commandName });
        } catch (error) {
            logger.error({ err: error }, 'Failed to increment command usage');
            throw error;
        }
    }

    async getCommandStats(): Promise<Record<string, number>> {
        const stmt = this.db.prepare(`
      SELECT command_name, usage_count FROM command_stats
      ORDER BY usage_count DESC
    `);

        try {
            const rows = stmt.all() as any[];
            return rows.reduce((acc, row) => {
                acc[row.command_name] = row.usage_count;
                return acc;
            }, {} as Record<string, number>);
        } catch (error) {
            logger.error({ err: error }, 'Failed to get command stats');
            throw error;
        }
    }

    // Database maintenance
    async cleanup(): Promise<void> {
        try {
            // Cleanup old conversations (older than 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const stmt = this.db.prepare(`
        DELETE FROM conversations
        WHERE timestamp < @thirtyDaysAgo
      `);
            stmt.run({ thirtyDaysAgo });

            // Cleanup expired rate limits
            await this.cleanupExpiredRateLimits();

            logger.info('Database cleanup completed');
        } catch (error) {
            logger.error({ err: error }, 'Database cleanup failed');
            throw error;
        }
    }

    close(): void {
        try {
            this.db.close();
            logger.info('Database connection closed');
        } catch (error) {
            logger.error({ err: error }, 'Error closing database');
            throw error;
        }
    }

    getDatabase(): Database.Database {
        return this.db;
    }
}