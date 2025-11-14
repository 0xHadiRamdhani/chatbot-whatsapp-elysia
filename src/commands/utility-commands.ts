import type { Command, CommandContext } from '@/types';
import { logger } from '@/utils/logger';

// Command untuk cek cuaca
export const weatherCommand: Command = {
    name: 'cuaca',
    aliases: ['weather', 'w'],
    description: 'Cek informasi cuaca',
    usage: '!cuaca <kota>',
    category: 'utility',
    cooldown: 10000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        if (args.length === 0) {
            await message.reply('❌ Silakan berikan nama kota. Contoh: !cuaca Jakarta');
            return;
        }

        const city = args.join(' ');

        try {
            await message.reply('🌤️ Sedang mengambil data cuaca...');

            // Simulasi data cuaca (dalam implementasi nyata gunakan API cuaca)
            const weatherData = [
                { city: 'jakarta', condition: 'Cerah', temp: '28°C', humidity: '65%', wind: '10 km/h' },
                { city: 'bandung', condition: 'Berawan', temp: '22°C', humidity: '75%', wind: '15 km/h' },
                { city: 'surabaya', condition: 'Hujan Ringan', temp: '26°C', humidity: '80%', wind: '12 km/h' },
                { city: 'yogyakarta', condition: 'Cerah Berawan', temp: '25°C', humidity: '70%', wind: '8 km/h' },
                { city: 'bali', condition: 'Cerah', temp: '30°C', humidity: '60%', wind: '18 km/h' },
            ];

            const cityLower = city.toLowerCase();
            const weather = weatherData.find(w => w.city.includes(cityLower));

            if (weather) {
                const weatherInfo = `🌤️ *Cuaca di ${city}:*\n\n` +
                    `Kondisi: ${weather.condition}\n` +
                    `Suhu: ${weather.temp}\n` +
                    `Kelembaban: ${weather.humidity}\n` +
                    `Angin: ${weather.wind}\n\n` +
                    `📅 ${new Date().toLocaleDateString('id-ID')}`;

                await message.reply(weatherInfo);
                await message.react('🌤️');
            } else {
                await message.reply(`❌ Tidak ada data cuaca untuk kota ${city}. Coba kota lain seperti Jakarta, Bandung, Surabaya, Yogyakarta, atau Bali.`);
            }

            logger.info({ city, chatId: context.chatId }, 'Weather info sent');
        } catch (error) {
            logger.error({ err: error }, 'Failed to get weather info');
            await message.reply('❌ Gagal mendapatkan informasi cuaca');
        }
    },
};

// Command untuk cek mata uang/kurs
export const kursCommand: Command = {
    name: 'kurs',
    aliases: ['rate', 'currency'],
    description: 'Cek kurs mata uang',
    usage: '!kurs <mata_uang>',
    category: 'utility',
    cooldown: 8000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        if (args.length === 0) {
            await message.reply('❌ Silakan berikan mata uang. Contoh: !kurs USD');
            return;
        }

        const currency = args[0]?.toUpperCase() || '';

        try {
            await message.reply('💰 Sedang mengambil data kurs...');

            // Simulasi data kurs (dalam implementasi nyata gunakan API kurs)
            const kursData = [
                { currency: 'USD', buy: '15,200', sell: '15,400', change: '+0.25%' },
                { currency: 'EUR', buy: '16,800', sell: '17,000', change: '+0.15%' },
                { currency: 'SGD', buy: '11,300', sell: '11,500', change: '-0.10%' },
                { currency: 'JPY', buy: '105', sell: '107', change: '+0.05%' },
                { currency: 'GBP', buy: '19,200', sell: '19,400', change: '+0.30%' },
            ];

            const kurs = kursData.find(k => k.currency === currency);

            if (kurs) {
                const kursInfo = `💰 *Kurs ${currency}:*\n\n` +
                    `Beli: Rp ${kurs.buy}\n` +
                    `Jual: Rp ${kurs.sell}\n` +
                    `Perubahan: ${kurs.change}\n\n` +
                    `📅 ${new Date().toLocaleDateString('id-ID')}\n` +
                    `⚠️ Kurs ini adalah simulasi untuk demo`;

                await message.reply(kursInfo);
                await message.react('💰');
            } else {
                await message.reply(`❌ Mata uang ${currency} tidak tersedia. Tersedia: USD, EUR, SGD, JPY, GBP`);
            }

            logger.info({ currency, chatId: context.chatId }, 'Currency rate sent');
        } catch (error) {
            logger.error({ err: error }, 'Failed to get currency rate');
            await message.reply('❌ Gagal mendapatkan informasi kurs');
        }
    },
};

