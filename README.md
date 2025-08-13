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

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- AWS Account with Bedrock access
- Redis instance (local or AWS ElastiCache)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ai-mad-libs
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Configure AWS credentials and services in `.env.local`

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

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