import { StoryTemplate, WordSubmission, Story, WordHighlight, WordType, PlayerContribution } from '../types/game'

/**
 * Fill a story template with word submissions on the frontend
 * This replaces the need for a backend API call
 */
export function fillStoryTemplate(template: StoryTemplate, wordSubmissions: WordSubmission[]): Story {
  const wordHighlights: WordHighlight[] = []
  
  // Process each paragraph
  const filledParagraphs = template.paragraphs.map(paragraph => {
    let filledText = paragraph.text
    let currentOffset = 0 // Track position changes due to replacements
    
    // Sort word blanks by position to process them in order
    const sortedBlanks = [...paragraph.wordBlanks].sort((a, b) => a.position - b.position)
    
    sortedBlanks.forEach(wordBlank => {
      // Find the corresponding word submission
      const submission = wordSubmissions.find(ws => ws.wordBlankId === wordBlank.id)
      const placeholder = `{${wordTypeToPlaceholder(wordBlank.type)}}`
      
      if (submission) {
        const placeholderIndex = filledText.indexOf(placeholder)
        
        if (placeholderIndex !== -1) {
          // Calculate the actual position in the final text
          const actualStartIndex = placeholderIndex
          const actualEndIndex = actualStartIndex + submission.word.length
          
          // Track highlight for this word
          wordHighlights.push({
            word: submission.word,
            playerUsername: submission.playerUsername,
            wordType: submission.wordType,
            startIndex: actualStartIndex,
            endIndex: actualEndIndex
          })
          
          // Replace the placeholder with the submitted word
          filledText = filledText.replace(placeholder, submission.word)
        }
      }
    })
    
    return {
      id: paragraph.id,
      text: filledText,
      imageUrl: null, // Will be filled by image generation
      wordHighlights: wordHighlights.filter(wh => 
        // Only include highlights that belong to this paragraph
        paragraph.wordBlanks.some(wb => 
          wordSubmissions.find(ws => ws.wordBlankId === wb.id)?.word === wh.word
        )
      )
    }
  })
  
  return {
    id: template.id,
    title: template.title,
    theme: template.theme,
    paragraphs: filledParagraphs,
    playerContributions: Object.values(
      wordSubmissions.reduce((acc, ws) => {
        if (!acc[ws.playerId]) {
          acc[ws.playerId] = {
            playerId: ws.playerId,
            playerUsername: ws.playerUsername,
            wordsContributed: []
          }
        }
        acc[ws.playerId].wordsContributed.push(ws.word)
        return acc
      }, {} as Record<string, PlayerContribution>)
    ),
    createdAt: new Date()
  }
}

/**
 * Convert WordType enum to placeholder string
 */
function wordTypeToPlaceholder(wordType: WordType): string {
  switch (wordType) {
    case WordType.NOUN: return 'noun'
    case WordType.VERB: return 'verb'
    case WordType.ADJECTIVE: return 'adjective'
    case WordType.ADVERB: return 'adverb'
    case WordType.PLURAL_NOUN: return 'plural_noun'
    case WordType.PAST_TENSE_VERB: return 'past_tense_verb'
    case WordType.COLOR: return 'color'
    case WordType.PLACE: return 'place'
    case WordType.PERSON: return 'person'
    case WordType.NUMBER: return 'number'
    default: return 'noun'
  }
}