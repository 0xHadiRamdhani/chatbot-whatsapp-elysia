import type { Command, CommandContext } from '@/types';
import { logger } from '@/utils/logger';

// Command untuk membuat stiker dari gambar
export const stickerCommand: Command = {
    name: 'sticker',
    aliases: ['s', 'stiker'],
    description: 'Buat stiker dari gambar yang dikirim',
    usage: '!sticker [nama_stiker]',
    category: 'media',
    cooldown: 5000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        if (!message.hasMedia) {
            await message.reply('❌ Silakan kirim gambar terlebih dahulu, lalu balas dengan !sticker');
            return;
        }

        try {
            const media = await message.downloadMedia();
            if (!media) {
                await message.reply('❌ Gagal mengunduh media');
                return;
            }

            // Konversi ke stiker (format WebP)
            const stickerName = args[0] || 'stiker_bot';

            await message.reply('🎨 Sedang membuat stiker...');

            // Simulasi konversi (dalam implementasi nyata gunakan sharp atau jimp)
            await message.reply(media, undefined, {
                sendMediaAsSticker: true,
                stickerAuthor: 'WhatsApp Bot',
                stickerName: stickerName
            });

            logger.info({ chatId: context.chatId }, 'Stiker berhasil dibuat');
        } catch (error) {
            logger.error({ err: error }, 'Gagal membuat stiker');
            await message.reply('❌ Gagal membuat stiker');
        }
    },
};

// Command AI untuk menjawab pertanyaan
export const aiCommand: Command = {
    name: 'ai',
    aliases: ['ask', 'tanya'],
    description: 'Tanya jawab dengan AI',
    usage: '!ai <pertanyaan>',
    category: 'ai',
    cooldown: 10000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        if (args.length === 0) {
            await message.reply('❌ Silakan berikan pertanyaan. Contoh: !ai Apa itu javascript?');
            return;
        }

        const question = args.join(' ');

        try {
            await message.reply('🤔 Sedang memproses pertanyaan...');

            // Simulasi respons AI (bisa diganti dengan API nyata)
            const responses = [
                `Berikut jawaban untuk: "${question}"\n\nJavaScript adalah bahasa pemrograman yang digunakan untuk membuat website interaktif.`,
                `Pertanyaan menarik! "${question}"\n\nMenurut pengetahuan saya, ini adalah konsep yang penting dalam pemrograman.`,
                `Saya akan menjawab: "${question}"\n\nIni adalah topik yang kompleks, tetapi saya akan coba jelaskan secara sederhana.`,
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            await message.reply(`🤖 ${randomResponse}`);

            logger.info({ question, chatId: context.chatId }, 'AI question answered');
        } catch (error) {
            logger.error({ err: error }, 'Failed to process AI question');
            await message.reply('❌ Maaf, saya tidak bisa menjawab pertanyaan saat ini');
        }
    },
};

// Command untuk membuat quote aesthetic
export const quoteCommand: Command = {
    name: 'quote',
    aliases: ['q', 'kutipan'],
    description: 'Buat quote aesthetic dengan background',
    usage: '!quote <teks>',
    category: 'media',
    cooldown: 8000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        if (args.length === 0) {
            await message.reply('❌ Silakan berikan teks untuk quote. Contoh: !quote Hidup adalah perjuangan');
            return;
        }

        const quoteText = args.join(' ');

        try {
            await message.reply('🎨 Sedang membuat quote aesthetic...');

            // Simulasi pembuatan quote dengan background
            const quoteTemplate = `
╭─────────────╮
│  💭 QUOTE  │
│             │
│ "${quoteText}" │
│             │
│  ✨ ${new Date().toLocaleDateString('id-ID')} │
╰─────────────╯
            `;

            await message.reply(quoteTemplate);

            // Tambahkan reaksi emoji
            await message.react('💫');

            logger.info({ quote: quoteText, chatId: context.chatId }, 'Quote created');
        } catch (error) {
            logger.error({ err: error }, 'Failed to create quote');
            await message.reply('❌ Gagal membuat quote');
        }
    },
};

// Command untuk game tebak-tebakan
export const tebakCommand: Command = {
    name: 'tebak',
    aliases: ['tebakan', 'quiz'],
    description: 'Main game tebak-tebakan',
    usage: '!tebak',
    category: 'game',
    cooldown: 15000,
    execute: async (context: CommandContext) => {
        const { message } = context;

        const questions = [
            { question: 'Apa ibu kota Indonesia?', answer: 'jakarta' },
            { question: 'Berapa jumlah hari dalam 1 minggu?', answer: '7' },
            { question: 'Apa warna langit saat cerah?', answer: 'biru' },
            { question: 'Siapa presiden pertama Indonesia?', answer: 'soekarno' },
            { question: 'Apa mata uang Indonesia?', answer: 'rupiah' },
        ];

        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

        if (!randomQuestion) {
            await message.reply('❌ Gagal memilih pertanyaan. Coba lagi!');
            return;
        }

        try {
            await message.reply(`🎮 TEBAK-TEBAKAN\n\n${randomQuestion.question}\n\nJawab dalam 30 detik!`);

            // Simulasi menunggu jawaban (dalam implementasi nyata gunakan event listener)
            setTimeout(async () => {
                await message.reply(`⏰ Waktu habis!\n\nJawaban yang benar: ${randomQuestion.answer}`);
            }, 30000);

            logger.info({ question: randomQuestion.question, chatId: context.chatId }, 'Quiz started');
        } catch (error) {
            logger.error({ err: error }, 'Failed to start quiz');
            await message.reply('❌ Gagal memulai game tebak-tebakan');
        }
    },
};

