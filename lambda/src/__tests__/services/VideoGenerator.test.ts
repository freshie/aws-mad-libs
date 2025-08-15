import { VideoGenerator, StoryVideoInput } from '../services/VideoGenerator';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockSend = jest.fn();

describe('VideoGenerator', () => {
  let videoGenerator: VideoGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBedrockClient.mockImplementation(() => ({
      send: mockSend,
    }) as any);
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
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ],
      storyText: 'Once upon a time, there was a magical adventure.',
      playerCredits: [
        { playerName: 'Alice', wordsContributed: ['funny', 'cat'] },
        { playerName: 'Bob', wordsContributed: ['park', 'running'] }
      ]
    };

    it('should generate video successfully with Nova Reel', async () => {
      const mockVideoData = 'base64-encoded-video-data';
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          video: mockVideoData
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await videoGenerator.generateStoryVideo(mockStoryInput);

      expect(result).toHaveProperty('videoUrl');
      expect(result).toHaveProperty('format', 'mp4');
      expect(result).toHaveProperty('duration');
      expect(result.videoUrl).toContain('test-cloudfront-domain.cloudfront.net');
      expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
    });

    it('should fallback to mock video when Nova Reel is unavailable', async () => {
      // Mock Nova Reel being unavailable
      mockSend.mockRejectedValue(new Error('Model not available'));

      const result = await videoGenerator.generateStoryVideo(mockStoryInput);

      expect(result).toHaveProperty('videoUrl');
      expect(result).toHaveProperty('format', 'mp4');
      expect(result).toHaveProperty('isMockVideo', true);
      expect(result.videoUrl).toContain('test-cloudfront-domain.cloudfront.net');
    });

    it('should validate story input', async () => {
      const invalidInput = {
        title: '',
        images: [],
        storyText: '',
        playerCredits: []
      };

      await expect(
        videoGenerator.generateStoryVideo(invalidInput)
      ).rejects.toThrow('Invalid story input');
    });

    it('should handle missing images', async () => {
      const inputWithoutImages = {
        ...mockStoryInput,
        images: []
      };

      await expect(
        videoGenerator.generateStoryVideo(inputWithoutImages)
      ).rejects.toThrow('At least one image is required');
    });

    it('should handle empty story text', async () => {
      const inputWithoutText = {
        ...mockStoryInput,
        storyText: ''
      };

      await expect(
        videoGenerator.generateStoryVideo(inputWithoutText)
      ).rejects.toThrow('Story text is required');
    });
  });

  describe('createMockVideo', () => {
    it('should create a mock video response', async () => {
      const mockStoryInput: StoryVideoInput = {
        title: 'Test Story',
        images: ['https://example.com/image1.jpg'],
        storyText: 'Test story text',
        playerCredits: [{ playerName: 'Alice', wordsContributed: ['test'] }]
      };

      const result = await videoGenerator.createMockVideo(mockStoryInput);

      expect(result).toHaveProperty('videoUrl');
      expect(result).toHaveProperty('format', 'mp4');
      expect(result).toHaveProperty('isMockVideo', true);
      expect(result).toHaveProperty('duration');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('validateStoryInput', () => {
    it('should validate correct story input', () => {
      const validInput: StoryVideoInput = {
        title: 'Test Story',
        images: ['https://example.com/image1.jpg'],
        storyText: 'Test story text',
        playerCredits: [{ playerName: 'Alice', wordsContributed: ['test'] }]
      };

      expect(() => videoGenerator.validateStoryInput(validInput)).not.toThrow();
    });

    it('should reject input with missing title', () => {
      const invalidInput = {
        title: '',
        images: ['https://example.com/image1.jpg'],
        storyText: 'Test story text',
        playerCredits: []
      };

      expect(() => videoGenerator.validateStoryInput(invalidInput)).toThrow('Invalid story input');
    });

    it('should reject input with no images', () => {
      const invalidInput = {
        title: 'Test Story',
        images: [],
        storyText: 'Test story text',
        playerCredits: []
      };

      expect(() => videoGenerator.validateStoryInput(invalidInput)).toThrow('At least one image is required');
    });

    it('should reject input with empty story text', () => {
      const invalidInput = {
        title: 'Test Story',
        images: ['https://example.com/image1.jpg'],
        storyText: '',
        playerCredits: []
      };

      expect(() => videoGenerator.validateStoryInput(invalidInput)).toThrow('Story text is required');
    });
  });

  describe('calculateVideoDuration', () => {
    it('should calculate duration based on story length', () => {
      const shortStory = 'Short story.';
      const longStory = 'This is a much longer story with many words that should result in a longer video duration.';

      const shortDuration = videoGenerator.calculateVideoDuration(shortStory, 1);
      const longDuration = videoGenerator.calculateVideoDuration(longStory, 3);

      expect(longDuration).toBeGreaterThan(shortDuration);
      expect(shortDuration).toBeGreaterThan(0);
    });

    it('should account for number of images', () => {
      const story = 'Test story text';
      const durationWith1Image = videoGenerator.calculateVideoDuration(story, 1);
      const durationWith3Images = videoGenerator.calculateVideoDuration(story, 3);

      expect(durationWith3Images).toBeGreaterThan(durationWith1Image);
    });
  });
});