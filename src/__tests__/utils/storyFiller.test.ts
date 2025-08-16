import { fillStoryTemplate } from '../../utils/storyFiller';
import { StoryTemplate, WordSubmission, WordType, Story } from '../../types/game';

describe('fillStoryTemplate', () => {
  const mockTemplate: StoryTemplate = {
    id: 'test-template',
    title: 'Test Story',
    theme: 'adventure',
    totalWordBlanks: 2,
    paragraphs: [
      {
        id: 'para-1',
        text: 'The hero {past_tense_verb} across the field and found a {noun}.',
        wordBlanks: [
          {
            id: 'blank-1',
            type: WordType.PAST_TENSE_VERB,
            position: 0,
            assignedPlayerId: 'player-1'
          },
          {
            id: 'blank-2', 
            type: WordType.NOUN,
            position: 1,
            assignedPlayerId: 'player-2'
          }
        ],
        imagePrompt: 'A hero in a field'
      }
    ]
  };

  const mockWordSubmissions: WordSubmission[] = [
    {
      id: 'sub-1',
      wordBlankId: 'blank-1',
      playerId: 'player-1',
      playerUsername: 'Alice',
      word: 'ran',
      wordType: WordType.PAST_TENSE_VERB,
      submittedAt: new Date()
    },
    {
      id: 'sub-2',
      wordBlankId: 'blank-2', 
      playerId: 'player-2',
      playerUsername: 'Bob',
      word: 'treasure',
      wordType: WordType.NOUN,
      submittedAt: new Date()
    }
  ];

  beforeEach(() => {
    // Clear console logs for clean test output
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  describe('Successful Story Filling', () => {
    it('should fill all placeholders with submitted words', () => {
      const result: Story = fillStoryTemplate(mockTemplate, mockWordSubmissions);

      expect(result.title).toBe('Test Story');
      expect(result.paragraphs).toHaveLength(1);
      expect(result.paragraphs[0].text).toBe('The hero ran across the field and found a treasure.');
      expect(result.paragraphs[0].text).not.toContain('{');
      expect(result.paragraphs[0].text).not.toContain('}');
    });

    it('should create word highlights for filled words', () => {
      const result: Story = fillStoryTemplate(mockTemplate, mockWordSubmissions);

      expect(result.paragraphs[0].wordHighlights).toHaveLength(2);
      
      const highlights = result.paragraphs[0].wordHighlights;
      expect(highlights[0].word).toBe('ran');
      expect(highlights[0].playerUsername).toBe('Alice');
      expect(highlights[0].wordType).toBe(WordType.PAST_TENSE_VERB);
      
      expect(highlights[1].word).toBe('treasure');
      expect(highlights[1].playerUsername).toBe('Bob');
      expect(highlights[1].wordType).toBe(WordType.NOUN);
    });

    it('should create player contributions summary', () => {
      const result: Story = fillStoryTemplate(mockTemplate, mockWordSubmissions);

      expect(result.playerContributions).toHaveLength(2);
      
      const aliceContribution = result.playerContributions.find(p => p.playerUsername === 'Alice');
      const bobContribution = result.playerContributions.find(p => p.playerUsername === 'Bob');
      
      expect(aliceContribution?.wordsContributed).toEqual(['ran']);
      
      expect(bobContribution?.wordsContributed).toEqual(['treasure']);
    });
  });

  describe('Error Cases', () => {
    it('should leave placeholders unfilled when no matching submission exists', () => {
      const incompleteSubmissions = [mockWordSubmissions[0]]; // Only first submission
      
      const result: Story = fillStoryTemplate(mockTemplate, incompleteSubmissions);

      expect(result.paragraphs[0].text).toBe('The hero ran across the field and found a {noun}.');
      expect(result.paragraphs[0].text).toContain('{noun}'); // Should still have unfilled placeholder
    });

    it('should handle empty word submissions array', () => {
      const result: Story = fillStoryTemplate(mockTemplate, []);

      expect(result.paragraphs[0].text).toBe('The hero {past_tense_verb} across the field and found a {noun}.');
      expect(result.paragraphs[0].text).toContain('{past_tense_verb}');
      expect(result.paragraphs[0].text).toContain('{noun}');
    });

    it('should handle mismatched word blank IDs gracefully', () => {
      const mismatchedSubmissions: WordSubmission[] = [
        {
          ...mockWordSubmissions[0],
          wordBlankId: 'non-existent-blank-id'
        }
      ];
      
      const result: Story = fillStoryTemplate(mockTemplate, mismatchedSubmissions);

      // Should leave both placeholders unfilled since ID doesn't match
      expect(result.paragraphs[0].text).toContain('{past_tense_verb}');
      expect(result.paragraphs[0].text).toContain('{noun}');
    });
  });

  describe('Real-world Scenario', () => {
    it('should handle the school day story that was failing', () => {
      const schoolTemplate: StoryTemplate = {
        id: 'school-template',
        title: 'A Crazy School Day',
        theme: 'school',
        totalWordBlanks: 1,
        paragraphs: [
          {
            id: 'para-lunch',
            text: 'During lunch, something calm happened in the cafeteria. Everyone {past_tense_verb} when they saw what was on their trays.',
            wordBlanks: [
              {
                id: 'lunch-verb',
                type: WordType.PAST_TENSE_VERB,
                position: 0,
                assignedPlayerId: 'player-1'
              }
            ],
            imagePrompt: 'School cafeteria scene'
          }
        ]
      };

      const schoolSubmissions: WordSubmission[] = [
        {
          id: 'school-sub-1',
          wordBlankId: 'lunch-verb',
          playerId: 'player-1',
          playerUsername: 'TestPlayer',
          word: 'gasped',
          wordType: WordType.PAST_TENSE_VERB,
          submittedAt: new Date()
        }
      ];

      const result: Story = fillStoryTemplate(schoolTemplate, schoolSubmissions);

      expect(result.paragraphs[0].text).toBe('During lunch, something calm happened in the cafeteria. Everyone gasped when they saw what was on their trays.');
      expect(result.paragraphs[0].text).not.toContain('{past_tense_verb}');
      expect(result.paragraphs[0].text).not.toContain('{');
      expect(result.paragraphs[0].text).not.toContain('}');
    });
  });
});