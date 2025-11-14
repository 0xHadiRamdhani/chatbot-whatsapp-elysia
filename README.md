# 🤖 WhatsApp Bot with BunJS & ElysiaJS

A high-performance WhatsApp bot built with BunJS and ElysiaJS, featuring automatic QR refresh, graceful reconnection, conversation history persistence, webhook signature verification, rate limiting, and a powerful plugin system.

## ✨ Features

- 🚀 **High Performance**: Built with BunJS for lightning-fast execution
- 🔄 **Automatic QR Refresh**: QR codes refresh automatically for seamless authentication
- 🛡️ **Graceful Reconnection**: Smart reconnection logic with exponential backoff
- 💾 **Conversation History**: SQLite database for persistent conversation history
- 🔐 **Webhook Security**: JWT-based webhook signature verification
- ⚡ **Rate Limiting**: Per-chat rate limiting with flexible configuration
- 🎯 **Command System**: Powerful command system with aliases support
- 🔌 **Plugin Architecture**: Extensible middleware plugin system
- 🏥 **Health Monitoring**: Built-in health check endpoints
- 📝 **Structured Logging**: Pino-based structured logging
- 🐳 **Docker Ready**: Multi-stage Docker build with docker-compose
- 🔧 **TypeScript Strict**: Full TypeScript support with strict mode
- 📊 **Monitoring**: Built-in metrics and statistics

## 🎮 Fitur-Fitur Keren & Interaktif

Bot WhatsApp ini dilengkapi dengan berbagai fitur menarik dan interaktif yang akan membuat pengalaman chatting Anda lebih menyenangkan!

### 📱 Command Fun & Hiburan
| Command | Alias | Deskripsi | Contoh |
|---------|-------|-----------|---------|
| `!sticker` | `!s`, `!stiker` | Buat stiker dari gambar | `!sticker nama_stiker` |
| `!ai` | `!ask`, `!tanya` | Tanya jawab dengan AI | `!ai Apa itu javascript?` |
| `!quote` | `!q`, `!kutipan` | Buat quote aesthetic | `!quote Hidup adalah perjuangan` |
| `!tebak` | `!tebakan`, `!quiz` | Main game tebak-tebakan | `!tebak` |
| `!meme` | `!memes`, `!joke` | Generate meme random | `!meme` |
| `!fakta` | `!fact`, `!info` | Dapatkan fakta unik | `!fakta` |
| `!motivasi` | `!motiv`, `!semangat` | Dapatkan motivasi harian | `!motivasi` |

### 🛠️ Command Utilitas Praktis
| Command | Alias | Deskripsi | Contoh |
|---------|-------|-----------|---------|
| `!cuaca` | `!weather`, `!w` | Cek informasi cuaca | `!cuaca Jakarta` |
| `!kurs` | `!rate`, `!currency` | Cek kurs mata uang | `!kurs USD` |
| `!translate` | `!tr`, `!terjemah` | Terjemahkan teks sederhana | `!translate hello` |
| `!reminder` | `!ingat`, `!remind` | Atur pengingat sederhana | `!reminder 5 minum obat` |
| `!password` | `!pass`, `!pw` | Generate password acak | `!password 12` |
| `!qrcode` | `!qr`, `!barcode` | Generate QR Code dari teks | `!qrcode https://google.com` |
| `!groupinfo` | `!ginfo`, `!grupinfo` | Info grup WhatsApp | `!groupinfo` |

### 📋 Command Bawaan
| Command | Alias | Deskripsi | Contoh |
|---------|-------|-----------|---------|
| `!help` | `!h`, `!commands` | Tampilkan bantuan command | `!help` atau `!help <command>` |
| `!ping` | `!p` | Cek respons bot | `!ping` |
| `!status` | `!s` | Status bot | `!status` |
| `!stats` | `!statistics` | Statistik command | `!stats` |

## 🔌 Plugin Menarik Otomatis

### 🎭 Entertainment Plugin
Plugin ini otomatis memberikan reaksi dan balasan untuk kata kunci tertentu:

**Auto-Reactions:**
- 🔥 untuk kata seperti "mantap", "keren", "bagus"
- 😂 untuk "haha", "lol", "wkwk"
- ❤️ untuk "love", "cinta", "sayang"
- 🙏 untuk "thanks", "makasih"
- 💪 untuk "semangat", "gas", "yuk"
- Dan masih banyak lagi!

