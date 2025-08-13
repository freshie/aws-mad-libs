import { ImageGenerator } from '@/services/ImageGenerator'
import { MockImageGenerator } from '@/services/MockImageGenerator'

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn(),
  InvokeModelCommand: jest.fn(),
}))

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}))

describe('ImageGenerator', () => {
  let imageGenerator: ImageGenerator
  let mockImageGenerator: MockImageGenerator

  beforeEach(() => {
    // Force use of mock in tests
    process.env.NODE_ENV = 'development'
    imageGenerator = new ImageGenerator()
    mockImageGenerator = new MockImageGenerator()
  })

  afterEach(() => {
    delete process.env.NODE_ENV
  })

  describe('generateImage', () => {
    it('should generate an image result', async () => {
      const prompt = 'A magical castle in the clouds'
      const style = { style: 'cartoon' as const, colorScheme: 'vibrant' as const }

      const result = await imageGenerator.generateImage(prompt, style)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.url).toBeDefined()
      expect(result.prompt).toContain(prompt)
      expect(result.width).toBe(512)
      expect(result.height).toBe(512)
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should enhance prompts with style information', async () => {
      const prompt = 'A funny cat'
      const style = { style: 'comic' as const, colorScheme: 'pastel' as const }

      const result = await imageGenerator.generateImage(prompt, style)

      expect(result.prompt).toContain('comic book style')
      expect(result.prompt).toContain('pastel colors')
      expect(result.prompt).toContain('family-friendly')
    })

    it('should use default style when none provided', async () => {
      const prompt = 'A happy dog'

      const result = await imageGenerator.generateImage(prompt)

      expect(result.prompt).toContain('cartoon style')
      expect(result.prompt).toContain('vibrant colors')
    })

    it('should generate consistent results for same prompt', async () => {
      const prompt = 'A red bicycle'

      const result1 = await imageGenerator.generateImage(prompt)
      const result2 = await imageGenerator.generateImage(prompt)

      // URLs should be consistent for same prompt (due to seeding)
      expect(result1.url).toBe(result2.url)
    })
  })

  describe('generateBatch', () => {
    it('should generate multiple images', async () => {
      const prompts = [
        'A magical forest',
        'A flying dragon',
        'A cozy cottage'
      ]

      const results = await imageGenerator.generateBatch(prompts)

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.id).toBeDefined()
        expect(result.url).toBeDefined()
        expect(result.prompt).toContain(prompts[index])
      })
    })

    it('should apply style to all images in batch', async () => {
      const prompts = ['Image 1', 'Image 2']
      const style = { style: 'realistic' as const, colorScheme: 'monochrome' as const }

      const results = await imageGenerator.generateBatch(prompts, style)

      results.forEach(result => {
        expect(result.prompt).toContain('photorealistic')
        expect(result.prompt).toContain('black and white')
      })
    })

    it('should handle empty prompts array', async () => {
      const results = await imageGenerator.generateBatch([])

      expect(results).toHaveLength(0)
    })
  })

  describe('optimizeForVideo', () => {
    it('should optimize image for video format', async () => {
      const originalImage = await imageGenerator.generateImage('Test image')

      const optimized = await imageGenerator.optimizeForVideo(originalImage)

      expect(optimized.width).toBe(1024)
      expect(optimized.height).toBe(576) // 16:9 aspect ratio
      expect(optimized.id).toBe(originalImage.id)
      expect(optimized.url).toBe(originalImage.url)
    })
  })
})

describe('MockImageGenerator', () => {
  let mockGenerator: MockImageGenerator

  beforeEach(() => {
    mockGenerator = new MockImageGenerator()
  })

  describe('generateImage', () => {
    it('should generate mock image with different services', async () => {
      const prompts = [
        'Test prompt 1',
        'Test prompt 2',
        'Test prompt 3',
        'Test prompt 4'
      ]

      const results = await Promise.all(
        prompts.map(prompt => mockGenerator.generateImage(prompt))
      )

      // Should use different image services
      const urls = results.map(r => r.url)
      const uniqueDomains = new Set(urls.map(url => new URL(url).hostname))
      
      expect(uniqueDomains.size).toBeGreaterThan(1)
    })

    it('should simulate realistic delays', async () => {
      const startTime = Date.now()
      
      await mockGenerator.generateImage('Test prompt')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should take at least 2 seconds (minimum delay)
      expect(duration).toBeGreaterThanOrEqual(2000)
    })

    it('should generate consistent URLs for same prompt', async () => {
      const prompt = 'Consistent test prompt'

      const result1 = await mockGenerator.generateImage(prompt)
      const result2 = await mockGenerator.generateImage(prompt)

      expect(result1.url).toBe(result2.url)
    })
  })

  describe('generateBatch', () => {
    it('should add progressive delays for batch processing', async () => {
      const prompts = ['Image 1', 'Image 2', 'Image 3']
      const startTime = Date.now()

      await mockGenerator.generateBatch(prompts)

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should take longer due to progressive delays
      // First image: 2-6s, second: +1s, third: +1s = minimum ~4s
      expect(duration).toBeGreaterThanOrEqual(4000)
    })

    it('should generate different images for different prompts', async () => {
      const prompts = ['Unique prompt 1', 'Unique prompt 2']

      const results = await mockGenerator.generateBatch(prompts)

      expect(results[0].url).not.toBe(results[1].url)
      expect(results[0].prompt).toContain('Unique prompt 1')
      expect(results[1].prompt).toContain('Unique prompt 2')
    })
  })
})