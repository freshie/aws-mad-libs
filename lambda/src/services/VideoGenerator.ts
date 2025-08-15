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
    private bucketName: string

    private constructor() {
        this.bucketName = process.env.IMAGES_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'ai-mad-libs-media'

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

    async generateStoryVideo(storyInput: StoryVideoInput): Promise<VideoResult> {
        if (!this.bedrockClient || !this.s3Client) {
            throw new Error('AWS Bedrock and S3 clients are not initialized.')
        }

        console.log('🎬 Generating story video with Nova Reel:', storyInput.title)
        console.log('📸 Number of images:', storyInput.images.length)

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
        // Nova Reel is not yet generally available - return mock response immediately
        console.log('⚠️ Nova Reel is not yet available in this region, creating mock video response')
        return this.createMockVideoResponse(storyInput)

        // TODO: Uncomment this code once Nova Reel becomes available
        /*
        if (!this.bedrockClient) {
            throw new Error('Bedrock client not initialized')
        }

        // Try different Nova Reel model IDs that might be available
        const possibleModelIds = [
            'amazon.nova-reel-v1:0',
            'amazon.nova-reel-v1',
            'amazon.nova-reel',
            'nova-reel-v1:0'
        ]

        let lastError: Error | null = null

        for (const modelId of possibleModelIds) {
            try {
                console.log(`🎬 Trying Nova Reel model: ${modelId}`)

                // Nova Reel payload format - simplified for text-to-video
                const payload = {
                    taskType: "TEXT_VIDEO",
                    textToVideoParams: {
                        text: prompt,
                        durationSeconds: this.calculateVideoDuration(storyInput),
                        fps: 24,
                        dimension: "1024x576",
                        motionStrength: 0.6,
                        seed: Math.floor(Math.random() * 1000000)
                    }
                }

                const command = new InvokeModelCommand({
                    modelId,
                    body: JSON.stringify(payload),
                    contentType: 'application/json',
                    accept: 'application/json'
                })

                console.log('📡 Calling Nova Reel API with payload:', JSON.stringify({ ...payload, modelId }, null, 2))
                const response = await this.bedrockClient.send(command)
                const responseBody = JSON.parse(new TextDecoder().decode(response.body))

                console.log('📥 Nova Reel response received:', {
                    modelId,
                    hasVideo: !!responseBody.video,
                    videoSize: responseBody.video?.length || 0
                })

                if (!responseBody.video) {
                    throw new Error('No video generated by Nova Reel')
                }

                // Success! Return the video data
                return new Uint8Array(Buffer.from(responseBody.video, 'base64'))

            } catch (error) {
                console.error(`❌ Model ${modelId} failed:`, error)
                lastError = error as Error
                continue // Try next model ID
            }
        }

        // If all model IDs failed, create a mock video response for now
        console.log('⚠️ All Nova Reel models failed, creating mock video response')
        return this.createMockVideoResponse(storyInput)
        */
    

    private createMockVideoResponse(storyInput: StoryVideoInput): Uint8Array {
        // Create a simple text-based "video" file that explains the feature isn't available yet
        const mockVideoContent = `
# Mad Libs Video Feature
## ${storyInput.title}

${storyInput.overallNarrative}

Scenes:
${storyInput.images.map((img, i) => `${i + 1}. ${img.text}`).join('\n')}

Note: Amazon Nova Reel video generation is not yet available in this region.
This is a placeholder response. The video feature will be enabled once Nova Reel is available.
        `.trim()

        return new Uint8Array(Buffer.from(mockVideoContent, 'utf-8'))
    }

    private async uploadVideoToS3(videoData: Uint8Array, title: string): Promise<string> {
        if (!this.s3Client) {
            throw new Error('S3 client not initialized')
        }

        // Check if this is a mock response (text content)
        const isMockResponse = videoData.length < 10000 &&
            new TextDecoder().decode(videoData).includes('Mad Libs Video Feature')

        const fileExtension = isMockResponse ? 'txt' : 'mp4'
        const contentType = isMockResponse ? 'text/plain' : 'video/mp4'
        const key = `videos/${uuidv4()}-${title.replace(/[^a-zA-Z0-9]/g, '-')}.${fileExtension}`

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
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
        const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || 'your-cloudfront-domain.cloudfront.net'
        return `https://${cloudfrontDomain}/${key}`
    }

    private calculateVideoDuration(storyInput: StoryVideoInput): number {
        // Calculate duration based on text length and number of scenes
        const baseTimePerScene = 4 // 4 seconds per scene
        const textLengthFactor = Math.max(2, Math.min(8, storyInput.overallNarrative.length / 100)) // 2-8 seconds based on text length

        return Math.min(30, storyInput.images.length * baseTimePerScene + textLengthFactor) // Max 30 seconds
    }
}