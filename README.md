# AI Mad Libs Party Game

A multiplayer party game that creates hilarious Mad Libs stories using AI-generated content, images, and videos. Built with Next.js, TypeScript, and AWS services.

## Features

- 🎮 **Multiplayer Party Game**: Jackbox-style experience with room codes
- 🤖 **AI-Generated Stories**: Original Mad Libs templates created by AI
- 🎨 **AI-Generated Images**: Visual content for each story paragraph
- 🎬 **Video Creation**: Shareable videos combining story, images, and credits
- 📱 **Mobile Friendly**: Responsive design for all devices
- ⚡ **Real-time**: WebSocket-based multiplayer communication

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time communication

### Backend
- **Node.js** with Express
- **Socket.io** for WebSocket management
- **Redis** for session storage

### AI & Media Services
- **Amazon Bedrock** for story and image generation
- **AWS Elemental MediaConvert** for video processing
- **Amazon S3** for media storage
- **Amazon CloudFront** for CDN

## Architecture

![AWS Mad Libs Architecture](docs/aws-mad-libs-architecture.drawio.png)

The application follows a serverless architecture pattern with:
- **Frontend**: Next.js application hosted on S3 with CloudFront distribution
- **API Gateway**: RESTful endpoints for game management and AI services
- **Lambda Functions**: Serverless compute for business logic
- **S3 Storage**: Media files, generated content, and static assets
- **Bedrock Integration**: AI services for story and image generation

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- AWS Account with Bedrock access
- Redis instance (local or AWS ElastiCache)

### Quick Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-mad-libs
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment configuration**
```bash
# Copy the example environment file
cp .env.local.example .env.local
```

4. **Configure your environment**
   - 📖 **Follow the detailed setup guide**: [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)
   - 🔐 Set up AWS credentials and Bedrock access
   - 🪣 Configure S3 bucket name
   - 🚀 Set up deployment profile

5. **Test your configuration**
```bash
# Verify AWS connectivity
npm run check:deployment

# Start development server
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### 📚 Documentation
- 🚀 **[Environment Setup Guide](docs/ENVIRONMENT_SETUP.md)** - Complete setup instructions
- 🔧 **[Local Configuration](docs/LOCAL_CONFIG.md)** - Local vs deployment configuration
- ☁️ **[Serverless Deployment](docs/SERVERLESS_DEPLOYMENT.md)** - Deploy to AWS
- 👤 **[Deployment User Setup](DEPLOYMENT_USER_SETUP.md)** - Secure deployment credentials

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── services/           # Business logic services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── __tests__/          # Test files
```

## Game Flow

1. **Host Creates Game**: Generate room code and AI story template
2. **Players Join**: Enter room code and username
3. **Word Collection**: Players take turns providing words
4. **Story Generation**: AI fills template with player words
5. **Image Generation**: AI creates images for each paragraph
6. **Story Presentation**: Display story with images and attributions
7. **Video Creation**: Generate shareable video of the experience
8. **Sharing**: Export as text, images, or video

## Development

### Running Tests
```bash
npm test
npm run test:watch
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details