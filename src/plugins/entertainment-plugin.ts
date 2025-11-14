import type { Plugin } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Entertainment plugin dengan auto-reaction dan auto-reply sederhana
 * Fitur: reaction otomatis, balasan otomatis untuk kata kunci tertentu
 */
export const entertainmentPlugin: Plugin = {
    name: 'entertainment-plugin',
    version: '2.0.0',
    description: 'Plugin hiburan dengan auto-reaction dan auto-reply',
    author: 'Bot Developer',
    enabled: true,

    async initialize() {
        logger.info('Entertainment plugin initialized');
    },

    async destroy() {
        logger.info('Entertainment plugin destroyed');
    },

    async middleware(context: any, next: () => Promise<void>) {
        const { message, isGroup } = context;
        const messageBody = (message.body ?? '').toLowerCase();

        try {
            // Auto-reaction untuk pesan tertentu
            await handleAutoReactions(message, messageBody);

            // Auto-reply untuk kata kunci tertentu (hanya untuk chat pribadi)
            if (!isGroup && !message.fromMe) {
                await handleAutoReplies(message, messageBody);
            }

        } catch (error) {
            logger.error({ err: error }, 'Error in entertainment plugin');
        }

        // Continue to next middleware
        await next();
    }
};

// Fungsi untuk handle auto-reactions
async function handleAutoReactions(message: any, messageBody: string): Promise<void> {
    const reactionTriggers = [
        { keywords: ['mantap', 'keren', 'bagus', 'hebat'], reaction: '🔥' },
        { keywords: ['sedih', 'nangis', 'cry'], reaction: '😢' },
        { keywords: ['haha', 'lol', 'wkwk', 'hihi'], reaction: '😂' },
        { keywords: ['love', 'cinta', 'sayang'], reaction: '❤️' },
        { keywords: ['thanks', 'makasih', 'terima kasih'], reaction: '🙏' },
        { keywords: ['wow', 'amazing', 'ajaib'], reaction: '🤯' },
        { keywords: ['semangat', 'gas', 'yuk'], reaction: '💪' },
        { keywords: ['makan', 'food', 'lapar'], reaction: '🍽️' },
    ];

    for (const trigger of reactionTriggers) {
        if (trigger.keywords.some(keyword => messageBody.includes(keyword))) {
            try {
                await message.react(trigger.reaction);
                logger.debug({ reaction: trigger.reaction }, 'Auto-reaction triggered');
                break; // Hanya satu reaction per pesan
            } catch (error) {
                logger.debug({ err: error }, 'Failed to add reaction');
            }
        }
    }
}

// Fungsi untuk handle auto-replies
async function handleAutoReplies(message: any, messageBody: string): Promise<void> {
    // Avoid replying to bot messages
    if (message.fromMe) return;

    const autoReplies = [
        {
            keywords: ['bot', 'robot'],
            responses: [
                '🤖 Hai! Aku adalah bot WhatsApp yang siap membantu!',
                '🤖 Bot di sini! Ada yang bisa saya bantu?',
                '🤖 Iya, saya bot pintar yang bisa bantu berbagai hal!',
            ]
        },
        {
            keywords: ['pagi', 'selamat pagi'],
            responses: [
                '🌅 Selamat pagi! Semangat memulai hari!',
                '🌅 Pagi juga! Jangan lupa sarapan ya!',
                '🌅 Selamat pagi! Semoga harimu menyenangkan!',
            ]
        },
        {
            keywords: ['siang', 'selamat siang'],
            responses: [
                '☀️ Selamat siang! Jangan lupa istirahat!',
                '☀️ Siang juga! Sudah makan siang?',
                '☀️ Selamat siang! Semoga harimu produktif!',
            ]
        },
        {
            keywords: ['malam', 'selamat malam'],
            responses: [
                '🌙 Selamat malam! Jangan begadang terus!',
                '🌙 Malam juga! Istirahat yang cukup ya!',
                '🌙 Selamat malam! Semoga mimpi indah!',
            ]
        },
        {
            keywords: ['bored', 'bosan', 'bosen'],
            responses: [
                '🎮 Bosan ya? Coba main game dengan !tebak',
                '🎬 Bosan? Coba tanya aku sesuatu dengan !ai',
                '🎵 Bosan? Coba minta motivasi dengan !motivasi',
            ]
        },
        {
            keywords: ['ultah', 'birthday', 'ulang tahun'],
            responses: [
                '🎂 Selamat ulang tahun! Semoga panjang umur dan sehat selalu!',
                '🎉 Happy birthday! Semoga harimu menyenangkan!',
                '🎊 Selamat ulang tahun! Semoga semua impianmu tercapai!',
            ]
        },
        {
            keywords: ['tidur', 'sleep'],
            responses: [
                '😴 Yuk tidur! Jangan begadang terus. Semoga mimpi indah! 🌙',
                '😴 Waktunya tidur! Istirahat yang cukup ya!',
                '🌙 Selamat tidur! See you tomorrow!',
            ]
        }
    ];

    // Cek setiap auto-reply trigger
    for (const autoReply of autoReplies) {
        if (autoReply.keywords.some(keyword => messageBody.includes(keyword))) {
            try {
                const randomResponse = autoReply.responses[Math.floor(Math.random() * autoReply.responses.length)];
                if (randomResponse) {
                    await message.reply(randomResponse);
                    logger.info({ keywords: autoReply.keywords }, 'Auto-reply triggered');
                    break; // Hanya satu auto-reply per pesan
                }
            } catch (error) {
                logger.debug({ err: error }, 'Failed to send auto-reply');
            }
        }
    }
}

export default entertainmentPlugin;