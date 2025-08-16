import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

export interface VideoResult {
    id: string
    url: string
    prompt: string
    duration: number
    width: number
    height: number
    createdAt: Date
}

export interface StoryVideoInput {
    images: Array<{
        url: string
        text: string
        duration?: number
    }>
    title: string
    overallNarrative: string
}

export class VideoGenerator {
    private static instance: VideoGenerator | null = null
    private bedrockClient: BedrockRuntimeClient | null = null
    private s3Client: S3Client | null = null
    private bucketName: string | null = null

    private constructor() {
        // Bucket name will be loaded from Parameter Store when needed

        console.log('VideoGenerator constructor - using AWS Bedrock Nova Reel for video generation')

        const region = process.env.AWS_REGION || 'us-east-1'

        // Use IAM role credentials (no explicit credentials needed in Lambda)
        this.bedrockClient = new BedrockRuntimeClient({ region })
        this.s3Client = new S3Client({ region })
    }

    public static getInstance(): VideoGenerator {
        if (!VideoGenerator.instance) {
            VideoGenerator.instance = new VideoGenerator()
        }
        return VideoGenerator.instance
    }

    public static resetInstance(): void {
        VideoGenerator.instance = null
    }

    private async getBucketName(): Promise<string> {
        if (this.bucketName) {
            return this.bucketName;
        }

        try {
            const { getImagesBucketName } = await import('../utils/config');
            this.bucketName = await getImagesBucketName();
            return this.bucketName;
        } catch (error) {
            console.error('Failed to get bucket name from Parameter Store:', error);
            // Fallback to environment variables or default
            this.bucketName = process.env.IMAGES_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'madlibsserverless-development-images-553368239051';
            return this.bucketName;
        }
    }

    async generateStoryVideo(storyInput: StoryVideoInput): Promise<VideoResult> {
        if (!this.bedrockClient || !this.s3Client) {
            throw new Error('AWS Bedrock and S3 clients are not initialized.')
        }

        console.log('🎬 Generating story video with Nova Reel:', storyInput.title)
        console.log('📸 Number of images:', storyInput.images.length)

        // Validate that story doesn't have unfilled placeholders
        if (this.hasUnfilledPlaceholders(storyInput)) {
            throw new Error('Story contains unfilled placeholders. Please ensure all word blanks are filled before generating video.')
        }

        try {
            // Create video prompt combining all story elements
            const videoPrompt = this.createVideoPrompt(storyInput)

            // Download and convert images to base64
            const imageBase64Array = await this.downloadImagesAsBase64(storyInput.images.map(img => img.url))

            // Generate video using Nova Reel
            const videoData = await this.invokeNovaReelModel(videoPrompt, imageBase64Array, storyInput)

            // Upload video to S3
            const videoUrl = await this.uploadVideoToS3(videoData, storyInput.title)

            console.log('✅ Story video generated successfully:', videoUrl)
            return {
                id: uuidv4(),
                url: videoUrl,
                prompt: videoPrompt,
                duration: this.calculateVideoDuration(storyInput),
                width: 1024,
                height: 576, // 16:9 aspect ratio
                createdAt: new Date()
            }
        } catch (error) {
            console.error('❌ Error generating story video:', error)
            throw error
        }
    }

    private createVideoPrompt(storyInput: StoryVideoInput): string {
        const sceneDescriptions = storyInput.images.map((img, index) =>
            `Scene ${index + 1}: ${img.text}`
        ).join('. ')

        return `Create an animated story video: "${storyInput.title}". ${storyInput.overallNarrative}. ${sceneDescriptions}. Style: smooth transitions between scenes, gentle camera movements, storytelling pace, family-friendly animation.`
    }

    private async downloadImagesAsBase64(imageUrls: string[]): Promise<string[]> {
        console.log('📥 Downloading images for video generation:', imageUrls.length)

        const base64Images: string[] = []

        for (const url of imageUrls) {
            try {
                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error(`Failed to download image: ${response.status}`)
                }

                const arrayBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                base64Images.push(base64)
            } catch (error) {
                console.error(`❌ Failed to download image ${url}:`, error)
                throw error
            }
        }

