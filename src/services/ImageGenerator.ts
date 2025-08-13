import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ImageResult } from '@/types'
import { AIServiceError } from '@/utils/errors'
// No mock fallback - AWS Bedrock only
// Remove loadEnv import - rely on Next.js env loading
import { v4 as uuidv4 } from 'uuid'

export interface ImageStyle {
  style: 'cartoon' | 'realistic' | 'artistic' | 'comic'
  colorScheme: 'vibrant' | 'pastel' | 'monochrome'
}

export class ImageGenerator {
  private static instance: ImageGenerator | null = null
  private bedrockClient: BedrockRuntimeClient | null = null
  private s3Client: S3Client | null = null
  // No mock fallback - AWS Bedrock only
  private bucketName: string

  private constructor() {
    // Environment variables should be loaded by Next.js
    
    this.bucketName = process.env.S3_BUCKET_NAME || 'ai-mad-libs-media'
    // AWS Bedrock only - no mock fallback
    
    // Check for required AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new AIServiceError(
        'AWS credentials are required for image generation. Please configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env.local file.',
        'MISSING_CREDENTIALS'
      )
    }
    
    // AWS credentials validated - proceeding with Bedrock
    console.log('ImageGenerator constructor - using AWS Bedrock for image generation')

    const region = process.env.AWS_REGION || 'us-east-1'
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }

    this.bedrockClient = new BedrockRuntimeClient({ region, credentials })
    this.s3Client = new S3Client({ region, credentials })
  }

  public static getInstance(): ImageGenerator {
    if (!ImageGenerator.instance) {
      ImageGenerator.instance = new ImageGenerator()
    }
    return ImageGenerator.instance
  }

  // For testing purposes only
  public static resetInstance(): void {
    ImageGenerator.instance = null
  }

  async generateImage(prompt: string, style: ImageStyle = { style: 'cartoon', colorScheme: 'vibrant' }): Promise<ImageResult> {
    if (!this.bedrockClient || !this.s3Client) {
      throw new AIServiceError(
        'AWS Bedrock and S3 clients are not initialized. Please check your AWS credentials.',
        'SERVICE_NOT_INITIALIZED'
      )
    }

    return this.generateImageWithRetry(prompt, style, 0)
  }

  private async generateImageWithRetry(prompt: string, style: ImageStyle, attempt: number): Promise<ImageResult> {
    const maxAttempts = 4
    const backoffDelays = [0, 15000, 30000, 60000, 120000] // 0s, 15s, 30s, 1min, 2min

    try {
      if (attempt > 0) {
        console.log(`⏳ Retrying image generation (attempt ${attempt + 1}/${maxAttempts}) after ${backoffDelays[attempt] / 1000}s delay`)
        await this.sleep(backoffDelays[attempt])
      }

      console.log('🎨 Generating image with Bedrock Nova:', prompt)
      const enhancedPrompt = this.enhancePrompt(prompt, style)
      const imageData = await this.invokeBedrockImageModel(enhancedPrompt)
      const imageUrl = await this.uploadToS3(imageData, prompt)

      console.log('✅ Image generated successfully:', imageUrl)
      return {
        id: uuidv4(),
        url: imageUrl,
        prompt: enhancedPrompt,
        width: 512,
        height: 512,
        createdAt: new Date()
      }
    } catch (error) {
      console.error(`❌ Error generating image (attempt ${attempt + 1}):`, error)
      
      // Check if it's a throttling error and we have retries left
      if (error.name === 'ThrottlingException' && attempt < maxAttempts - 1) {
        console.log(`🔄 Throttling detected, will retry in ${backoffDelays[attempt + 1] / 1000} seconds...`)
        return this.generateImageWithRetry(prompt, style, attempt + 1)
      }
      
      // If we've exhausted retries or it's a different error, fall back to mock
      console.error('🚨 All retry attempts failed or non-throttling error, falling back to mock')
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        code: error.code || 'Unknown'
      })
      
      // No mock fallback - throw the error
      throw error
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async generateBatch(prompts: string[], style: ImageStyle = { style: 'cartoon', colorScheme: 'vibrant' }): Promise<ImageResult[]> {
    if (!this.bedrockClient || !this.s3Client) {
      throw new AIServiceError(
        'AWS Bedrock and S3 clients are not initialized. Please check your AWS credentials.',
        'SERVICE_NOT_INITIALIZED'
      )
    }

    const results: ImageResult[] = []
    
    // Generate images sequentially with longer delays to avoid rate limits
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i]
      try {
        console.log(`🎨 Generating batch image ${i + 1}/${prompts.length}`)
        const result = await this.generateImage(prompt, style)
        results.push(result)
        
        // Add longer delay between batch requests to avoid throttling
        if (i < prompts.length - 1) {
          console.log(`⏳ Waiting 5 seconds before next batch image...`)
          await this.sleep(5000)
        }
      } catch (error) {
        console.error(`Error generating batch image for prompt "${prompt}":`, error)
        // No mock fallback - throw the error
        throw error
      }
    }

    return results
  }

  async optimizeForVideo(image: ImageResult): Promise<ImageResult> {
    if (!this.bedrockClient || !this.s3Client) {
      throw new AIServiceError(
        'AWS Bedrock and S3 clients are not initialized. Please check your AWS credentials.',
        'SERVICE_NOT_INITIALIZED'
      )
    }

    // For now, return the same image
    // In a full implementation, this would resize/optimize for video
    return {
      ...image,
      width: 1024,
      height: 576, // 16:9 aspect ratio for video
    }
  }

  private async invokeBedrockImageModel(prompt: string): Promise<Uint8Array> {
    if (!this.bedrockClient) {
      throw new Error('Bedrock client not initialized')
    }

    // Use Amazon Nova Canvas model
    const modelId = process.env.BEDROCK_IMAGE_MODEL_ID || 'amazon.nova-canvas-v1:0'
    
    const payload = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: prompt,
        negativeText: "blurry, low quality, distorted, text, watermark, signature"
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        height: 512,
        width: 512,
        cfgScale: 8.0,
        seed: Math.floor(Math.random() * 1000000)
      }
    }

    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(payload),
      contentType: 'application/json',
      accept: 'application/json'
    })

    try {
      console.log('📡 Calling Bedrock Nova API with payload:', JSON.stringify(payload, null, 2))
      const response = await this.bedrockClient.send(command)
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      
      console.log('📥 Bedrock response received:', {
        hasImages: !!responseBody.images,
        imageCount: responseBody.images?.length || 0
      })
      
      if (!responseBody.images || responseBody.images.length === 0) {
        throw new Error('No image generated by Bedrock Nova')
      }

      // Decode base64 image data
      const base64Image = responseBody.images[0]
      return new Uint8Array(Buffer.from(base64Image, 'base64'))
    } catch (error) {
      console.error('🚨 Bedrock API call failed:', error)
      if (error.name === 'ValidationException') {
        console.error('💡 This is likely a payload format issue')
      } else if (error.name === 'ThrottlingException') {
        console.error('🚦 Rate limit exceeded - will retry with backoff')
      } else if (error.name === 'ServiceQuotaExceededException') {
        console.error('📊 Service quota exceeded - may need to request limit increase')
      }
      throw error
    }
  }

  private async uploadToS3(imageData: Uint8Array, prompt: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }

    const key = `images/${uuidv4()}.png`
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: imageData,
      ContentType: 'image/png',
      Metadata: {
        prompt: prompt.substring(0, 1000), // Limit metadata size
        generatedAt: new Date().toISOString()
      }
    })

    await this.s3Client.send(command)

    // Generate signed URL for access
    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })

    return await getSignedUrl(this.s3Client, getCommand, { expiresIn: 7 * 24 * 60 * 60 }) // 7 days
  }

  private enhancePrompt(prompt: string, style: ImageStyle): string {
    const styleModifiers = {
      cartoon: 'modern Hanna-Barbera cartoon style, 2020s animation, clean vector art, bold outlines, flat colors, contemporary cartoon design, animated series style',
      realistic: 'photorealistic, detailed, high quality',
      artistic: 'artistic, painterly, creative, stylized',
      comic: 'comic book style, bold lines, dynamic'
    }

    const colorModifiers = {
      vibrant: 'vibrant saturated colors, bright cheerful palette, bold color choices',
      pastel: 'soft pastel colors, gentle tones, muted palette',
      monochrome: 'black and white, high contrast, grayscale'
    }

    return `${prompt}, ${styleModifiers[style.style]}, ${colorModifiers[style.colorScheme]}, family-friendly, safe for work, no text, high quality, smooth gradients, modern cartoon illustration`
  }


}