import { StoryTemplate, WordSubmission, Story, CompletedParagraph, WordHighlight, PlayerContribution, WordType, Paragraph, WordBlank } from '@/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Mock story generator for development and testing
 * This simulates AWS Bedrock responses without requiring actual AWS credentials
 */
export class MockStoryGenerator {
  private mockTemplates = [
    {
      title: "The Great Adventure",
      theme: "adventure",
      paragraphs: [
        {
          text: "In a {adjective} kingdom far away, there lived a brave hero. The hero could run faster than any {noun} in the land. Every morning, they would {verb} in the castle courtyard. The other knights were always {adjective} when they watched the training sessions.",
          imagePrompt: "A magical kingdom with a heroic character training in a courtyard"
        },
        {
          text: "One sunny day, the hero decided to travel to the mysterious {place}. They packed their bag carefully for the {adjective} journey ahead. The path wound through dark forests and over {adjective} mountains. Along the way, they met a wise {person} who offered to help.",
          imagePrompt: "A journey scene through mysterious landscapes with a helpful companion"
        },
        {
          text: "At the destination, they discovered a golden treasure chest. Inside were {number} sparkling gems that glowed in the sunlight. The {person} danced with {adjective} excitement at the discovery. Everyone agreed it was the most amazing adventure they had ever experienced.",
          imagePrompt: "A dramatic treasure discovery scene with sparkling magical objects"
        },
        {
          text: "When they returned home, the whole kingdom {past_tense_verb} with joy. The hero shared their {color} treasures with everyone in the village. From that day forward, they were known as the most {adjective} adventurer in all the land. Their story would be told for {number} generations to come.",
          imagePrompt: "A celebration scene in the kingdom with the hero sharing treasures"
        }
      ]
    },
    {
      title: "The Silly School Day",
      theme: "school",
      paragraphs: [
        {
          text: "At Sunshine Elementary School, the {adjective} teacher walked into the classroom. She asked all the students to place their homework on their desks. Little Tommy realized he had forgotten his {noun} assignment at home. The teacher gave him a kind look but decided to be {adjective}.",
          imagePrompt: "A classroom scene with students and an understanding teacher"
        },
        {
          text: "During lunch, Sarah opened her lunchbox with {adjective} excitement. Inside were sandwiches that her mom had packed with care. The other kids gathered around to see the {color} lunch container. Everyone thought it was the most interesting meal they had ever {verb}.",
          imagePrompt: "Students gathered around an unusual and colorful lunch"
        },
        {
          text: "In art class, the teacher asked everyone to draw a picture. Tommy used crayons to make his drawing look {adjective}. When he finished, he walked proudly to show his {noun}. The whole class agreed it was absolutely wonderful and very {adjective}.",
          imagePrompt: "Students creating colorful family artwork in art class"
        },
        {
          text: "At the end of the day, all the students {past_tense_verb} their backpacks. They said goodbye to their friends and walked toward the {adjective} school buses. The teacher smiled as she watched them leave through the {color} doorway. It had been another wonderful day filled with {number} amazing moments.",
          imagePrompt: "Students happily leaving school at the end of a fun day"
        }
      ]
    },
    {
      title: "The Wacky Restaurant",
      theme: "food",
      paragraphs: [
        {
          text: "Welcome to Mario's Restaurant, the most {adjective} dining spot in town. The walls are painted bright colors and decorated with beautiful artwork. Every table has a centerpiece that makes guests {verb}. The atmosphere is always welcoming and {adjective} to all visitors.",
          imagePrompt: "A quirky restaurant interior with unusual decorations and colorful walls"
        },
        {
          text: "The talented chef can prepare many different {plural_noun} in just one hour. Their specialty is pasta served with a side of {adjective} sauce. Customers often smile with delight when they taste the {color} food. The secret ingredient is always something special and {adjective}.",
          imagePrompt: "A chef cooking with unusual tools and colorful ingredients"
        },
        {
          text: "Last week, a famous food critic visited the restaurant and {past_tense_verb} happily. They ordered the most popular item on the menu with {number} extra toppings. The meal was so delicious that they stayed for {adjective} hours. Now everyone in town wants to dine at this {noun} restaurant.",
          imagePrompt: "Happy customers enjoying their unusual and delicious meals"
        },
        {
          text: "The restaurant has become the {adjective} place to celebrate special occasions. Families come here to enjoy meals and {verb} together. The staff always greets everyone with warm smiles and {color} uniforms. It truly is the most wonderful {place} in the entire neighborhood.",
          imagePrompt: "Families celebrating together in the warm, welcoming restaurant"
        }
      ]
    }
  ]

