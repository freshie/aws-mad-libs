import { StoryGenerator } from '../services/StoryGenerator';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockSend = jest.fn();

describe('StoryGenerator', () => {
  let storyGenerator: StoryGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBedrockClient.mockImplementation(() => ({
      send: mockSend,
    }) as any);
    storyGenerator = StoryGenerator.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = StoryGenerator.getInstance();
      const instance2 = StoryGenerator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateTemplate', () => {
    it('should generate a story template with default theme', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              title: "Test Adventure",
              paragraphs: [
                {
                  id: "p1",
                  text: "Once upon a time, there was a [ADJECTIVE] [NOUN] who lived in a [PLACE].",
                  wordBlanks: [
                    { id: "w1", type: "adjective", position: 0 },
                    { id: "w2", type: "noun", position: 1 },
                    { id: "w3", type: "place", position: 2 }
                  ],
                  imagePrompt: "A magical adventure scene"
                }
              ],
              totalWordBlanks: 3,
              theme: "adventure",
              difficulty: "easy"
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await storyGenerator.generateTemplate();

      expect(result).toHaveProperty('title', 'Test Adventure');
      expect(result).toHaveProperty('paragraphs');
      expect(result.paragraphs).toHaveLength(1);
      expect(result.totalWordBlanks).toBe(3);
      expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
    });

    it('should generate a story template with custom theme', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              title: "Space Adventure",
              paragraphs: [
                {
                  id: "p1",
                  text: "In space, no one can hear you [VERB].",
                  wordBlanks: [
                    { id: "w1", type: "verb", position: 0 }
                  ],
                  imagePrompt: "A space scene"
                }
              ],
              totalWordBlanks: 1,
              theme: "space",
              difficulty: "easy"
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await storyGenerator.generateTemplate('space', 2);

      expect(result.theme).toBe('space');
      expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
    });

    it('should handle API errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Bedrock API Error'));

      await expect(storyGenerator.generateTemplate()).rejects.toThrow('Bedrock API Error');
    });
  });

  describe('fillTemplate', () => {
    it('should fill template with provided words', async () => {
      const template = {
        id: 'test-template',
        title: 'Test Story',
        paragraphs: [
          {
            id: 'p1',
            text: 'The [ADJECTIVE] [NOUN] went to the [PLACE].',
            wordBlanks: [
              { id: 'w1', type: 'adjective', position: 0, assignedPlayerId: null },
              { id: 'w2', type: 'noun', position: 1, assignedPlayerId: null },
              { id: 'w3', type: 'place', position: 2, assignedPlayerId: null }
            ],
            imagePrompt: 'A story scene'
          }
        ],
        totalWordBlanks: 3,
        theme: 'adventure',
        difficulty: 'easy' as const
      };

      const words = [
        { id: 'w1', wordBlankId: 'w1', playerId: 'p1', playerUsername: 'Alice', word: 'funny', wordType: 'adjective' as const, submittedAt: new Date() },
        { id: 'w2', wordBlankId: 'w2', playerId: 'p2', playerUsername: 'Bob', word: 'cat', wordType: 'noun' as const, submittedAt: new Date() },
        { id: 'w3', wordBlankId: 'w3', playerId: 'p3', playerUsername: 'Charlie', word: 'park', wordType: 'place' as const, submittedAt: new Date() }
      ];

      const result = await storyGenerator.fillTemplate(template, words);

      expect(result).toHaveProperty('title', 'Test Story');
      expect(result).toHaveProperty('paragraphs');
      expect(result.paragraphs[0].text).toBe('The funny cat went to the park.');
      expect(result.playerContributions).toHaveLength(3);
    });

    it('should handle missing words gracefully', async () => {
      const template = {
        id: 'test-template',
        title: 'Test Story',
        paragraphs: [
          {
            id: 'p1',
            text: 'The [ADJECTIVE] [NOUN].',
            wordBlanks: [
              { id: 'w1', type: 'adjective', position: 0, assignedPlayerId: null },
              { id: 'w2', type: 'noun', position: 1, assignedPlayerId: null }
            ],
            imagePrompt: 'A story scene'
          }
        ],
        totalWordBlanks: 2,
        theme: 'adventure',
        difficulty: 'easy' as const
      };

      const words = [
        { id: 'w1', wordBlankId: 'w1', playerId: 'p1', playerUsername: 'Alice', word: 'funny', wordType: 'adjective' as const, submittedAt: new Date() }
      ];

      const result = await storyGenerator.fillTemplate(template, words);

      expect(result.paragraphs[0].text).toBe('The funny [NOUN].');
    });
  });

  describe('validateTemplate', () => {
    it('should validate a correct template', () => {
      const validTemplate = {
        id: 'test-template',
        title: 'Test Story',
        paragraphs: [
          {
            id: 'p1',
            text: 'The [ADJECTIVE] [NOUN].',
            wordBlanks: [
              { id: 'w1', type: 'adjective', position: 0, assignedPlayerId: null },
              { id: 'w2', type: 'noun', position: 1, assignedPlayerId: null }
            ],
            imagePrompt: 'A story scene'
          }
        ],
        totalWordBlanks: 2,
        theme: 'adventure',
        difficulty: 'easy' as const
      };

      expect(storyGenerator.validateTemplate(validTemplate)).toBe(true);
    });

    it('should reject template with missing required fields', () => {
      const invalidTemplate = {
        id: 'test-template',
        // missing title
        paragraphs: [],
        totalWordBlanks: 0,
        theme: 'adventure',
        difficulty: 'easy' as const
      } as any;

      expect(storyGenerator.validateTemplate(invalidTemplate)).toBe(false);
    });

    it('should reject template with empty paragraphs', () => {
      const invalidTemplate = {
        id: 'test-template',
        title: 'Test Story',
        paragraphs: [],
        totalWordBlanks: 0,
        theme: 'adventure',
        difficulty: 'easy' as const
      };

      expect(storyGenerator.validateTemplate(invalidTemplate)).toBe(false);
    });
  });
});