// Command untuk meme generator
export const memeCommand: Command = {
    name: 'meme',
    aliases: ['memes', 'joke'],
    description: 'Generate meme random',
    usage: '!meme',
    category: 'fun',
    cooldown: 5000,
    execute: async (context: CommandContext) => {
        const { message } = context;

        const memes = [
            '😂 *When you realize tomorrow is Monday*\n\n"Why must weekends be so short?"',
            '🤔 *When code works on first try*\n\n"Something is definitely wrong here"',
            '😅 *When you forget to save file*\n\n"All my work... gone!"',
            '🙄 *When someone asks obvious question*\n\n"Did you try Google first?"',
            '😴 *When debugging at 3AM*\n\n"Just one more console.log"',
            '🤯 *When you find the bug*\n\n"It was a missing semicolon all along!"',
            '😎 *When deployment succeeds*\n\n"I am the coding master!"',
            '😱 *When production goes down*\n\n"Who touched the code?!"',
        ];

        try {
            const randomMeme = memes[Math.floor(Math.random() * memes.length)];
            if (!randomMeme) {
                await message.reply('❌ Gagal memilih meme. Coba lagi!');
                return;
            }

            await message.reply(randomMeme);

            // Tambahkan reaksi sesuai meme
            const reactions = ['😂', '🤔', '😅', '🙄', '😴', '🤯', '😎', '😱'];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            if (randomReaction) {
                await message.react(randomReaction);
            }

            logger.info({ chatId: context.chatId }, 'Meme sent');
        } catch (error) {
            logger.error({ err: error }, 'Failed to send meme');
            await message.reply('❌ Gagal mengirim meme');
        }
    },
};

// Command untuk fakta unik
export const faktaCommand: Command = {
    name: 'fakta',
    aliases: ['fact', 'info'],
    description: 'Dapatkan fakta unik dan menarik',
    usage: '!fakta',
    category: 'education',
    cooldown: 8000,
    execute: async (context: CommandContext) => {
        const { message } = context;

        const facts = [
            '🌟 *Fakta Unik:*\n\nSemut tidak pernah tidur. Mereka istirahat sejenak tapi tetap waspada!',
            '🌍 *Fakta Unik:*\n\nKanguru tidak bisa berjalan mundur!',
            '🐙 *Fakta Unik:*\n\nGurita punya 3 jantung dan darahnya berwarna biru!',
            '🍯 *Fakta Unik:*\n\nMadu tidak pernah basi. Makanan satu-satunya yang tahan selamanya!',
            '🦋 *Fakta Unik:*\n\nKupu-kupu bisa merasakan dengan kakinya!',
            '🐧 *Fakta Unik:*\n\nPenguin punya nama untuk pasangannya masing-masing!',
            '🌈 *Fakta Unik:*\n\nTidak ada dua orang yang memiliki sidik jari yang sama!',
            '🐘 *Fakta Unik:*\n\nGajah adalah satu-satunya hewan yang tidak bisa melompat!',
        ];

        try {
            const randomFact = facts[Math.floor(Math.random() * facts.length)];
            if (!randomFact) {
                await message.reply('❌ Gagal memilih fakta. Coba lagi!');
                return;
            }

            await message.reply(randomFact);

            // Tambahkan reaksi
            await message.react('🤓');

            logger.info({ chatId: context.chatId }, 'Fact sent');
        } catch (error) {
            logger.error({ err: error }, 'Failed to send fact');
            await message.reply('❌ Gagal mengirim fakta');
        }
    },
};

// Command untuk motivasi harian
export const motivasiCommand: Command = {
    name: 'motivasi',
    aliases: ['motiv', 'semangat'],
    description: 'Dapatkan motivasi harian',
    usage: '!motivasi',
    category: 'inspiration',
    cooldown: 10000,
    execute: async (context: CommandContext) => {
        const { message } = context;

        const motivations = [
            '💪 *Motivasi Hari Ini:*\n\n"Kesuksesan adalah perjalanan, bukan tujuan akhir. Nikmati setiap langkahnya!"',
            '🌟 *Motivasi Hari Ini:*\n\n"Setiap hari adalah kesempatan baru untuk menjadi versi terbaik dari dirimu!"',
            '🔥 *Motivasi Hari Ini:*\n\n"Jangan takut gagal. Takutlah tidak mencoba!"',
            '✨ *Motivasi Hari Ini:*\n\n"Impian besar membutuhkan kerja keras besar. Tetapi hasilnya akan sepadan!"',
            '🚀 *Motivasi Hari Ini:*\n\n"Langkah kecil hari ini menjadi perubahan besar di masa depan!"',
            '💡 *Motivasi Hari Ini:*\n\n"Kreativitas adalah intelijensi yang bersenang-senang. Teruslah berkreasi!"',
            '🎯 *Motivasi Hari Ini:*\n\n"Fokus pada proses, bukan hanya hasil. Proses membentuk karakter!"',
            '🌱 *Motivasi Hari Ini:*\n\n"Pertumbuhan terjadi di luar zona nyaman. Beranilah keluar!"',
        ];

        try {
            const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
            if (!randomMotivation) {
                await message.reply('❌ Gagal memilih motivasi. Coba lagi!');
                return;
            }

            await message.reply(randomMotivation);

            // Tambahkan reaksi positif
            await message.react('💪');

            logger.info({ chatId: context.chatId }, 'Motivation sent');
        } catch (error) {
            logger.error({ err: error }, 'Failed to send motivation');
            await message.reply('❌ Gagal mengirim motivasi');
        }
    },
};

// Export semua commands
export const funCommands = [
    stickerCommand,
    aiCommand,
    quoteCommand,
    tebakCommand,
    memeCommand,
    faktaCommand,
    motivasiCommand,
];