import {
  validatePlayerName,
  validateWordType,
  validateStoryTemplate,
  validateGameSession,
  sanitizeInput
} from '@/utils/validation';
import { WordType } from '@/types/game';

describe('validation utilities', () => {
  describe('validatePlayerName', () => {
    it('should accept valid player names', () => {
      const validNames = ['Alice', 'Bob123', 'Player_1', 'John-Doe', 'María'];
      
      validNames.forEach(name => {
        expect(validatePlayerName(name)).toBe(true);
      });
    });

    it('should reject invalid player names', () => {
      const invalidNames = ['', '   ', 'a', 'ThisNameIsTooLongForAPlayer', '!@#$%', '<script>'];
      
      invalidNames.forEach(name => {
        expect(validatePlayerName(name)).toBe(false);
      });
    });

    it('should reject names with only whitespace', () => {
      expect(validatePlayerName('   ')).toBe(false);
      expect(validatePlayerName('\t\n')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(validatePlayerName(null as any)).toBe(false);
      expect(validatePlayerName(undefined as any)).toBe(false);
    });
  });

  describe('validateWordType', () => {
    it('should accept valid word types', () => {
      const validTypes: WordType[] = [
        'noun', 'verb', 'adjective', 'adverb', 'plural_noun',
        'past_tense_verb', 'color', 'number', 'place', 'person'
      ];
      
      validTypes.forEach(type => {
        expect(validateWordType(type)).toBe(true);
      });
    });

    it('should reject invalid word types', () => {
      const invalidTypes = ['invalid', 'NOUN', 'Adjective', '', null, undefined];
      
      invalidTypes.forEach(type => {
        expect(validateWordType(type as any)).toBe(false);
      });
    });
  });

  describe('validateStoryTemplate', () => {
    const validTemplate = {
      id: 'test-template',
      title: 'Test Story',
      paragraphs: [
        {
          id: 'p1',
          text: 'The [ADJECTIVE] [NOUN] went to the [PLACE].',
          wordBlanks: [
            { id: 'w1', type: 'adjective' as WordType, position: 0, assignedPlayerId: null },
            { id: 'w2', type: 'noun' as WordType, position: 1, assignedPlayerId: null },
            { id: 'w3', type: 'place' as WordType, position: 2, assignedPlayerId: null }
          ],
          imagePrompt: 'A story scene'
        }
      ],
      totalWordBlanks: 3,
      theme: 'adventure',
      difficulty: 'easy' as const
    };

    it('should accept valid story template', () => {
      expect(validateStoryTemplate(validTemplate)).toBe(true);
    });

    it('should reject template with missing required fields', () => {
      const invalidTemplate = { ...validTemplate };
      delete (invalidTemplate as any).title;
      
      expect(validateStoryTemplate(invalidTemplate)).toBe(false);
    });

    it('should reject template with empty paragraphs', () => {
      const invalidTemplate = { ...validTemplate, paragraphs: [] };
      
      expect(validateStoryTemplate(invalidTemplate)).toBe(false);
    });

    it('should reject template with invalid word blanks', () => {
      const invalidTemplate = {
        ...validTemplate,
        paragraphs: [
          {
            ...validTemplate.paragraphs[0],
            wordBlanks: [
              { id: 'w1', type: 'invalid' as WordType, position: 0, assignedPlayerId: null }
            ]
          }
        ]
      };
      
      expect(validateStoryTemplate(invalidTemplate)).toBe(false);
    });

    it('should reject template with mismatched word blank count', () => {
      const invalidTemplate = { ...validTemplate, totalWordBlanks: 5 };
      
      expect(validateStoryTemplate(invalidTemplate)).toBe(false);
    });
  });

  describe('validateGameSession', () => {
    const validSession = {
      id: 'game-123',
      roomCode: 'ABC123',
      hostId: 'player-1',
      players: [
        { id: 'player-1', username: 'Alice', isHost: true, isConnected: true, wordsContributed: 0, joinedAt: new Date() }
      ],
      gameState: 'waiting_for_players' as const,
      storyTemplate: null,
      wordSubmissions: [],
      completedStory: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid game session', () => {
      expect(validateGameSession(validSession)).toBe(true);
    });

    it('should reject session with invalid room code', () => {
      const invalidSession = { ...validSession, roomCode: '' };
      
      expect(validateGameSession(invalidSession)).toBe(false);
    });

    it('should reject session with no players', () => {
      const invalidSession = { ...validSession, players: [] };
      
      expect(validateGameSession(invalidSession)).toBe(false);
    });

    it('should reject session with invalid game state', () => {
      const invalidSession = { ...validSession, gameState: 'invalid_state' as any };
      
      expect(validateGameSession(invalidSession)).toBe(false);
    });

    it('should reject session with no host', () => {
      const invalidSession = {
        ...validSession,
        players: [
          { id: 'player-1', username: 'Alice', isHost: false, isConnected: true, wordsContributed: 0, joinedAt: new Date() }
        ]
      };
      
      expect(validateGameSession(invalidSession)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(sanitizeInput('<b>Bold</b> text')).toBe('Bold text');
      expect(sanitizeInput('<div>Content</div>')).toBe('Content');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  Hello World  ')).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should preserve valid characters', () => {
      expect(sanitizeInput('Hello World 123!')).toBe('Hello World 123!');
    });
  });

  // Note: Email and URL validation tests will be added in Phase 3 
  // when implementing user authentication and external integrations
});