// Command untuk translate sederhana
export const translateCommand: Command = {
    name: 'translate',
    aliases: ['tr', 'terjemah'],
    description: 'Terjemahkan teks sederhana',
    usage: '!translate <teks>',
    category: 'utility',
    cooldown: 5000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        if (args.length === 0) {
            await message.reply('❌ Silakan berikan teks untuk diterjemahkan. Contoh: !translate hello');
            return;
        }

        const text = args.join(' ');

        try {
            // Simulasi translate (dalam implementasi nyata gunakan Google Translate API)
            const translations: Record<string, string> = {
                'hello': 'halo',
                'good morning': 'selamat pagi',
                'good afternoon': 'selamat siang',
                'good evening': 'selamat malam',
                'good night': 'selamat tidur',
                'thank you': 'terima kasih',
                'sorry': 'maaf',
                'how are you': 'apa kabar',
                'i love you': 'aku cinta kamu',
                'goodbye': 'selamat tinggal',
                'halo': 'hello',
                'selamat pagi': 'good morning',
                'selamat siang': 'good afternoon',
                'selamat malam': 'good evening',
                'selamat tidur': 'good night',
                'terima kasih': 'thank you',
                'maaf': 'sorry',
                'apa kabar': 'how are you',
                'aku cinta kamu': 'i love you',
                'selamat tinggal': 'goodbye',
            };

            const lowerText = text.toLowerCase();
            const translation = translations[lowerText];

            if (translation) {
                const translateInfo = `🌐 *Terjemahan:*\n\n` +
                    `Dari: "${text}"\n` +
                    `Ke: "${translation}"\n\n` +
                    `📚 Ini adalah terjemahan sederhana untuk demo`;

                await message.reply(translateInfo);
                await message.react('🌐');
            } else {
                await message.reply(`❌ Maaf, tidak ada terjemahan untuk "${text}". Coba kata sederhana seperti: hello, thank you, good morning, dll.`);
            }

            logger.info({ text, translation, chatId: context.chatId }, 'Translation sent');
        } catch (error) {
            logger.error({ err: error }, 'Failed to translate');
            await message.reply('❌ Gagal menerjemahkan teks');
        }
    },
};

// Command untuk reminder sederhana
export const reminderCommand: Command = {
    name: 'reminder',
    aliases: ['ingat', 'remind'],
    description: 'Atur pengingat sederhana',
    usage: '!reminder <waktu> <pesan>',
    category: 'utility',
    cooldown: 5000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        if (args.length < 2) {
            await message.reply('❌ Format: !reminder <menit> <pesan>\nContoh: !reminder 5 minum obat');
            return;
        }

        const timeArg = args[0];
        const reminderText = args.slice(1).join(' ');

        try {
            const timeMinutes = parseInt(timeArg || '0');

            if (isNaN(timeMinutes) || timeMinutes <= 0 || timeMinutes > 60) {
                await message.reply('❌ Waktu harus berupa angka antara 1-60 menit');
                return;
            }

            await message.reply(`⏰ Pengingat diatur: "${reminderText}"\nAkan diingatkan dalam ${timeMinutes} menit`);

            // Set timer untuk reminder
            setTimeout(async () => {
                try {
                    await message.reply(`🔔 *PENGINGAT!*\n\n${reminderText}\n\n⏰ Waktu: ${timeMinutes} menit yang lalu`);
                    await message.react('🔔');
                } catch (error) {
                    logger.error({ err: error }, 'Failed to send reminder');
                }
            }, timeMinutes * 60 * 1000);

            logger.info({ reminder: reminderText, timeMinutes, chatId: context.chatId }, 'Reminder set');
        } catch (error) {
            logger.error({ err: error }, 'Failed to set reminder');
            await message.reply('❌ Gagal mengatur pengingat');
        }
    },
};

