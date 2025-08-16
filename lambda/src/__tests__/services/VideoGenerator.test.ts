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

    const mockStoryInputWithPlaceholders: StoryVideoInput = {
      title: 'A Crazy School Day',
      images: [
        { 
          url: 'https://d1657msoon2g7h.cloudfront.net/images/a47631d9-01d0-4609-9705-031b1cea3ffb.png', 
          text: 'It was a cold morning at Sunshine Elementary School. The teacher walked into the classroom carrying a mysterious spaceship.', 
          duration: 5 
        },
        { 
          url: 'https://d1657msoon2g7h.cloudfront.net/images/182bd0a1-d081-4391-bb0d-a8ab5e66b233.png', 
          text: 'During lunch, something calm happened in the cafeteria. Everyone {past_tense_verb} when they saw what was on their trays.', 
          duration: 5 
        }
      ],
      overallNarrative: 'It was a cold morning at Sunshine Elementary School. During lunch, something calm happened in the cafeteria. Everyone {past_tense_verb} when they saw what was on their trays. There were exactly 200 different types of food.'
    };

    it('should attempt Nova Reel first before falling back to mock', async () => {
      // Mock Nova Reel failure
      mockSend.mockRejectedValue(new Error('Nova Reel not available'));

      const result = await videoGenerator.generateStoryVideo(mockStoryInput);

      expect(result).toHaveProperty('url');
      expect(result.url).toContain('.txt'); // Should be mock response
    });

    it('should return .mp4 video file when Nova Reel succeeds', async () => {
      // Mock successful Nova Reel response
      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          video: 'base64-encoded-video-data'
        }))
      });

      const result = await videoGenerator.generateStoryVideo(mockStoryInput);

      expect(result).toHaveProperty('url');
      expect(result.url).toContain('.mp4'); // Should be real video
      expect(result.url).not.toContain('.txt'); // Should NOT be text file
    });

    it('should use proper Nova Reel payload structure', async () => {
      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          video: 'base64-encoded-video-data'
        }))
      });

      await videoGenerator.generateStoryVideo(mockStoryInput);

      // Verify the payload structure matches Nova Reel requirements
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'amazon.nova-reel-v1:1'
        })
      );
      
      const callArgs = mockSend.mock.calls[0][0];
      const payload = JSON.parse(callArgs.body);
      expect(payload).toHaveProperty('taskType');
      expect(payload).toHaveProperty('textToVideoParams');
      expect(payload).toHaveProperty('videoGenerationConfig');
    });

    it('should not contain unfilled placeholders in video prompt', async () => {
      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          video: 'base64-encoded-video-data'
        }))
      });

      const result = await videoGenerator.generateStoryVideo(mockStoryInputWithPlaceholders);

      expect(result.prompt).not.toContain('{past_tense_verb}');
      expect(result.prompt).not.toContain('{');
      expect(result.prompt).not.toContain('}');
    });

    it('should optimize prompts for Nova Reel (max 512 chars)', async () => {
      const longStoryInput = {
        ...mockStoryInput,
        overallNarrative: 'A'.repeat(1000) // Very long narrative
      };

      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          video: 'base64-encoded-video-data'
        }))
      });

      const result = await videoGenerator.generateStoryVideo(longStoryInput);

      expect(result.prompt.length).toBeLessThanOrEqual(512);
    });

    it('should use correct dimensions for Nova Reel (1280x720)', async () => {
      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          video: 'base64-encoded-video-data'
        }))
      });

      await videoGenerator.generateStoryVideo(mockStoryInput);

      const callArgs = mockSend.mock.calls[0][0];
      const payload = JSON.parse(callArgs.body);
      
      expect(payload.videoGenerationConfig.dimension).toBe('1280x720');
    });

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

  describe('Story Filling Integration', () => {
    it('should detect unfilled placeholders in story input', () => {
      const storyWithPlaceholders = {
        title: 'Test Story',
        images: [
          { url: 'test.jpg', text: 'The hero {past_tense_verb} across the field', duration: 5 }
        ],
        overallNarrative: 'The hero {past_tense_verb} and found treasure.'
      };

      const hasPlaceholders = videoGenerator.hasUnfilledPlaceholders(storyWithPlaceholders);
      expect(hasPlaceholders).toBe(true);
    });

    it('should detect when story is properly filled', () => {
      const filledStory = {
        title: 'Test Story',
        images: [
          { url: 'test.jpg', text: 'The hero ran across the field', duration: 5 }
        ],
        overallNarrative: 'The hero ran and found treasure.'
      };

      const hasPlaceholders = videoGenerator.hasUnfilledPlaceholders(filledStory);
      expect(hasPlaceholders).toBe(false);
    });

    it('should reject video generation for stories with unfilled placeholders', async () => {
      const storyWithPlaceholders = {
        title: 'Test Story',
        images: [
          { url: 'https://example.com/test.jpg', text: 'The hero {past_tense_verb} across the field', duration: 5 }
        ],
        overallNarrative: 'The hero {past_tense_verb} and found treasure.'
      };

      await expect(
        videoGenerator.generateStoryVideo(storyWithPlaceholders)
      ).rejects.toThrow('Story contains unfilled placeholders');
    });
  });
});