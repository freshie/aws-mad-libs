import { ImageGenerator } from '../services/ImageGenerator';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-s3');

const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockBedrockSend = jest.fn();
const mockS3Send = jest.fn();

describe('ImageGenerator', () => {
  let imageGenerator: ImageGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBedrockClient.mockImplementation(() => ({
      send: mockBedrockSend,
    }) as any);
    mockS3Client.mockImplementation(() => ({
      send: mockS3Send,
    }) as any);
    imageGenerator = ImageGenerator.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ImageGenerator.getInstance();
      const instance2 = ImageGenerator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateImage', () => {
    it('should generate an image successfully', async () => {
      const mockImageData = 'base64-encoded-image-data';
      const mockBedrockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          images: [mockImageData]
        }))
      };

      const mockS3Response = {
        ETag: '"test-etag"',
        Location: 'https://test-bucket.s3.amazonaws.com/test-key'
      };

      mockBedrockSend.mockResolvedValue(mockBedrockResponse);
      mockS3Send.mockResolvedValue(mockS3Response);

      const result = await imageGenerator.generateImage('A beautiful sunset', 'photographic');

      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('prompt', 'A beautiful sunset');
      expect(result).toHaveProperty('style', 'photographic');
      expect(result.imageUrl).toContain('test-cloudfront-domain.cloudfront.net');
      expect(mockBedrockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should generate image with reference for character consistency', async () => {
      const mockImageData = 'base64-encoded-image-data';
      const mockBedrockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          images: [mockImageData]
        }))
      };

      const mockS3Response = {
        ETag: '"test-etag"',
        Location: 'https://test-bucket.s3.amazonaws.com/test-key'
      };

      mockBedrockSend.mockResolvedValue(mockBedrockResponse);
      mockS3Send.mockResolvedValue(mockS3Response);

      const result = await imageGenerator.generateImage(
        'A character walking',
        'photographic',
        'https://example.com/reference.jpg'
      );

      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('referenceImageUrl', 'https://example.com/reference.jpg');
      expect(mockBedrockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
    });

    it('should handle Bedrock API errors', async () => {
      mockBedrockSend.mockRejectedValue(new Error('Bedrock API Error'));

      await expect(
        imageGenerator.generateImage('Test prompt', 'photographic')
      ).rejects.toThrow('Bedrock API Error');
    });

    it('should handle S3 upload errors', async () => {
      const mockBedrockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          images: ['base64-data']
        }))
      };

      mockBedrockSend.mockResolvedValue(mockBedrockResponse);
      mockS3Send.mockRejectedValue(new Error('S3 Upload Error'));

      await expect(
        imageGenerator.generateImage('Test prompt', 'photographic')
      ).rejects.toThrow('S3 Upload Error');
    });

    it('should handle invalid Bedrock response', async () => {
      const mockBedrockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          // Missing images array
        }))
      };

      mockBedrockSend.mockResolvedValue(mockBedrockResponse);

      await expect(
        imageGenerator.generateImage('Test prompt', 'photographic')
      ).rejects.toThrow();
    });
  });

  describe('validateImageStyle', () => {
    it('should validate correct image styles', () => {
      const validStyles = ['photographic', 'digital-art', 'cinematic', 'anime', 'sketch'];
      
      validStyles.forEach(style => {
        expect(() => imageGenerator.validateImageStyle(style)).not.toThrow();
      });
    });

    it('should reject invalid image styles', () => {
      const invalidStyles = ['invalid', 'wrong-style', ''];
      
      invalidStyles.forEach(style => {
        expect(() => imageGenerator.validateImageStyle(style)).toThrow();
      });
    });
  });

  describe('generateImagePrompt', () => {
    it('should enhance basic prompts', () => {
      const basicPrompt = 'A cat';
      const enhanced = imageGenerator.generateImagePrompt(basicPrompt, 'photographic');
      
      expect(enhanced).toContain('A cat');
      expect(enhanced.length).toBeGreaterThan(basicPrompt.length);
    });

    it('should add style-specific enhancements', () => {
      const prompt = 'A landscape';
      const photographicPrompt = imageGenerator.generateImagePrompt(prompt, 'photographic');
      const animePrompt = imageGenerator.generateImagePrompt(prompt, 'anime');
      
      expect(photographicPrompt).not.toBe(animePrompt);
    });
  });
});