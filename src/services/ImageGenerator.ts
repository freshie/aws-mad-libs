// Frontend ImageGenerator - calls API endpoints instead of AWS directly
import { ImageResult } from '@/types'
import { AIServiceError } from '@/utils/errors'
import { v4 as uuidv4 } from 'uuid'

export interface ImageStyle {
  style: 'cartoon' | 'realistic' | 'artistic' | 'comic'
  colorScheme: 'vibrant' | 'pastel' | 'monochrome'
}

export class ImageGenerator {
  private static instance: ImageGenerator | null = null

  private constructor() {
    console.log('ImageGenerator initialized - Frontend API client')
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
    try {
      // Call the API endpoint instead of AWS directly
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style: style.style
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate image')
      }

      const data = await response.json()
      console.log('🎨 Frontend ImageGenerator - Raw API response:', JSON.stringify(data, null, 2))
      console.log('🎨 Frontend ImageGenerator - data.success:', data.success)
      console.log('🎨 Frontend ImageGenerator - data.result:', data.result)
      
      // The API returns { success: true, result: { id, url, ... } }
      if (!data.success || !data.result) {
        console.error('❌ Frontend ImageGenerator - Invalid API response structure:', data)
        throw new Error('Invalid API response structure')
      }

      console.log('🔗 Frontend ImageGenerator - data.result.url:', data.result.url)
      console.log('🔗 Frontend ImageGenerator - typeof data.result.url:', typeof data.result.url)

      if (!data.result.url) {
        console.error('❌ Frontend ImageGenerator - Missing URL in API response:', data.result)
        throw new Error('Missing URL in API response')
      }

      const result = {
        id: data.result.id || uuidv4(),
        url: data.result.url,
        prompt: prompt,
        width: 512,
        height: 512,
        createdAt: new Date()
      }
      
      console.log('✅ Frontend ImageGenerator - Final result object:', result)
      console.log('✅ Frontend ImageGenerator - result.url:', result.url)
      return result
    } catch (error) {
      console.error('Image generation failed:', error)
      throw new AIServiceError('ImageGenerator')
    }
  }

  async generateBatch(prompts: string[], style: ImageStyle = { style: 'cartoon', colorScheme: 'vibrant' }): Promise<ImageResult[]> {
    const results: ImageResult[] = []
    for (const prompt of prompts) {
      const result = await this.generateImage(prompt, style)
      results.push(result)
    }
    return results
  }

  // Optimize image for video format
  async optimizeForVideo(imageResult: ImageResult): Promise<ImageResult> {
    // For now, just return the same image
    // In the future, this could call an API endpoint to resize/optimize
    return imageResult
  }
}