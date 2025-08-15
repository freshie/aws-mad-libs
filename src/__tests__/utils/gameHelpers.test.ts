import {
  generateRoomCode,
  generatePlayerId,
  calculateGameProgress,
  getNextWordPrompt,
  highlightPlayerWords,
  formatPlayerContributions,
  shuffleArray,
  getRandomTheme,
  isGameComplete
} from '@/utils/gameHelpers';
import { GameState, WordType } from '@/types/game';

describe('gameHelpers utilities', () => {
  describe('generateRoomCode', () => {
    it('should generate a 6-character room code', () => {
      const roomCode = generateRoomCode();
      expect(roomCode).toHaveLength(6);
      expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should generate unique room codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      expect(codes.size).toBeGreaterThan(90); // Should be mostly unique
    });
  });

  describe('generatePlayerId', () => {
    it('should generate a valid player ID', () => {
      const playerId = generatePlayerId();
      expect(playerId).toMatch(/^player-[a-f0-9-]{36}$/);
    });

    it('should generate unique player IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generatePlayerId());
      }
      expect(ids.size).toBe(100); // Should all be unique
    });
  });

  describe('calculateGameProgress', () => {
    const mockTemplate = {
      id: 'test',
      title: 'Test',
      paragraphs: [
        {
          id: 'p1',
          text: 'Test [NOUN] [VERB]',
          wordBlanks: [
            { id: 'w1', type: 'noun' as WordType, position: 0, assignedPlayerId: null },
            { id: 'w2', type: 'verb' as WordType, position: 1, assignedPlayerId: null }
          ],
          imagePrompt: 'test'
        }
      ],
      totalWordBlanks: 2,
      theme: 'test',
      difficulty: 'easy' as const
    };

    it('should calculate progress correctly', () => {
      const submissions = [
        { id: 'w1', wordBlankId: 'w1', playerId: 'p1', playerUsername: 'Alice', word: 'cat', wordType: 'noun' as WordType, submittedAt: new Date() }
      ];

      const progress = calculateGameProgress(mockTemplate, submissions);
      expect(progress.completed).toBe(1);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(50);
    });

    it('should handle empty submissions', () => {
      const progress = calculateGameProgress(mockTemplate, []);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(0);
    });

    it('should handle complete submissions', () => {
      const submissions = [
        { id: 'w1', wordBlankId: 'w1', playerId: 'p1', playerUsername: 'Alice', word: 'cat', wordType: 'noun' as WordType, submittedAt: new Date() },
        { id: 'w2', wordBlankId: 'w2', playerId: 'p2', playerUsername: 'Bob', word: 'run', wordType: 'verb' as WordType, submittedAt: new Date() }
      ];

      const progress = calculateGameProgress(mockTemplate, submissions);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('getNextWordPrompt', () => {
    const mockTemplate = {
      id: 'test',
      title: 'Test',
      paragraphs: [
        {
          id: 'p1',
          text: 'The [ADJECTIVE] [NOUN] [VERB]',
          wordBlanks: [
            { id: 'w1', type: 'adjective' as WordType, position: 0, assignedPlayerId: null },
            { id: 'w2', type: 'noun' as WordType, position: 1, assignedPlayerId: null },
            { id: 'w3', type: 'verb' as WordType, position: 2, assignedPlayerId: null }
          ],
          imagePrompt: 'test'
        }
      ],
      totalWordBlanks: 3,
      theme: 'test',
      difficulty: 'easy' as const
    };

    it('should return the first unfilled word prompt', () => {
      const submissions = [
        { id: 'w1', wordBlankId: 'w1', playerId: 'p1', playerUsername: 'Alice', word: 'funny', wordType: 'adjective' as WordType, submittedAt: new Date() }
      ];

      const nextPrompt = getNextWordPrompt(mockTemplate, submissions);
      expect(nextPrompt).toEqual({
        wordBlank: mockTemplate.paragraphs[0].wordBlanks[1],
        promptText: 'Enter a noun:',
        exampleWords: expect.any(Array)
      });
    });

    it('should return null when all words are filled', () => {
      const submissions = [
        { id: 'w1', wordBlankId: 'w1', playerId: 'p1', playerUsername: 'Alice', word: 'funny', wordType: 'adjective' as WordType, submittedAt: new Date() },
        { id: 'w2', wordBlankId: 'w2', playerId: 'p2', playerUsername: 'Bob', word: 'cat', wordType: 'noun' as WordType, submittedAt: new Date() },
        { id: 'w3', wordBlankId: 'w3', playerId: 'p3', playerUsername: 'Charlie', word: 'runs', wordType: 'verb' as WordType, submittedAt: new Date() }
      ];

      const nextPrompt = getNextWordPrompt(mockTemplate, submissions);
      expect(nextPrompt).toBeNull();
    });

    it('should return the first prompt when no submissions', () => {
      const nextPrompt = getNextWordPrompt(mockTemplate, []);
      expect(nextPrompt).toEqual({
        wordBlank: mockTemplate.paragraphs[0].wordBlanks[0],
        promptText: 'Enter an adjective:',
        exampleWords: expect.any(Array)
      });
    });
  });

  describe('highlightPlayerWords', () => {
    it('should highlight player contributions in story text', () => {
      const storyText = 'The funny cat runs quickly.';
      const contributions = [
        { word: 'funny', playerUsername: 'Alice', startIndex: 4, endIndex: 9 },
        { word: 'cat', playerUsername: 'Bob', startIndex: 10, endIndex: 13 },
        { word: 'runs', playerUsername: 'Charlie', startIndex: 14, endIndex: 18 },
        { word: 'quickly', playerUsername: 'Alice', startIndex: 19, endIndex: 26 }
      ];

      const highlighted = highlightPlayerWords(storyText, contributions);
      expect(highlighted).toContain('Alice');
      expect(highlighted).toContain('Bob');
      expect(highlighted).toContain('Charlie');
      expect(highlighted).toContain('funny');
      expect(highlighted).toContain('cat');
    });

    it('should handle empty contributions', () => {
      const storyText = 'The cat runs.';
      const highlighted = highlightPlayerWords(storyText, []);
      expect(highlighted).toBe(storyText);
    });

    it('should handle overlapping highlights', () => {
      const storyText = 'The funny cat';
      const contributions = [
        { word: 'funny cat', playerUsername: 'Alice', startIndex: 4, endIndex: 13 },
        { word: 'cat', playerUsername: 'Bob', startIndex: 10, endIndex: 13 }
      ];

      const highlighted = highlightPlayerWords(storyText, contributions);
      expect(highlighted).toContain('Alice');
      // Should handle overlapping gracefully
    });
  });

  describe('formatPlayerContributions', () => {
    it('should format player contributions correctly', () => {
      const contributions = [
        { playerName: 'Alice', wordsContributed: ['funny', 'quickly'] },
        { playerName: 'Bob', wordsContributed: ['cat'] },
        { playerName: 'Charlie', wordsContributed: ['runs', 'park', 'happy'] }
      ];

      const formatted = formatPlayerContributions(contributions);
      expect(formatted).toContain('Alice: funny, quickly');
      expect(formatted).toContain('Bob: cat');
      expect(formatted).toContain('Charlie: runs, park, happy');
    });

    it('should handle empty contributions', () => {
      const formatted = formatPlayerContributions([]);
      expect(formatted).toBe('');
    });

    it('should handle players with no words', () => {
      const contributions = [
        { playerName: 'Alice', wordsContributed: [] }
      ];

      const formatted = formatPlayerContributions(contributions);
      expect(formatted).toContain('Alice: (no words)');
    });
  });

  describe('shuffleArray', () => {
    it('should shuffle array elements', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = shuffleArray([...original]);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled).toEqual(expect.arrayContaining(original));
      
      // Very unlikely to be in the same order
      let sameOrder = true;
      for (let i = 0; i < original.length; i++) {
        if (original[i] !== shuffled[i]) {
          sameOrder = false;
          break;
        }
      }
      expect(sameOrder).toBe(false);
    });

    it('should handle empty arrays', () => {
      const shuffled = shuffleArray([]);
      expect(shuffled).toEqual([]);
    });

    it('should handle single element arrays', () => {
      const shuffled = shuffleArray([1]);
      expect(shuffled).toEqual([1]);
    });
  });

  describe('getRandomTheme', () => {
    it('should return a valid theme', () => {
      const theme = getRandomTheme();
      const validThemes = [
        'Adventure', 'Mystery', 'Comedy', 'Romance', 'Sci-Fi', 'Fantasy',
        'Horror', 'Western', 'Superhero', 'Pirate', 'Space', 'Medieval'
      ];
      expect(validThemes).toContain(theme);
    });

    it('should return different themes on multiple calls', () => {
      const themes = new Set();
      for (let i = 0; i < 50; i++) {
        themes.add(getRandomTheme());
      }
      expect(themes.size).toBeGreaterThan(1);
    });
  });

  describe('isGameComplete', () => {
    it('should return true for completed game state', () => {
      expect(isGameComplete('completed' as GameState)).toBe(true);
    });

    it('should return false for non-completed game states', () => {
      const incompleteStates: GameState[] = [
        'waiting_for_players',
        'collecting_words',
        'generating_story',
        'displaying_story',
        'creating_video'
      ];

      incompleteStates.forEach(state => {
        expect(isGameComplete(state)).toBe(false);
      });
    });
  });
});