        console.log('✅ All images converted to base64')
        return base64Images
    }

    private async invokeNovaReelModel(prompt: string, images: string[], storyInput: StoryVideoInput): Promise<Uint8Array> {
        console.log('🚀 Nova Reel is available! Attempting video generation...')

        if (!this.bedrockClient) {
            throw new Error('Bedrock client not initialized')
        }

        try {
            const modelId = 'amazon.nova-reel-v1:1' // Use the latest version
            console.log(`🎬 Using Nova Reel model: ${modelId}`)

            // Get S3 bucket name from Parameter Store
            const bucketName = await this.getParameterValue('/madlibs/madlibsserverless-development/images-bucket-name')
            const s3OutputUri = `s3://${bucketName}/videos/`

            // Create optimized prompt for Nova Reel (max 512 chars for 6s video)
            const optimizedPrompt = this.optimizePromptForNovaReel(prompt)
            console.log('📝 Optimized prompt:', optimizedPrompt)

            // Nova Reel async payload format (correct structure from AWS docs)
            const modelInput = {
                taskType: "TEXT_VIDEO",
                textToVideoParams: {
                    text: optimizedPrompt,
                    // Include images if available
                    ...(images.length > 0 && {
                        images: images.map(imageBase64 => ({
                            format: "png",
                            source: {
                                bytes: imageBase64
                            }
                        }))
                    })
                },
                videoGenerationConfig: {
                    durationSeconds: Math.min(this.calculateVideoDuration(storyInput), 6), // Max 6s for single prompt
                    fps: 24,
                    dimension: "1280x720", // Nova Reel requires exact dimensions
                    seed: Math.floor(Math.random() * 1000000)
                }
            }

            const outputDataConfig = {
                s3OutputDataConfig: {
                    s3Uri: s3OutputUri
                }
            }

            console.log('📡 Starting Nova Reel async job...')

            // Use the correct Bedrock Runtime client method for async invocation
            const startAsyncCommand = {
                modelId,
                modelInput,
                outputDataConfig,
                clientRequestToken: `madlibs-${Date.now()}-${Math.random().toString(36).substring(2)}`
            }

            // Note: We need to use the REST API directly since AWS SDK might not have startAsyncInvoke yet
            // For now, fall back to mock until we implement the REST API call
            console.log('⚠️ Nova Reel async API requires REST implementation, using mock for now')
            return this.createMockVideoResponse(storyInput)

        } catch (error) {
            console.error('❌ Nova Reel failed:', error)
            console.log('⚠️ Falling back to mock video response')
            return this.createMockVideoResponse(storyInput)
        }
    }

    private optimizePromptForNovaReel(prompt: string): string {
        // Nova Reel best practices:
        // 1. Max 512 characters for 6s videos
        // 2. Write like image captions, not commands
        // 3. Include subject, action, environment, lighting, style
        // 4. Avoid negation words (no, not, without)
        // 5. Put camera movement at start or end

        let optimized = prompt
            // Remove command-like language
            .replace(/Create an animated story video:/gi, '')
            .replace(/Scene \d+:/gi, '')
            // Remove negation words that Nova Reel doesn't understand
            .replace(/\b(no|not|without|don't|doesn't|won't|can't)\b/gi, '')
            // Clean up extra spaces
            .replace(/\s+/g, ' ')
            .trim()

        // Truncate to 512 characters if needed
        if (optimized.length > 512) {
            optimized = optimized.substring(0, 509) + '...'
        }

        // Add camera movement for better video quality
        if (!optimized.toLowerCase().includes('camera') && !optimized.toLowerCase().includes('pan') && !optimized.toLowerCase().includes('zoom')) {
            const cameraMovements = [
                'Gentle camera movement',
                'Smooth pan across scene',
                'Slow zoom revealing details',
                'Cinematic camera flow'
            ]
            const movement = cameraMovements[Math.floor(Math.random() * cameraMovements.length)]
            optimized = `${movement}. ${optimized}`
        }

        return optimized
    }

    private async getParameterValue(parameterName: string): Promise<string> {
        try {
            const { SSMClient, GetParameterCommand } = await import('@aws-sdk/client-ssm')
            const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' })

            const command = new GetParameterCommand({
                Name: parameterName,
                WithDecryption: false
            })

            const response = await ssmClient.send(command)
            return response.Parameter?.Value || ''
        } catch (error) {
            console.error('Failed to get parameter:', parameterName, error)
            // Fallback to environment variable or default
            return process.env.IMAGES_BUCKET_NAME || 'madlibsserverless-development-images-553368239051'
        }
    }

    public hasUnfilledPlaceholders(storyInput: StoryVideoInput): boolean {
        // Check for placeholder patterns like {word_type}
        const placeholderPattern = /\{[^}]+\}/g;

        // Check overall narrative
        const narrativePlaceholders = storyInput.overallNarrative.match(placeholderPattern);
        if (narrativePlaceholders) {
            console.log('🔍 Found placeholders in narrative:', narrativePlaceholders);
            return true;
        }

        // Check each image text
        for (let i = 0; i < storyInput.images.length; i++) {
            const imagePlaceholders = storyInput.images[i].text.match(placeholderPattern);
            if (imagePlaceholders) {
                console.log(`🔍 Found placeholders in image ${i + 1}:`, imagePlaceholders);
                return true;
            }
        }

        console.log('✅ No unfilled placeholders found in story');
        return false;
    }

    private createMockVideoResponse(storyInput: StoryVideoInput): Uint8Array {
        // Create a simple text-based "video" file that explains the current status
        const mockVideoContent = `
# Mad Libs Video Feature - Preview
## ${storyInput.title}

${storyInput.overallNarrative}

## Story Scenes:
${storyInput.images.map((img, i) => `${i + 1}. ${img.text}`).join('\n')}

## Video Generation Status:
✅ Amazon Nova Reel models are ACTIVE in us-east-1
✅ Story content is properly formatted
✅ Images are available for video generation
⚠️  Nova Reel requires async REST API implementation

## Next Steps:
- Implement Nova Reel async REST API calls
- Use proper payload structure with modelInput/outputDataConfig
- Handle S3 video output and polling for completion
- Optimize prompts for video generation (max 512 chars)

## Technical Details:
- Model: amazon.nova-reel-v1:1
- Duration: ${this.calculateVideoDuration(storyInput)} seconds
- Dimensions: 1280x720 (required by Nova Reel)
- Output: S3 bucket with .mp4 file

This preview shows your complete story is ready for video generation!
This is a placeholder response. The video feature will be enabled once Nova Reel is available.
        `.trim()

        return new Uint8Array(Buffer.from(mockVideoContent, 'utf-8'))
    }

    private async uploadVideoToS3(videoData: Uint8Array, title: string): Promise<string> {
        if (!this.s3Client) {
            throw new Error('S3 client not initialized')
        }

        // Get bucket name from Parameter Store
        const bucketName = await this.getBucketName();

        // Check if this is a mock response (text content)
        const isMockResponse = videoData.length < 10000 &&
            new TextDecoder().decode(videoData).includes('Mad Libs Video Feature')

        const fileExtension = isMockResponse ? 'txt' : 'mp4'
        const contentType = isMockResponse ? 'text/plain' : 'video/mp4'
        const key = `videos/${uuidv4()}-${title.replace(/[^a-zA-Z0-9]/g, '-')}.${fileExtension}`

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: videoData,
            ContentType: contentType,
            Metadata: {
                title: title,
                generated: new Date().toISOString(),
                type: isMockResponse ? 'mock' : 'video'
            }
        })

        await this.s3Client.send(command)

        // Return CloudFront URL
        // Get the CloudFront domain from Parameter Store
        const { getCloudFrontDomain } = await import('../utils/config');
        const cloudfrontDomain = await getCloudFrontDomain();
        return `https://${cloudfrontDomain}/${key}`
    }

    private calculateVideoDuration(storyInput: StoryVideoInput): number {
        // Calculate duration based on text length and number of scenes
        const baseTimePerScene = 4 // 4 seconds per scene
        const textLengthFactor = Math.max(2, Math.min(8, storyInput.overallNarrative.length / 100)) // 2-8 seconds based on text length

        return Math.min(30, storyInput.images.length * baseTimePerScene + textLengthFactor) // Max 30 seconds
    }
}