// Command untuk password generator
export const passwordCommand: Command = {
    name: 'password',
    aliases: ['pass', 'pw'],
    description: 'Generate password acak yang aman',
    usage: '!password [panjang]',
    category: 'utility',
    cooldown: 5000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        const length = args.length > 0 ? parseInt(args[0] || '12') : 12;

        if (length < 6 || length > 32) {
            await message.reply('❌ Panjang password harus antara 6-32 karakter');
            return;
        }

        try {
            // Generate password acak
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
            let password = '';

            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * charset.length);
                password += charset[randomIndex];
            }

            const passwordInfo = `🔐 *Password Generator:*\n\n` +
                `Password: \`${password}\`\n` +
                `Panjang: ${length} karakter\n` +
                `Kekuatan: ${length >= 12 ? 'Kuat ✅' : length >= 8 ? 'Sedang ⚠️' : 'Lemah ❌'}\n\n` +
                `⚠️ *Catatan:* Simpan password ini dengan aman!`;

            await message.reply(passwordInfo);
            await message.react('🔐');

            logger.info({ length, chatId: context.chatId }, 'Password generated');
        } catch (error) {
            logger.error({ err: error }, 'Failed to generate password');
            await message.reply('❌ Gagal generate password');
        }
    },
};

// Command untuk QR Code generator
export const qrcodeCommand: Command = {
    name: 'qrcode',
    aliases: ['qr', 'barcode'],
    description: 'Generate QR Code dari teks',
    usage: '!qrcode <teks>',
    category: 'utility',
    cooldown: 8000,
    execute: async (context: CommandContext) => {
        const { message, args } = context;

        if (args.length === 0) {
            await message.reply('❌ Silakan berikan teks untuk dijadikan QR Code. Contoh: !qrcode https://google.com');
            return;
        }

        const text = args.join(' ');

        try {
            await message.reply('📱 Sedang membuat QR Code...');

            // Simulasi QR Code (dalam implementasi nyata gunakan qrcode library)
            const qrAscii = `
█████████████████████████████
█████████████████████████████
████ ▄▄▄▄▄ █▀ █▀▀██ ▄▄▄▄▄ ████
████ █   █ █▀ ▄ █▀▀█ █   █ ████
████ █▄▄▄█ █▀█ ██ ███ █▄▄▄█ ████
████▄▄▄▄▄▄▄█▄▀▄█▄▀▄█▄▄▄▄▄▄▄████
████ ▄▀▄▄▄▄▄▄ ▀▄▄▄▄▄▄▄▀▄▄▄▄▄ ████
████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█████
█████████████████████████████
            `;

            const qrInfo = `📱 *QR Code Generator:*\n\n` +
                `Teks: "${text}"\n\n` +
                `QR Code (ASCII):\n${qrAscii}\n\n` +
                `⚠️ Ini adalah representasi ASCII untuk demo.`;

            await message.reply(qrInfo);
            await message.react('📱');

            logger.info({ text, chatId: context.chatId }, 'QR Code generated');
        } catch (error) {
            logger.error({ err: error }, 'Failed to generate QR Code');
            await message.reply('❌ Gagal membuat QR Code');
        }
    },
};

// Command untuk informasi grup
export const groupInfoCommand: Command = {
    name: 'groupinfo',
    aliases: ['ginfo', 'grupinfo'],
    description: 'Dapatkan informasi grup',
    usage: '!groupinfo',
    category: 'utility',
    cooldown: 10000,
    execute: async (context: CommandContext) => {
        const { message, isGroup } = context;

        if (!isGroup) {
            await message.reply('❌ Command ini hanya bisa digunakan di grup');
            return;
        }

        try {
            await message.reply('📋 Sedang mengambil info grup...');

            // Simulasi info grup
            const groupInfo = `📋 *Informasi Grup:*\n\n` +
                `Nama Grup: ${context.chatId.split('@')[0]}\n` +
                `ID Grup: ${context.chatId}\n` +
                `Tipe: Grup WhatsApp\n` +
                `Total Member: 25 orang\n` +
                `Dibuat: ${new Date().toLocaleDateString('id-ID')}\n` +
                `Deskripsi: Grup WhatsApp dengan bot interaktif\n\n` +
                `🤖 Bot aktif dan siap membantu!`;

            await message.reply(groupInfo);
            await message.react('📋');

            logger.info({ groupId: context.chatId }, 'Group info sent');
        } catch (error) {
            logger.error({ err: error }, 'Failed to get group info');
            await message.reply('❌ Gagal mendapatkan informasi grup');
        }
    },
};

// Export semua utility commands
export const utilityCommands = [
    weatherCommand,
    kursCommand,
    translateCommand,
    reminderCommand,
    passwordCommand,
    qrcodeCommand,
    groupInfoCommand,
];