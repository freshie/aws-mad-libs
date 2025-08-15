import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { StoryTemplate, WordSubmission, Story, CompletedParagraph, WordHighlight, PlayerContribution, WordType, Paragraph, WordBlank } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class StoryGenerator {
  private static instance: StoryGenerator | null = null
  private bedrockClient: BedrockRuntimeClient | null = null
  private useMock: boolean

  private constructor() {
    // In Lambda, always use IAM role (never use mock)
    this.useMock = false

    console.log('StoryGenerator constructor - using IAM role credentials')

    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      // No explicit credentials - use IAM role
    })
  }

  public static getInstance(): StoryGenerator {
    if (!StoryGenerator.instance) {
      StoryGenerator.instance = new StoryGenerator()
    }
    return StoryGenerator.instance
  }

  // For testing purposes only
  public static resetInstance(): void {
    StoryGenerator.instance = null
  }

  async generateTemplate(theme?: string, playerCount: number = 4): Promise<StoryTemplate> {
    if (this.useMock) {
      return this.generateMockTemplate(theme, playerCount)
    }

    try {
      const prompt = this.createTemplatePrompt(theme, playerCount)
      const response = await this.invokeBedrockModel(prompt)

      return this.parseTemplateResponse(response, theme, playerCount)
    } catch (error) {
      console.error('Error generating story template with Bedrock, falling back to mock:', error)
      // Fall back to mock generator
      return this.generateMockTemplate(theme, playerCount)
    }
  }

  async fillTemplate(template: StoryTemplate, words: WordSubmission[]): Promise<Story> {
    try {
      // Combine all paragraph texts into one string for processing
      let fullStoryText = template.paragraphs.map(p => p.text).join(' ')
      const wordHighlights: WordHighlight[] = []
      
      console.log('⚡ === LAMBDA STORY GENERATOR ===')
      console.log('⚡ Full story text:', fullStoryText)
      console.log('⚡ Processing', words.length, 'word submissions')

      // Go through each word submission and replace the first matching placeholder
      words.forEach((submission, index) => {
        const placeholder = `{${this.wordTypeToPlaceholder(submission.wordType)}}`
        
        console.log(`⚡ Word ${index + 1}/${words.length}: "${submission.word}" for placeholder "${placeholder}"`)
        
        const placeholderIndex = fullStoryText.indexOf(placeholder)
        if (placeholderIndex !== -1) {
          // Track highlight position before replacement
          wordHighlights.push({
            word: submission.word,
            playerUsername: submission.playerUsername,
            wordType: submission.wordType,
            startIndex: placeholderIndex,
            endIndex: placeholderIndex + submission.word.length
          })
          
          // Replace the first occurrence
          fullStoryText = fullStoryText.replace(placeholder, submission.word)
          console.log(`⚡ Replaced "${placeholder}" with "${submission.word}"`)
        } else {
          console.error(`⚡ Could not find placeholder "${placeholder}" in story`)
        }
      })

      // Split the filled story back into paragraphs
      const originalTexts = template.paragraphs.map(p => p.text)
      const filledTexts = this.splitFilledTextIntoParagraphs(fullStoryText, originalTexts)
      
      const completedParagraphs: CompletedParagraph[] = template.paragraphs.map((paragraph, index) => {
        return {
          id: paragraph.id,
          text: filledTexts[index] || paragraph.text,
          imageUrl: null, // Images will be generated separately
          wordHighlights: [] // We'll calculate these per paragraph if needed
        }
      })

      // Create player contributions summary
      const playerContributions = this.createPlayerContributions(words)

      const story: Story = {
        id: uuidv4(),
        title: template.title,
        theme: template.theme,
        paragraphs: completedParagraphs,
        playerContributions,
        createdAt: new Date()
      }

      return story
    } catch (error) {
      console.error('Error filling template:', error)
      throw error
    }
  }

  validateTemplate(template: StoryTemplate): boolean {
    if (!template || !template.paragraphs || template.paragraphs.length === 0) {
      return false
    }

    // Check if all paragraphs have word blanks
    return template.paragraphs.every(p => p.wordBlanks && p.wordBlanks.length > 0)
  }

  private async invokeBedrockModel(prompt: string): Promise<string> {
    if (!this.bedrockClient) {
      throw new Error('Bedrock client not initialized')
    }

    const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0'

    const payload = {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: prompt
            }
          ]
        }
      ],
      inferenceConfig: {
        max_new_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9
      }
    }

    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(payload),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await this.bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    // Nova Lite response format
    return responseBody.output.message.content[0].text
  }

  private createTemplatePrompt(theme?: string, playerCount: number = 4): string {
    const themeText = theme ? `with a ${theme} theme` : 'with any fun theme'

    return `Create a Mad Libs story template ${themeText} that will be fun when filled with random words. 

Requirements:
- Create a story with exactly 4 paragraphs
- Each paragraph must have exactly 4 sentences
- Include exactly 16 word blanks total (exactly 4 per paragraph, 1 per sentence)
- Use these word types: noun, verb, adjective, adverb, plural_noun, past_tense_verb, color, number, place, person
- Make the story family-friendly but funny
- Each sentence should have exactly ONE word blank
- Use placeholders like {noun}, {adjective}, etc.
- Structure: 4 paragraphs × 4 sentences × 1 word = 16 words total
- Include an image description for each paragraph

Format your response as JSON:
{
  "title": "Story Title",
  "theme": "${theme || 'adventure'}",
  "paragraphs": [
    {
      "text": "Story text with {word_type} placeholders",
      "imagePrompt": "Description for AI image generation"
    }
  ]
}

Make it creative and funny!`
  }

  private parseTemplateResponse(response: string, theme?: string, playerCount: number = 4): StoryTemplate {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = response.trim()

      // Remove ```json and ``` markers if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const parsed = JSON.parse(cleanResponse)

      const paragraphs: Paragraph[] = parsed.paragraphs.map((p: any, pIndex: number) => {
        const wordBlanks: WordBlank[] = []
        let position = 0

        // Extract word blanks from text
        const regex = /\{(\w+)\}/g
        let match
        while ((match = regex.exec(p.text)) !== null) {
          const wordType = this.normalizeWordType(match[1])
          if (wordType) {
            wordBlanks.push({
              id: uuidv4(),
              type: wordType,
              position: position++,
              assignedPlayerId: null
            })
          }
        }

        return {
          id: uuidv4(),
          text: p.text,
          wordBlanks,
          imagePrompt: p.imagePrompt || `Scene from paragraph ${pIndex + 1}`
        }
      })

      const totalWordBlanks = paragraphs.reduce((sum, p) => sum + p.wordBlanks.length, 0)

      // If AI generated wrong number of words, fall back to mock
      if (totalWordBlanks !== 16) {
        console.log(`AI generated ${totalWordBlanks} words (expected 16), falling back to mock template`)
        return this.generateMockTemplate(theme, playerCount)
      }

      return {
        id: uuidv4(),
        title: parsed.title || 'AI Generated Story',
        paragraphs,
        totalWordBlanks,
        theme: theme || parsed.theme || 'adventure',
        difficulty: 'medium'
      }
    } catch (error) {
      console.error('Error parsing template response:', error)
      throw new Error('Failed to parse AI response')
    }
  }

  private normalizeWordType(type: string): WordType | null {
    const normalized = type.toLowerCase().replace(/[_\s]/g, '_')

    const typeMap: Record<string, WordType> = {
      'noun': WordType.NOUN,
      'verb': WordType.VERB,
      'adjective': WordType.ADJECTIVE,
      'adverb': WordType.ADVERB,
      'plural_noun': WordType.PLURAL_NOUN,
      'past_tense_verb': WordType.PAST_TENSE_VERB,
      'color': WordType.COLOR,
      'number': WordType.NUMBER,
      'place': WordType.PLACE,
      'person': WordType.PERSON
    }

    return typeMap[normalized] || null
  }

  private generateMockTemplate(theme?: string, playerCount: number = 4): StoryTemplate {
    // Return a simple mock template
    const paragraphs: Paragraph[] = [
      {
        id: uuidv4(),
        text: "Once upon a time, there was a {adjective} {noun} who loved to {verb} {adverb}.",
        wordBlanks: [
          { id: uuidv4(), type: WordType.ADJECTIVE, position: 0, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.NOUN, position: 1, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.VERB, position: 2, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.ADVERB, position: 3, assignedPlayerId: null }
        ],
        imagePrompt: "A whimsical character in a fairy tale setting"
      },
      {
        id: uuidv4(),
        text: "Every day, they would visit the {color} {place} with {number} {plural_noun}.",
        wordBlanks: [
          { id: uuidv4(), type: WordType.COLOR, position: 0, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.PLACE, position: 1, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.NUMBER, position: 2, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.PLURAL_NOUN, position: 3, assignedPlayerId: null }
        ],
        imagePrompt: "A colorful location with various objects"
      },
      {
        id: uuidv4(),
        text: "One day, {person} {past_tense_verb} and everything changed forever!",
        wordBlanks: [
          { id: uuidv4(), type: WordType.PERSON, position: 0, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.PAST_TENSE_VERB, position: 1, assignedPlayerId: null }
        ],
        imagePrompt: "A dramatic moment with a person taking action"
      }
    ]

    const allWordBlanks = paragraphs.flatMap(p => p.wordBlanks)

    return {
      id: uuidv4(),
      title: "A Magical Adventure",
      paragraphs,
      totalWordBlanks: allWordBlanks.length,
      theme: theme || "adventure",
      difficulty: 'easy'
    }
  }

  private wordTypeToPlaceholder(wordType: WordType): string {
    switch (wordType) {
      case WordType.NOUN: return 'noun'
      case WordType.VERB: return 'verb'
      case WordType.ADJECTIVE: return 'adjective'
      case WordType.ADVERB: return 'adverb'
      case WordType.PLURAL_NOUN: return 'plural_noun'
      case WordType.PAST_TENSE_VERB: return 'past_tense_verb'
      case WordType.COLOR: return 'color'
      case WordType.NUMBER: return 'number'
      case WordType.PLACE: return 'place'
      case WordType.PERSON: return 'person'
      default: return String(wordType).toLowerCase()
    }
  }

  private splitFilledTextIntoParagraphs(filledText: string, originalTexts: string[]): string[] {
    // This is a simple approach - we'll try to match the structure
    // by finding where each original paragraph would start in the filled text
    const result: string[] = []
    let remainingText = filledText
    
    for (let i = 0; i < originalTexts.length; i++) {
      const originalText = originalTexts[i]
      
      // Count words in original paragraph (rough estimate)
      const originalWordCount = originalText.split(/\s+/).length
      
      // Take approximately the same number of words from filled text
      const words = remainingText.split(/\s+/)
      const paragraphWords = words.slice(0, originalWordCount)
      const paragraphText = paragraphWords.join(' ')
      
      result.push(paragraphText)
      
      // Remove used words from remaining text
      remainingText = words.slice(originalWordCount).join(' ')
    }
    
    return result
  }

  private createPlayerContributions(words: WordSubmission[]): PlayerContribution[] {
    const contributionMap = new Map<string, PlayerContribution>()

    words.forEach(word => {
      if (!contributionMap.has(word.playerId)) {
        contributionMap.set(word.playerId, {
          playerId: word.playerId,
          playerUsername: word.playerUsername,
          wordsContributed: []
        })
      }

      contributionMap.get(word.playerId)!.wordsContributed.push(word.word)
    })

    return Array.from(contributionMap.values())
  }
}