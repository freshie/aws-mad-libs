import { fillStoryTemplate } from '../../utils/storyFiller';
import { StoryTemplate, WordSubmission, WordType } from '../../types/game';

describe('LocalGameContext Story Flow', () => {
  const mockTemplate: StoryTemplate = {
    id: 'test-template',
    title: 'A Crazy School Day',
    theme: 'school',
    totalWordBlanks: 1,
    paragraphs: [
      {
        id: 'para-1',
        text: 'During lunch, something calm happened in the cafeteria. Everyone {past_tense_verb} when they saw what was on their trays.',
        wordBlanks: [
          {
            id: 'blank-1',
            type: WordType.PAST_TENSE_VERB,
            position: 0,
            assignedPlayerId: 'player-1'
          }
        ],
        imagePrompt: 'School cafeteria scene'
      }
    ]
  };

  const mockSubmissions: WordSubmission[] = [
    {
      id: 'sub-1',
      wordBlankId: 'blank-1',
      playerId: 'player-1',
      playerUsername: 'TestPlayer',
      word: 'gasped',
      wordType: WordType.PAST_TENSE_VERB,
      submittedAt: new Date()
    }
  ];

  it('should create a completed story without placeholders', () => {
    const completedStory = fillStoryTemplate(mockTemplate, mockSubmissions);

    expect(completedStory.title).toBe('A Crazy School Day');
    expect(completedStory.paragraphs[0].text).toBe('During lunch, something calm happened in the cafeteria. Everyone gasped when they saw what was on their trays.');
    expect(completedStory.paragraphs[0].text).not.toContain('{past_tense_verb}');
    expect(completedStory.paragraphs[0].text).not.toContain('{');
    expect(completedStory.paragraphs[0].text).not.toContain('}');
  });

  it('should create video input data without placeholders', () => {
    const completedStory = fillStoryTemplate(mockTemplate, mockSubmissions);

    // Simulate the video input creation from LocalGameContext
    const storyVideoInput = {
      images: completedStory.paragraphs.map((paragraph, index) => ({
        url: paragraph.imageUrl || '',
        text: paragraph.text,
        duration: 5
      })),
      title: completedStory.title,
      overallNarrative: completedStory.paragraphs.map(p => p.text).join(' ')
    };

    expect(storyVideoInput.title).toBe('A Crazy School Day');
    expect(storyVideoInput.overallNarrative).toBe('During lunch, something calm happened in the cafeteria. Everyone gasped when they saw what was on their trays.');
    expect(storyVideoInput.overallNarrative).not.toContain('{past_tense_verb}');
    expect(storyVideoInput.images[0].text).not.toContain('{past_tense_verb}');
    
    // Verify no placeholders exist anywhere
    const allText = storyVideoInput.overallNarrative + ' ' + storyVideoInput.images.map(i => i.text).join(' ');
    expect(allText).not.toMatch(/\{[^}]+\}/);
  });

  it('should detect when story filling failed', () => {
    // Test with missing submissions
    const incompleteSubmissions: WordSubmission[] = [];
    const completedStory = fillStoryTemplate(mockTemplate, incompleteSubmissions);

    const storyVideoInput = {
      images: completedStory.paragraphs.map((paragraph, index) => ({
        url: paragraph.imageUrl || '',
        text: paragraph.text,
        duration: 5
      })),
      title: completedStory.title,
      overallNarrative: completedStory.paragraphs.map(p => p.text).join(' ')
    };

    // Should still contain placeholders
    expect(storyVideoInput.overallNarrative).toContain('{past_tense_verb}');
    expect(storyVideoInput.images[0].text).toContain('{past_tense_verb}');
    
    // Should match placeholder pattern
    const allText = storyVideoInput.overallNarrative + ' ' + storyVideoInput.images.map(i => i.text).join(' ');
    expect(allText).toMatch(/\{[^}]+\}/);
  });
});