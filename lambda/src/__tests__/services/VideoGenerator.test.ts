import { VideoGenerator, StoryVideoInput } from '../../services/VideoGenerator';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-s3');

const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockSend = jest.fn();

// Mock fetch for image downloads
global.fetch = jest.fn();

describe('VideoGenerator', () => {
  let videoGenerator: VideoGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    VideoGenerator.resetInstance();
    
    // Mock Bedrock client
    mockBedrockClient.prototype.send = mockSend;
    
    // Mock fetch for image downloads
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    });
    
    videoGenerator = VideoGenerator.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = VideoGenerator.getInstance();
      const instance2 = VideoGenerator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateStoryVideo', () => {
    const mockStoryInput: StoryVideoInput = {
      title: 'Test Story',
      images: [
        { url: 'https://example.com/image1.jpg', text: 'A brave hero starts their journey', duration: 4 },
        { url: 'https://example.com/image2.jpg', text: 'They discover a magical forest', duration: 4 }
      ],
      overallNarrative: 'Once upon a time, there was a magical adventure.'
    };

    it('should generate video successfully (mock response)', async () => {
      const result = await videoGenerator.generateStoryVideo(mockStoryInput);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('id');
      expect(result.url).toContain('test-cloudfront-domain.cloudfront.net');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle image download errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        videoGenerator.generateStoryVideo(mockStoryInput)
      ).rejects.toThrow('Network error');
    });

    it('should handle empty images array', async () => {
      const invalidInput = {
        ...mockStoryInput,
        images: []
      };

      const result = await videoGenerator.generateStoryVideo(invalidInput);
      expect(result).toHaveProperty('url');
    });
  });
});