  async generateTemplate(theme?: string, playerCount: number = 4): Promise<StoryTemplate> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Select a random template or one matching the theme
    let selectedTemplate = this.mockTemplates[Math.floor(Math.random() * this.mockTemplates.length)]
    
    if (theme) {
      const themeMatch = this.mockTemplates.find(t => t.theme.toLowerCase().includes(theme.toLowerCase()))
      if (themeMatch) {
        selectedTemplate = themeMatch
      }
    }

    // Convert to our format
    const paragraphs: Paragraph[] = selectedTemplate.paragraphs.map(p => {
      const wordBlanks: WordBlank[] = []
      let position = 0
      
      // Extract word blanks from text
      const regex = /\{(\w+)\}/g
      let match
      // Processing paragraph for word blanks
      
      // Reset regex lastIndex to ensure we start from the beginning
      regex.lastIndex = 0
      
      while ((match = regex.exec(p.text)) !== null) {
        const extractedType = match[1]
        const wordType = this.normalizeWordType(extractedType)
        
        if (wordType) {
          const wordBlank = {
            id: uuidv4(),
            type: wordType,
            position: position++,
            assignedPlayerId: null
          }
          wordBlanks.push(wordBlank)
          // Word blank created
        }
      }
      
      // Word blanks created for paragraph

      return {
        id: uuidv4(),
        text: p.text,
        wordBlanks,
        imagePrompt: p.imagePrompt
      }
    })

