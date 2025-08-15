import { ImageGenerator, ImageStyle } from '../../services/ImageGenerator';
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
    
    // Reset singleton instance
    ImageGenerator.resetInstance();
    
    // Mock AWS clients
    mockBedrockClient.prototype.send = mockBedrockSend;
    mockS3Client.prototype.send = mockS3Send;
    
    // Mock successful Bedrock response
    mockBedrockSend.mockResolvedValue({
      body: new TextEncoder().encode(JSON.stringify({
        images: [Buffer.from('fake-image-data').toString('base64')]
      }))
    });
    
    // Mock successful S3 upload
    mockS3Send.mockResolvedValue({});
    
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
      const result = await imageGenerator.generateImage('A beautiful sunset', { style: 'cartoon', colorScheme: 'vibrant' });

      expect(result).toHaveProperty('url');
      expect(result.prompt).toContain('A beautiful sunset');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(result.url).toContain('test-cloudfront-domain.cloudfront.net');
      expect(mockBedrockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should generate image with reference for character consistency', async () => {
      // Mock successful reference image download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });

      const result = await imageGenerator.generateImage(
        'A character in a new scene',
        { style: 'cartoon', colorScheme: 'vibrant' },
        'https://example.com/reference.jpg'
      );

      expect(result).toHaveProperty('url');
      expect(mockBedrockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
    });

    it('should handle Bedrock API errors', async () => {
      mockBedrockSend.mockRejectedValue(new Error('Bedrock API Error'));

      await expect(
        imageGenerator.generateImage('Test prompt', { style: 'cartoon', colorScheme: 'vibrant' })
      ).rejects.toThrow('Bedrock API Error');
    });

    it('should handle S3 upload errors', async () => {
      mockS3Send.mockRejectedValue(new Error('S3 Upload Error'));

      await expect(
        imageGenerator.generateImage('Test prompt', { style: 'cartoon', colorScheme: 'vibrant' })
      ).rejects.toThrow('S3 Upload Error');
    });

    it('should handle invalid Bedrock response', async () => {
      mockBedrockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({}))
      });

      await expect(
        imageGenerator.generateImage('Test prompt', { style: 'cartoon', colorScheme: 'vibrant' })
      ).rejects.toThrow();
    });
  });
});