**Auto-Replies (untuk chat pribadi):**
- 🌅 Balasan otomatis untuk "selamat pagi"
- ☀️ Balasan otomatis untuk "selamat siang"  
- 🌙 Balasan otomatis untuk "selamat malam"
- 🎂 Ucapan ulang tahun otomatis
- 😴 Saran tidur saat ada kata "tidur"
- 🎮 Saran aktivitas saat bosan

### 🎵 Music Plugin
Plugin musik dengan auto-deteksi kata kunci musik:

**Auto-Reactions:**
- 🎵 untuk kata "lagu", "song", "music"
- 🎧 untuk "spotify", "youtube"
- 🎤 untuk "konser", "concert"
- 🎸 untuk "band", "musisi"

**Auto-Replies:**
- 🎵 Rekomendasi lagu-lagu bagus
- 📝 Quotes dan lirik lagu terkenal
- 🇮🇩 Musik Indonesia favorit
- 🎸 Info genre musik populer
- 😌 Musik untuk relax dan meditasi
- 🌟 Musik ceria dan semangat

## 🎨 Contoh Interaksi Menarik

```
👤: Selamat pagi!
🤖: 🌅 Selamat pagi! Semangat memulai hari!

👤: !fakta
🤖: 🌟 Fakta Unik:
Semut tidak pernah tidur. Mereka istirahat sejenak tapi tetap waspada!

👤: !cuaca Jakarta
🤖: 🌤️ Cuaca di Jakarta:
Kondisi: Cerah
Suhu: 28°C
Kelembaban: 65%
Angin: 10 km/h

👤: Lagu apa yang bagus?
🤖: 🎵 Rekomendasi lagu:
"Bohemian Rhapsody" - Queen
"Imagine" - John Lennon
"Hotel California" - Eagles
Coba dengarkan!
```

## 🚀 Quick Start

### One-Command Setup

```bash
# Clone and setup
git clone https://github.com/0xHadiRamdhani/chatbot-whatsapp-elysia
cd chatbot-whatsapp-elysia

# Copy environment configuration
cp .env.example .env

# Start with Docker (recommended)
docker-compose up -d

# Or start with Bun
bun install
bun run dev
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# Core Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# WhatsApp Configuration
SESSION_NAME=whatsapp-bot-session
QR_REFRESH_INTERVAL=30000
RECONNECT_INTERVAL=5000
MAX_RECONNECT_ATTEMPTS=10

# Database Configuration
DATABASE_PATH=./data/whatsapp-bot.db
DATABASE_BACKUP_INTERVAL=3600000

# Security Configuration
WEBHOOK_SECRET=your-webhook-secret-key
JWT_SECRET=your-jwt-secret-key
API_KEY=your-api-key

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

## 📖 Documentation

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Bot information and available endpoints |
| `/health` | GET | Health check with detailed status |
| `/status` | GET | Detailed bot status and statistics |
| `/webhook` | POST | Webhook endpoint for external integrations |
| `/commands` | GET | Command statistics and information |
| `/plugins` | GET | Plugin statistics and information |
| `/rate-limits` | GET | Rate limiting configuration |

### Command Usage

```bash
# General help
!help

# Specific command help
!help ping

# Fun commands
!meme
!fakta
!motivasi
!tebak

# Utility commands
!cuaca Jakarta
!translate hello
!password 12
!reminder 5 minum obat

# Check bot responsiveness
!ping

# Show bot status
!status

# Show statistics
!stats
```

## 🔌 Plugin Development

Create custom plugins by implementing the Plugin interface:

```typescript
import type { Plugin, MiddlewareContext } from '@/types';

export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  author: 'Your Name',
  enabled: true,
  
  async initialize() {
    // Plugin initialization logic
    console.log('Plugin initialized');
  },
  
  async destroy() {
    // Plugin cleanup logic
    console.log('Plugin destroyed');
  },
  
  async middleware(context: MiddlewareContext, next: () => Promise<void>) {
    // Plugin middleware logic
    console.log('Processing message:', context.message.body);
    await next();
  }
};
```

### Plugin Structure

```
plugins/
├── my-plugin/
│   ├── index.ts          # Main plugin file
│   ├── package.json      # Plugin metadata
│   └── README.md         # Plugin documentation
```

## 🐳 Docker Deployment

### Development

```bash
# Build development image
docker build --target development -t whatsapp-bot:dev .

# Run development container
docker run -p 3000:3000 -v $(pwd):/app whatsapp-bot:dev
```

### Production

```bash
# Build production image
docker build --target production -t whatsapp-bot:latest .

# Run production container
docker run -d \
  --name whatsapp-bot \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/sessions:/app/sessions \
  -v $(pwd)/plugins:/app/plugins \
  --env-file .env \
  whatsapp-bot:latest
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f whatsapp-bot

