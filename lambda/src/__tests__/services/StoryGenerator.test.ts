import { StoryGenerator } from '../../services/StoryGenerator';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { WordType } from '../../types/game';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockSend = jest.fn();

describe('StoryGenerator', () => {
  let storyGenerator: StoryGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    StoryGenerator.resetInstance();
    
    // Mock Bedrock client
    mockBedrockClient.prototype.send = mockSend;
    
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
              title: 'Test Adventure',
              paragraphs: [{
                id: 'p1',
                text: 'The [ADJECTIVE] [NOUN] went to the [PLACE].',
                wordBlanks: [
                  { id: 'w1', type: 'adjective', position: 4, assignedPlayerId: null },
                  { id: 'w2', type: 'noun', position: 15, assignedPlayerId: null },
                  { id: 'w3', type: 'place', position: 27, assignedPlayerId: null }
                ],
                imagePrompt: 'A character going to a place'
              }],
              totalWordBlanks: 3,
              theme: 'adventure',
              difficulty: 'easy'
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await storyGenerator.generateTemplate();

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('paragraphs');
      expect(result.paragraphs.length).toBeGreaterThan(0);
      expect(result.totalWordBlanks).toBeGreaterThan(0);
      expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
    });

    it('should generate a story template with custom theme', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              title: 'Space Adventure',
              paragraphs: [{
                id: 'p1',
                text: 'The [ADJECTIVE] astronaut explored the [NOUN].',
                wordBlanks: [
                  { id: 'w1', type: 'adjective', position: 4, assignedPlayerId: null },
                  { id: 'w2', type: 'noun', position: 35, assignedPlayerId: null }
                ],
                imagePrompt: 'An astronaut in space'
              }],
              totalWordBlanks: 2,
              theme: 'space',
              difficulty: 'easy'
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

      // Should fall back to mock template
      const result = await storyGenerator.generateTemplate();
      
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('paragraphs');
    });
  });

  describe('fillTemplate', () => {
    it('should fill template with provided words', async () => {
      const template = {
        id: 'template1',
        title: 'Test Story',
        paragraphs: [{
          id: 'p1',
          text: 'The {adjective} {noun} went to the {place}.',
          wordBlanks: [
            { id: 'w1', type: WordType.ADJECTIVE, position: 4, assignedPlayerId: null },
            { id: 'w2', type: WordType.NOUN, position: 15, assignedPlayerId: null },
            { id: 'w3', type: WordType.PLACE, position: 27, assignedPlayerId: null }
          ],
          imagePrompt: 'A character going to a place'
        }],
        totalWordBlanks: 3,
        theme: 'adventure',
        difficulty: 'easy' as const
      };

      const words = [
        { id: 'ws1', wordBlankId: 'w1', playerId: 'p1', playerUsername: 'Alice', word: 'funny', wordType: WordType.ADJECTIVE, submittedAt: new Date() },
        { id: 'ws2', wordBlankId: 'w2', playerId: 'p2', playerUsername: 'Bob', word: 'cat', wordType: WordType.NOUN, submittedAt: new Date() },
        { id: 'ws3', wordBlankId: 'w3', playerId: 'p3', playerUsername: 'Charlie', word: 'park', wordType: WordType.PLACE, submittedAt: new Date() }
      ];

      const result = await storyGenerator.fillTemplate(template, words);

      expect(result).toHaveProperty('title', 'Test Story');
      expect(result).toHaveProperty('paragraphs');
      expect(result.paragraphs[0].text).toBe('The funny cat went to the park.');
      expect(result.playerContributions).toHaveLength(3);
    });

    it('should handle missing words gracefully', async () => {
      const template = {
        id: 'template1',
        title: 'Test Story',
        paragraphs: [{
          id: 'p1',
          text: 'The {adjective} {noun}.',
          wordBlanks: [
            { id: 'w1', type: WordType.ADJECTIVE, position: 4, assignedPlayerId: null },
            { id: 'w2', type: WordType.NOUN, position: 15, assignedPlayerId: null }
          ],
          imagePrompt: 'A character'
        }],
        totalWordBlanks: 2,
        theme: 'adventure',
        difficulty: 'easy' as const
      };

      const words = [
        { id: 'ws1', wordBlankId: 'w1', playerId: 'p1', playerUsername: 'Alice', word: 'funny', wordType: WordType.ADJECTIVE, submittedAt: new Date() }
      ];

      const result = await storyGenerator.fillTemplate(template, words);

      expect(result.paragraphs[0].text).toBe('The funny {noun}.');
    });
  });

  describe('validateTemplate', () => {
    it('should validate a correct template', () => {
      const validTemplate = {
        id: 'template1',
        title: 'Valid Story',
        paragraphs: [{
          id: 'p1',
          text: 'The {adjective} {noun}.',
          wordBlanks: [
            { id: 'w1', type: WordType.ADJECTIVE, position: 4, assignedPlayerId: null },
            { id: 'w2', type: WordType.NOUN, position: 15, assignedPlayerId: null }
          ],
          imagePrompt: 'A character'
        }],
        totalWordBlanks: 2,
        theme: 'adventure',
        difficulty: 'easy' as const
      };

      expect(storyGenerator.validateTemplate(validTemplate)).toBe(true);
    });

    it('should reject template with missing required fields', () => {
      const invalidTemplate = {
        id: 'template1',
        title: '',
        paragraphs: [],
        totalWordBlanks: 0,
        theme: 'adventure',
        difficulty: 'easy' as const
      };

      expect(storyGenerator.validateTemplate(invalidTemplate)).toBe(false);
    });

    it('should reject template with empty paragraphs', () => {
      const invalidTemplate = {
        id: 'template1',
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