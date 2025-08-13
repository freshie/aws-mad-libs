import { StoryGenerator } from '@/services/StoryGenerator'
import { MockStoryGenerator } from '@/services/MockStoryGenerator'
import { WordType, WordSubmission, StoryTemplate } from '@/types'

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn(),
  InvokeModelCommand: jest.fn(),
}))

describe('StoryGenerator', () => {
  let storyGenerator: StoryGenerator
  let mockStoryGenerator: MockStoryGenerator

  beforeEach(() => {
    // Force use of mock in tests
    process.env.NODE_ENV = 'development'
    // Reset singleton for clean test state
    StoryGenerator.resetInstance()
    storyGenerator = StoryGenerator.getInstance()
    mockStoryGenerator = new MockStoryGenerator()
  })

  afterEach(() => {
    delete process.env.NODE_ENV
  })

  describe('generateTemplate', () => {
    it('should generate a valid story template', async () => {
      const template = await storyGenerator.generateTemplate('adventure', 4)

      expect(template).toBeDefined()
      expect(template.id).toBeDefined()
      expect(template.title).toBeDefined()
      expect(template.paragraphs).toHaveLength(3)
      expect(template.totalWordBlanks).toBeGreaterThan(0)
      expect(template.theme).toBeDefined()
    })

    it('should create templates with appropriate word blank count', async () => {
      const template = await storyGenerator.generateTemplate('school', 6)

      expect(template.totalWordBlanks).toBeGreaterThanOrEqual(8)
      expect(template.totalWordBlanks).toBeLessThanOrEqual(15)
    })

    it('should handle different themes', async () => {
      const adventureTemplate = await storyGenerator.generateTemplate('adventure', 4)
      const schoolTemplate = await storyGenerator.generateTemplate('school', 4)

      expect(adventureTemplate.theme).toBeDefined()
      expect(schoolTemplate.theme).toBeDefined()
      // Templates should be different (though this might occasionally fail due to randomness)
      expect(adventureTemplate.title).not.toBe(schoolTemplate.title)
    })

    it('should assign unique IDs to all elements', async () => {
      const template = await storyGenerator.generateTemplate('adventure', 4)

      const paragraphIds = template.paragraphs.map(p => p.id)
      const wordBlankIds = template.paragraphs.flatMap(p => p.wordBlanks.map(wb => wb.id))

      // Check paragraph IDs are unique
      expect(new Set(paragraphIds).size).toBe(paragraphIds.length)
      
      // Check word blank IDs are unique
      expect(new Set(wordBlankIds).size).toBe(wordBlankIds.length)
    })
  })

  describe('fillTemplate', () => {
    let template: StoryTemplate
    let wordSubmissions: WordSubmission[]

    beforeEach(async () => {
      template = await mockStoryGenerator.generateTemplate('adventure', 2)
      
      // Create word submissions for all blanks
      wordSubmissions = template.paragraphs.flatMap(p => 
        p.wordBlanks.map((blank, index) => ({
          id: `submission-${index}`,
          wordBlankId: blank.id,
          playerId: `player-${index % 2}`,
          playerUsername: `Player${index % 2 + 1}`,
          word: `testword${index}`,
          wordType: blank.type,
          submittedAt: new Date()
        }))
      )
    })

    it('should fill template with submitted words', async () => {
      const story = await storyGenerator.fillTemplate(template, wordSubmissions)

      expect(story).toBeDefined()
      expect(story.id).toBeDefined()
      expect(story.title).toBe(template.title)
      expect(story.paragraphs).toHaveLength(template.paragraphs.length)
      expect(story.playerContributions).toHaveLength(2) // 2 players
    })

    it('should create word highlights', async () => {
      const story = await storyGenerator.fillTemplate(template, wordSubmissions)

      story.paragraphs.forEach(paragraph => {
        expect(paragraph.wordHighlights).toBeDefined()
        // Should have highlights for words in this paragraph
        const expectedHighlights = template.paragraphs
          .find(p => p.id === paragraph.id)?.wordBlanks.length || 0
        expect(paragraph.wordHighlights).toHaveLength(expectedHighlights)
      })
    })

    it('should replace placeholders with actual words', async () => {
      const story = await storyGenerator.fillTemplate(template, wordSubmissions)

      story.paragraphs.forEach(paragraph => {
        // Should not contain any unreplaced placeholders
        expect(paragraph.text).not.toMatch(/\{[^}]+\}/)
        
        // Should contain submitted words
        wordSubmissions.forEach(submission => {
          if (paragraph.wordHighlights.some(h => h.word === submission.word)) {
            expect(paragraph.text).toContain(submission.word)
          }
        })
      })
    })

    it('should create player contributions summary', async () => {
      const story = await storyGenerator.fillTemplate(template, wordSubmissions)

      expect(story.playerContributions).toHaveLength(2)
      
      story.playerContributions.forEach(contribution => {
        expect(contribution.playerId).toBeDefined()
        expect(contribution.playerUsername).toBeDefined()
        expect(contribution.wordsContributed).toBeInstanceOf(Array)
        expect(contribution.wordsContributed.length).toBeGreaterThan(0)
      })
    })

    it('should handle missing word submissions gracefully', async () => {
      const incompleteSubmissions = wordSubmissions.slice(0, -1) // Remove last submission

      const story = await storyGenerator.fillTemplate(template, incompleteSubmissions)

      expect(story).toBeDefined()
      expect(story.paragraphs).toHaveLength(template.paragraphs.length)
      // Should still work, just with some placeholders potentially unfilled
    })
  })

  describe('validateTemplate', () => {
    it('should validate correct templates', async () => {
      const template = await mockStoryGenerator.generateTemplate('adventure', 4)
      
      expect(storyGenerator.validateTemplate(template)).toBe(true)
    })

    it('should reject templates with missing required fields', () => {
      const invalidTemplate = {
        id: '',
        title: 'Test',
        paragraphs: [],
        totalWordBlanks: 0,
        theme: 'test',
        difficulty: 'easy' as const
      }

      expect(storyGenerator.validateTemplate(invalidTemplate)).toBe(false)
    })

    it('should reject templates with invalid paragraphs', () => {
      const invalidTemplate = {
        id: 'test-id',
        title: 'Test',
        paragraphs: [
          {
            id: '',
            text: 'Test text',
            wordBlanks: [],
            imagePrompt: 'Test prompt'
          }
        ],
        totalWordBlanks: 0,
        theme: 'test',
        difficulty: 'easy' as const
      }

      expect(storyGenerator.validateTemplate(invalidTemplate)).toBe(false)
    })

    it('should reject templates with invalid word blanks', () => {
      const invalidTemplate = {
        id: 'test-id',
        title: 'Test',
        paragraphs: [
          {
            id: 'para-1',
            text: 'Test text',
            wordBlanks: [
              {
                id: '',
                type: WordType.NOUN,
                position: 0,
                assignedPlayerId: null
              }
            ],
            imagePrompt: 'Test prompt'
          }
        ],
        totalWordBlanks: 1,
        theme: 'test',
        difficulty: 'easy' as const
      }

      expect(storyGenerator.validateTemplate(invalidTemplate)).toBe(false)
    })
  })
})