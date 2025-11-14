import type { Plugin } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Music plugin dengan fitur musik dan audio
 * Auto-deteksi lirik, quotes musik, dan info musik
 */
export const musicPlugin: Plugin = {
    name: 'music-plugin',
    version: '1.0.0',
    description: 'Plugin musik dengan auto-deteksi lirik dan quotes musik',
    author: 'Bot Developer',
    enabled: true,

    async initialize() {
        logger.info('Music plugin initialized');
    },

    async destroy() {
        logger.info('Music plugin destroyed');
    },

    async middleware(context: any, next: () => Promise<void>) {
        const { message } = context;
        const messageBody = (message.body ?? '').toLowerCase();

        try {
            // Auto-deteksi kata kunci musik
            await handleMusicDetection(message, messageBody);

            // Auto-reply untuk kata kunci musik
            await handleMusicReplies(message, messageBody);

        } catch (error) {
            logger.error({ err: error }, 'Error in music plugin');
        }

        // Continue to next middleware
        await next();
    }
};

// Fungsi untuk handle deteksi musik
async function handleMusicDetection(message: any, messageBody: string): Promise<void> {
    const musicTriggers = [
        { keywords: ['lagu', 'song', 'music'], reaction: '🎵' },
        { keywords: ['playlist', 'putar', 'play'], reaction: '🎶' },
        { keywords: ['spotify', 'youtube', 'music'], reaction: '🎧' },
        { keywords: ['konser', 'concert', 'festival'], reaction: '🎤' },
        { keywords: ['band', 'grup musik', 'musisi'], reaction: '🎸' },
    ];

    for (const trigger of musicTriggers) {
        if (trigger.keywords.some(keyword => messageBody.includes(keyword))) {
            try {
                await message.react(trigger.reaction);
                logger.debug({ reaction: trigger.reaction }, 'Music reaction triggered');
                break;
            } catch (error) {
                logger.debug({ err: error }, 'Failed to add music reaction');
            }
        }
    }
}

// Fungsi untuk handle musik replies
async function handleMusicReplies(message: any, messageBody: string): Promise<void> {
    if (message.fromMe) return;

    const musicReplies = [
        {
            keywords: ['rekomendasi lagu', 'lagu bagus', 'lagu enak'],
            responses: [
                '🎵 Rekomendasi lagu:\n\n"Bohemian Rhapsody" - Queen\n"Imagine" - John Lennon\n"Hotel California" - Eagles\n\nCoba dengarkan!',
                '🎶 Lagu enak untuk didengar:\n\n"Perfect" - Ed Sheeran\n"Someone Like You" - Adele\n"Fix You" - Coldplay\n\nEnjoy the music!',
                '🎧 Musik recommendation:\n\n"Shape of You" - Ed Sheeran\n"Uptown Funk" - Bruno Mars\n"Thinking Out Loud" - Ed Sheeran\n\nHappy listening!',
            ]
        },
        {
            keywords: ['lirik', 'lyrics', 'kata-kata lagu'],
            responses: [
                '📝 Lirik lagu favorit:\n\n"And I will always love you" - Whitney Houston\n"I want to hold your hand" - The Beatles\n"Don\'t stop believin\'" - Journey\n\nBeautiful lyrics!',
                '🎵 Quotes dari lagu:\n\n"All you need is love" - The Beatles\n"I will survive" - Gloria Gaynor\n"We are the champions" - Queen\n\nInspirational!',
                '🎶 Lirik yang bermakna:\n\n"Let it be" - The Beatles\n"Don\'t worry, be happy" - Bobby McFerrin\n"Here comes the sun" - The Beatles\n\nPositive vibes!',
            ]
        },
        {
            keywords: ['musik indonesia', 'lagu indonesia', 'musik lokal'],
            responses: [
                '🇮🇮 Musik Indonesia terbaik:\n\n"Separuh Aku" - Noah\n"Tak Bisakah" - Peterpan\n"Cinta Terakhir" - Zigaz\n\nPride of Indonesia!',
                '🎵 Lagu-lagu Indonesia:\n\n"Kangen" - Dewa 19\n"Bento" - Iwan Fals\n"Angin" - Dewa 19\n\nMusik kita!',
                '🎶 Musik lokal favorit:\n\n"Ada Apa Denganmu" - Peterpan\n"Kamu dan Kenangan" - Dewa 19\n"Separuh Nafas" - Dewa 19\n\nLegendary!',
            ]
        },
        {
            keywords: ['genre musik', 'tipe musik', 'jenis musik'],
            responses: [
                '🎸 Genre musik populer:\n• Pop - Musik yang easy listening\n• Rock - Musik dengan gitar dominan\n• Jazz - Musik dengan improvisasi\n• Classical - Musik klasik\n• EDM - Electronic Dance Music',
                '🎵 Macam-macam musik:\n• Reggae - Musik dari Jamaica\n• Blues - Musik penuh emosi\n• Country - Musik pedalaman Amerika\n• Hip-Hop - Musik dengan rap\n• R&B - Rhythm and Blues',
                '🎧 Jenis musik:\n• Metal - Musik berat dan keras\n• Folk - Musik tradisional\n• Funk - Musik dengan groove\n• Soul - Musik penuh perasaan\n• Disco - Musik untuk dance',
            ]
        },
        {
            keywords: ['musik santai', 'musik tenang', 'musik relax'],
            responses: [
                '😌 Musik untuk relax:\n\n"River Flows in You" - Yiruma\n"Canon in D" - Pachelbel\n"Clair de Lune" - Debussy\n\nPerfect for relaxation!',
                '🧘 Musik santai:\n\n"Weightless" - Marconi Union\n"Electra" - Airstream\n"Watermark" - Enya\n\nCalming music!',
                '🌙 Musik tenang:\n\n"Gymnopédie No.1" - Erik Satie\n"Nocturne Op.9 No.2" - Chopin\n"Moonlight Sonata" - Beethoven\n\nPeaceful melodies!',
            ]
        },
        {
            keywords: ['musik ceria', 'musik happy', 'musik semangat'],
            responses: [
                '🌟 Musik ceria:\n\n"Happy" - Pharrell Williams\n"Good as Hell" - Lizzo\n"Walking on Sunshine" - Katrina & The Waves\n\nHappy vibes!',
                '🎉 Musik semangat:\n\n"Eye of the Tiger" - Survivor\n"Don\'t Stop Me Now" - Queen\n"Stronger" - Kanye West\n\nEnergy booster!',
                '😊 Musik happy:\n\n"Can\'t Stop the Feeling" - Justin Timberlake\n"Uptown Funk" - Bruno Mars\n"Good Time" - Owl City & Carly Rae Jepsen\n\nFeel good music!',
            ]
        }
    ];

    // Cek setiap musik reply trigger
    for (const musicReply of musicReplies) {
        if (musicReply.keywords.some(keyword => messageBody.includes(keyword))) {
            try {
                const randomResponse = musicReply.responses[Math.floor(Math.random() * musicReply.responses.length)];
                if (randomResponse) {
                    await message.reply(randomResponse);
                    logger.info({ keywords: musicReply.keywords }, 'Music reply triggered');
                    break; // Hanya satu reply per pesan
                }
            } catch (error) {
                logger.debug({ err: error }, 'Failed to send music reply');
            }
        }
    }
}

export default musicPlugin;