    return {
      id: uuidv4(),
      title: selectedTemplate.title,
      paragraphs,
      totalWordBlanks: paragraphs.reduce((sum, p) => sum + p.wordBlanks.length, 0),
      theme: selectedTemplate.theme,
      difficulty: 'medium'
    }
  }

  async fillTemplate(template: StoryTemplate, words: WordSubmission[]): Promise<Story> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    // MockStoryGenerator filling template

    // Create word mapping for easy lookup
    const wordMap = new Map<string, WordSubmission>()
    words.forEach(word => wordMap.set(word.wordBlankId, word))
    
    // Create global debug object
    const debugInfo = {
      totalSubmissions: words.length,
      wordSubmissions: words.map(w => ({ id: w.wordBlankId, word: w.word, type: w.wordType })),
      wordMapKeys: Array.from(wordMap.keys()),
      templateParagraphs: template.paragraphs.length,
      paragraphDetails: [],
      finalResults: []
    }
    
    // Processing word submissions

    // Fill in the template with submitted words (text only, images later)
    const completedParagraphs: CompletedParagraph[] = template.paragraphs.map((paragraph) => {
        let filledText = paragraph.text
        const replacements: Array<{ word: string; playerUsername: string; wordType: string }> = []

        // Sort word blanks by position to process them in order
        const sortedBlanks = [...paragraph.wordBlanks].sort((a, b) => a.position - b.position)
        const paragraphDebug: any = {
          originalText: paragraph.text,
          wordBlanks: sortedBlanks.map(b => ({ id: b.id, type: b.type, position: b.position })),
          availableSubmissions: Array.from(wordMap.keys()),
          submissionDetails: Array.from(wordMap.entries()).map(([id, sub]) => ({ id, word: sub.word, type: sub.wordType })),
          replacements: []
        }
        
        console.log('=== PROCESSING PARAGRAPH ===')
        console.log('Original text:', paragraph.text)
        console.log('Word blanks for this paragraph:', sortedBlanks.map(b => ({ id: b.id, type: b.type, position: b.position })))
        console.log('Available word submissions:', Array.from(wordMap.keys()))
        console.log('Word submissions details:', Array.from(wordMap.entries()).map(([id, sub]) => ({ id, word: sub.word, type: sub.wordType })))
        
        // Check if all word blanks have corresponding submissions
        const missingSubmissions = sortedBlanks.filter(blank => !wordMap.has(blank.id))
        if (missingSubmissions.length > 0) {
          console.error('❌ Missing word submissions for blanks:', missingSubmissions.map(b => ({ id: b.id, type: b.type, position: b.position })))
        } else {
          console.log('✅ All word blanks have corresponding submissions')
        }
        
        // Show all placeholders in the text for debugging
        const allPlaceholders = filledText.match(/\{(\w+)\}/g) || []
        console.log('🔍 All placeholders found in text:', allPlaceholders)
        
        // Process only word submissions that belong to this paragraph's word blanks
        const paragraphWordSubmissions = sortedBlanks
          .map(blank => wordMap.get(blank.id))
          .filter(submission => submission !== undefined)
        
        console.log(`🚨 MockStoryGenerator: Processing ${paragraphWordSubmissions.length} word submissions for this paragraph`)
        
        paragraphWordSubmissions.forEach((submission, index) => {
          // Convert WordType enum to lowercase placeholder format
          const placeholder = `{${this.wordTypeToPlaceholder(submission.wordType)}}`
          
          console.log(`🔄 Processing word ${index + 1}/${paragraphWordSubmissions.length}: "${submission.word}" for placeholder "${placeholder}"`)
          console.log(`📝 Text before: "${filledText}"`)
          
          // Find and replace the first occurrence of this placeholder
          const wordIndex = filledText.indexOf(placeholder)
          if (wordIndex !== -1) {
            // Replace the first occurrence
            filledText = filledText.replace(placeholder, submission.word)

            // Track this replacement for highlight creation
            replacements.push({
              word: submission.word,
              playerUsername: submission.playerUsername,
              wordType: submission.wordType
            })
            
            console.log(`✅ Replaced "${placeholder}" with "${submission.word}"`)
            console.log(`📄 Text after: "${filledText}"`)

          } else {
            console.error(`❌ Could not find placeholder "${placeholder}" in text: "${filledText}"`)
          }
        })

        // Third pass: create highlights by tracking exact positions during replacement
        const wordHighlights: WordHighlight[] = []
        
        // Re-process the text to track exact positions
        let trackingText = paragraph.text
        
        sortedBlanks.forEach(blank => {
          const submission = wordMap.get(blank.id)
          if (submission) {
            const placeholder = `{${this.wordTypeToPlaceholder(blank.type)}}`
            const placeholderIndex = trackingText.indexOf(placeholder)
            
            if (placeholderIndex !== -1) {
              // Record the highlight at this exact position
              wordHighlights.push({
                word: submission.word,
                playerUsername: submission.playerUsername,
                wordType: submission.wordType,
                startIndex: placeholderIndex,
                endIndex: placeholderIndex + submission.word.length
              })
              
              // Replace the placeholder with the word for the next iteration
              trackingText = trackingText.substring(0, placeholderIndex) + 
                           submission.word + 
                           trackingText.substring(placeholderIndex + placeholder.length)
            }
          }
        })
        
        // Sort highlights by position to ensure correct rendering
        wordHighlights.sort((a, b) => a.startIndex - b.startIndex)
        
        console.log('🎯 Created highlights:', wordHighlights.map(h => ({ word: h.word, start: h.startIndex, end: h.endIndex })))

        paragraphDebug.finalText = filledText
        paragraphDebug.highlightsCreated = wordHighlights.length
        debugInfo.paragraphDetails.push(paragraphDebug)
        
        console.log('=== FINAL RESULT ===')
        console.log('Final text:', filledText)
        console.log('Word highlights created:', wordHighlights.length)
        console.log('=== END PARAGRAPH ===')

        return {
          id: paragraph.id,
          text: filledText,
          imageUrl: null, // Images will be generated in background
          wordHighlights
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

    // Store debug info and story reference globally
    if (typeof window !== 'undefined') {
      (window as any).debugStory = story
      (window as any).debugInfo = debugInfo
      console.log('MockStoryGenerator: Debug info stored in window.debugInfo')
      console.log('MockStoryGenerator: Story stored in window.debugStory')
    }



    // Generate the first image before returning (for loading screen)
    await this.generateFirstImage(story, template)

    // Generate remaining images in background (don't await)
    this.generateRemainingImagesInBackground(story, template)

    return story
  }

  validateTemplate(template: StoryTemplate): boolean {
    try {
      // Check basic structure
      if (!template.id || !template.title || !template.paragraphs || template.paragraphs.length === 0) {
        return false
      }

      // Check each paragraph
      for (const paragraph of template.paragraphs) {
        if (!paragraph.id || !paragraph.text || !paragraph.wordBlanks) {
          return false
        }

        // Check word blanks
        for (const blank of paragraph.wordBlanks) {
          if (!blank.id || !blank.type || typeof blank.position !== 'number') {
            return false
          }
        }
      }

      return true
    } catch (error) {
      return false
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
      'person': WordType.PERSON,
      'animal': WordType.NOUN, // Map to noun
      'time_period': WordType.NOUN, // Map to noun
      'exclamation': WordType.NOUN, // Map to noun
    }

    return typeMap[normalized] || null
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
      default: return wordType.toLowerCase()
    }
  }

  private async generateFirstImage(story: Story, template: StoryTemplate): Promise<void> {
    try {
      console.log('Generating first image for story:', story.id)
      
      const { MockImageGenerator } = await import('./MockImageGenerator')
      const imageGenerator = new MockImageGenerator()
      
      const firstParagraph = story.paragraphs[0]
      const firstTemplateParagraph = template.paragraphs[0]
      
      console.log('Generating first image with prompt:', firstTemplateParagraph.imagePrompt)
      
      const imageResult = await imageGenerator.generateImage(
        firstTemplateParagraph.imagePrompt, 
        { style: 'cartoon', colorScheme: 'vibrant' }
      )
      
      // Update the first paragraph with the generated image
      firstParagraph.imageUrl = imageResult.url
      console.log('First image generated:', imageResult.url)
      
    } catch (error) {
      console.error('Failed to generate first image:', error)
      // Continue without first image
    }
  }

  private generateRemainingImagesInBackground(story: Story, template: StoryTemplate): void {
    setTimeout(async () => {
      try {
        const { MockImageGenerator } = await import('./MockImageGenerator')
        const imageGenerator = new MockImageGenerator()
        
        // Generate images for paragraphs 2-4 (skip first one)
        for (let i = 1; i < story.paragraphs.length; i++) {
          try {
            const paragraph = story.paragraphs[i]
            const templateParagraph = template.paragraphs[i]
            
            const imageResult = await imageGenerator.generateImage(
              templateParagraph.imagePrompt, 
              { style: 'cartoon', colorScheme: 'vibrant' }
            )
            
            // Update the paragraph with the generated image
            paragraph.imageUrl = imageResult.url
            
            // Add a small delay between images
            if (i < story.paragraphs.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
            
          } catch (error) {
            console.error(`Failed to generate background image for paragraph ${i + 1}:`, error)
            // Continue with other paragraphs
          }
        }
      } catch (error) {
        console.error('Background image generation failed:', error)
      }
    }, 1000) // Start after 1 second delay to ensure story is fully set up
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