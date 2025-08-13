import { ImageResult } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export interface ImageStyle {
  style: 'cartoon' | 'realistic' | 'artistic' | 'comic'
  colorScheme: 'vibrant' | 'pastel' | 'monochrome'
}

export class MockImageGenerator {
  private imageCategories = [
    'nature', 'animals', 'fantasy', 'space', 'food', 'architecture', 
    'abstract', 'people', 'technology', 'art', 'landscape', 'city'
  ]

  async generateImage(prompt: string, style: ImageStyle = { style: 'cartoon', colorScheme: 'vibrant' }): Promise<ImageResult> {
    // Simulate realistic API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 4000))

    const seed = this.hashString(prompt)
    const category = this.imageCategories[seed % this.imageCategories.length]
    const width = 512
    const height = 512
    
    // Use different placeholder services for variety
    const services = [
      `https://picsum.photos/seed/${seed}/${width}/${height}`,
      `https://source.unsplash.com/${width}x${height}/?${category}&sig=${seed}`,
      `https://loremflickr.com/${width}/${height}/${category}?random=${seed}`
    ]
    
    const serviceIndex = seed % services.length
    const mockUrl = services[serviceIndex]

    return {
      id: uuidv4(),
      url: mockUrl,
      prompt: this.enhancePrompt(prompt, style),
      width,
      height,
      createdAt: new Date()
    }
  }

  async generateBatch(prompts: string[], style: ImageStyle = { style: 'cartoon', colorScheme: 'vibrant' }): Promise<ImageResult[]> {
    const results: ImageResult[] = []
    
    // Generate images with staggered delays to simulate real API behavior
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i]
      
      // Add progressive delay to simulate batch processing
      await new Promise(resolve => setTimeout(resolve, i * 1000))
      
      const result = await this.generateImage(prompt, style)
      results.push(result)
    }

    return results
  }

  async optimizeForVideo(image: ImageResult): Promise<ImageResult> {
    // Simulate optimization delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      ...image,
      width: 1024,
      height: 576, // 16:9 aspect ratio for video
    }
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

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}