# Stop services
docker-compose down
```

## 📊 Monitoring & Health

### Health Check

The bot provides comprehensive health checks:

```bash
# Check health status
curl http://localhost:3000/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "checks": {
    "database": true,
    "whatsapp": true,
    "memory": true,
    "uptime": 3600
  }
}
```

### Status Monitoring

```bash
# Get detailed status
curl http://localhost:3000/status

# Response includes:
# - Uptime and memory usage
# - WhatsApp connection status
# - Command and plugin statistics
# - System information
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment |
| `PORT` | `3000` | HTTP server port |
| `HOST` | `localhost` | HTTP server host |
| `SESSION_NAME` | `whatsapp-bot-session` | WhatsApp session name |
| `QR_REFRESH_INTERVAL` | `30000` | QR code refresh interval (ms) |
| `RECONNECT_INTERVAL` | `5000` | Reconnection interval (ms) |
| `MAX_RECONNECT_ATTEMPTS` | `10` | Maximum reconnection attempts |
| `DATABASE_PATH` | `./data/whatsapp-bot.db` | SQLite database path |
| `LOG_LEVEL` | `info` | Logging level |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `30` | Maximum requests per window |

### Rate Limiting

Configure rate limiting per chat:

```typescript
// Default: 30 requests per minute per chat
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

### Logging

Configure structured logging with Pino:

```typescript
// Log levels: fatal, error, warn, info, debug, trace, silent
LOG_LEVEL=info
LOG_FILE=./logs/whatsapp-bot.log
```

## 🔐 Security

### Webhook Security

- JWT-based signature verification
- HMAC signature validation
- Timestamp validation (prevents replay attacks)
- API key authentication

### Best Practices

1. **Use strong secrets**: Generate secure random secrets for `WEBHOOK_SECRET`, `JWT_SECRET`, and `API_KEY`
2. **Enable HTTPS**: Use reverse proxy (nginx, traefik) for SSL/TLS
3. **Rate limiting**: Configure appropriate rate limits for your use case
4. **Regular updates**: Keep dependencies updated
5. **Monitor logs**: Regularly review logs for suspicious activity

## 🚨 Error Handling

The bot includes comprehensive error handling:

- **Graceful degradation**: Continues operating even if some services fail
- **Automatic recovery**: Attempts to recover from transient failures
- **Detailed logging**: All errors are logged with full context
- **Health monitoring**: Health checks detect and report issues

## 📈 Performance

### Optimization Features

- **BunJS Runtime**: Ultra-fast JavaScript runtime
- **Connection Pooling**: Efficient database connections
- **Memory Management**: Automatic cleanup and garbage collection
- **Caching**: Built-in caching for frequently accessed data
- **Async Processing**: Non-blocking I/O operations

### Benchmarks

- **Startup Time**: < 2 seconds
- **Message Processing**: < 100ms average
- **Memory Usage**: < 100MB typical
- **Database Queries**: < 10ms average

## 🎯 Tips & Best Practices

### Untuk Pengguna:
1. **Gunakan `!help <command>`** untuk bantuan spesifik command
2. **Command bersifat case-insensitive** - tidak masalah besar kecil
3. **Gunakan alias** untuk command yang panjang seperti `!s` untuk `!sticker`
4. **Plugin auto-reply hanya aktif di chat pribadi** untuk menghindari spam di grup
5. **Cooldown otomatis** - jangan spam command yang sama

### Untuk Developer:
1. **Plugin system yang fleksibel** - mudah menambahkan fitur baru
2. **TypeScript strict mode** - kode aman dan maintainable
3. **Error handling komprehensif** - semua error tertangani dengan baik
4. **Logging terstruktur** - mudah untuk debugging dan monitoring
5. **Configuration driven** - semua bisa dikustomisasi via environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Setup

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Lint code
bun run lint

# Build for production
bun run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API
- [ElysiaJS](https://elysiajs.com/) - Fast HTTP framework
- [BunJS](https://bun.sh/) - Fast JavaScript runtime
- [Pino](https://github.com/pinojs/pino) - Structured logging

## 📞 Support

- 📧 Email: hadsxdev@gmail.com
- 💬 Discord: [Join our Discord](https://discord.gg/imphnen)
- 🐛 Issues: [GitHub Issues](https://github.com/0xHadiRamdhani/chatbot-whatsapp-elysia/issues)

---

Author [Hadi Ramdhani](https://github.com/0xHadiRamdhani)