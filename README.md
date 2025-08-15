# AWS Mad Libs Game

A serverless Mad Libs game that creates hilarious stories using AI-generated content, images, and videos. Built with Next.js, AWS CDK, and AWS Bedrock AI services.

## Features

- 🤖 **AI-Generated Stories**: Original Mad Libs templates created by Amazon Bedrock
- 🎨 **AI-Generated Images**: Visual content using Amazon Nova Canvas
- 🎬 **Video Creation**: Shareable videos using Amazon Nova Reel
- 📱 **Mobile Friendly**: Responsive design optimized for all devices
- ⚡ **Serverless**: Fully serverless architecture with AWS Lambda
- 🔒 **Secure**: IAM-based security with encrypted storage

## Tech Stack

### Frontend
- **Next.js 14** with App Router and static export
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Hosted on S3** with CloudFront CDN

### Backend (Serverless)
- **AWS Lambda** functions for all business logic
- **API Gateway** for RESTful endpoints
- **DynamoDB** for game data storage
- **S3** for static hosting and media storage

### AI & Media Services
- **Amazon Bedrock Nova Lite** for story generation
- **Amazon Nova Canvas** for image generation
- **Amazon Nova Reel** for video generation
- **Amazon S3** for media storage and static hosting
- **Amazon CloudFront** for global content delivery

## Architecture

![AWS Mad Libs Architecture](docs/aws-mad-libs-architecture.drawio.png)

The application follows a fully serverless architecture pattern:

### Core Infrastructure
- **CloudFront Distribution**: Global CDN for static assets and API caching
- **S3 Buckets**: Static website hosting and AI-generated media storage
- **API Gateway**: RESTful endpoints with CORS support and throttling
- **Lambda Functions**: Serverless compute with automatic scaling
- **DynamoDB**: NoSQL database with single-table design and GSI indexes

### Lambda Functions
- **Story Generation**: Creates Mad Libs templates using Bedrock Nova Lite
- **Story Fill**: Fills templates with player words and generates final stories
- **Image Generation**: Creates images using Amazon Nova Canvas
- **Video Generation**: Produces videos using Amazon Nova Reel
- **Test AWS**: Validates AWS service connectivity

### AI Services
- **Amazon Bedrock**: Foundation models for text and media generation
- **Nova Lite**: Fast text generation for stories and prompts
- **Nova Canvas**: High-quality image generation from text descriptions
- **Nova Reel**: Video generation combining images and text

## Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **AWS Account** with Bedrock access enabled
- **AWS CLI** configured with appropriate permissions
- **CDK CLI** installed globally (`npm install -g aws-cdk`)

### Quick Setup

1. **Clone the repository**
```bash
git clone https://github.com/freshie/aws-mad-libs.git
cd aws-mad-libs
```

2. **Install dependencies**
```bash
npm install
cd lambda && npm install && cd ..
```

3. **Configure AWS credentials**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1 recommended)
```

4. **Bootstrap CDK (first time only)**
```bash
npm run cdk:bootstrap
```

5. **Build and deploy the serverless stack**
```bash
# Build Lambda functions
npm run build:lambda

# Deploy infrastructure
npm run cdk:deploy
```

6. **Build and deploy the frontend**
```bash
# Build Next.js static site
npm run build

# Deploy to S3 (outputs will show the S3 bucket name)
aws s3 sync out/ s3://YOUR-WEBSITE-BUCKET-NAME --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR-DISTRIBUTION-ID --paths "/*"
```

### 🚀 Deployment Scripts
- `npm run deploy:serverless` - Full automated deployment
- `npm run cdk:deploy` - Deploy AWS infrastructure only
- `npm run cdk:destroy` - Remove all AWS resources
- `npm run check:deployment` - Verify deployment readiness

## Project Structure

```
├── src/                    # Next.js frontend application
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   └── utils/            # Frontend utilities
├── lambda/                # AWS Lambda functions
│   ├── src/              # Lambda source code
│   │   ├── services/     # Business logic services
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Lambda utilities
│   └── dist/             # Compiled Lambda code
├── cdk/                   # AWS CDK infrastructure code
├── docs/                  # Documentation and diagrams
└── scripts/              # Deployment and setup scripts
```

## API Endpoints

The serverless API provides the following endpoints:

- `POST /api/story/generate-template` - Generate a new Mad Libs template
- `POST /api/story/fill-template` - Fill template with player words
- `POST /api/image/generate` - Generate images for story paragraphs
- `POST /api/video/generate` - Create shareable video content
- `GET /api/test-aws` - Test AWS service connectivity

## Game Flow

1. **Story Template Generation**: AI creates a Mad Libs template with blanks
2. **Word Collection**: Players provide words for each blank (noun, verb, adjective, etc.)
3. **Story Completion**: AI fills the template with player words
4. **Image Generation**: AI creates visual content for each story paragraph
5. **Video Creation**: Combine story, images, and credits into a shareable video
6. **Sharing**: Download or share the completed story and media

## Development

### Local Development
```bash
# Start Next.js development server
npm run dev

# Build Lambda functions
npm run build:lambda

# Deploy changes to AWS
npm run cdk:deploy
```

### CDK Commands
```bash
# View infrastructure changes
npm run cdk:diff

# Synthesize CloudFormation templates
npm run cdk:synth

# List all stacks
npm run cdk:ls

# Watch for changes and auto-deploy
npm run cdk:watch
```

### Building
```bash
# Build frontend for production
npm run build

# Build Lambda functions
npm run build:lambda

# Clean Lambda build artifacts
npm run clean:lambda
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details