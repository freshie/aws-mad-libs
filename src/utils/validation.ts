import { WordType, StoryTemplate, GameSession } from '@/types/game';

/**
 * Validates a player name
 */
export function validatePlayerName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 20) return false;
  
  // Allow letters, numbers, spaces, hyphens, underscores
  const validPattern = /^[a-zA-Z0-9\s\-_À-ÿ]+$/;
  return validPattern.test(trimmed);
}

/**
 * Validates a word type
 */
export function validateWordType(type: string): boolean {
  const validTypes: WordType[] = [
    'noun', 'verb', 'adjective', 'adverb', 'plural_noun',
    'past_tense_verb', 'color', 'number', 'place', 'person'
  ];
  
  return validTypes.includes(type as WordType);
}

/**
 * Validates a story template
 */
export function validateStoryTemplate(template: any): boolean {
  if (!template || typeof template !== 'object') return false;
  
  // Check required fields
  if (!template.id || !template.title || !template.paragraphs || !Array.isArray(template.paragraphs)) {
    return false;
  }
  
  // Must have at least one paragraph
  if (template.paragraphs.length === 0) return false;
  
  // Validate paragraphs and word blanks
  let totalWordBlanks = 0;
  for (const paragraph of template.paragraphs) {
    if (!paragraph.id || !paragraph.text || !paragraph.wordBlanks || !Array.isArray(paragraph.wordBlanks)) {
      return false;
    }
    
    // Validate word blanks
    for (const wordBlank of paragraph.wordBlanks) {
      if (!wordBlank.id || !validateWordType(wordBlank.type) || typeof wordBlank.position !== 'number') {
        return false;
      }
    }
    
    totalWordBlanks += paragraph.wordBlanks.length;
  }
  
  // Check if totalWordBlanks matches
  if (template.totalWordBlanks !== totalWordBlanks) return false;
  
  return true;
}

/**
 * Validates a game session
 */
export function validateGameSession(session: any): boolean {
  if (!session || typeof session !== 'object') return false;
  
  // Check required fields
  if (!session.id || !session.roomCode || !session.hostId || !session.players || !Array.isArray(session.players)) {
    return false;
  }
  
  // Must have at least one player
  if (session.players.length === 0) return false;
  
  // Must have a host
  const hasHost = session.players.some((player: any) => player.isHost === true);
  if (!hasHost) return false;
  
  // Validate game state
  const validStates = ['waiting_for_players', 'collecting_words', 'generating_story', 'displaying_story', 'creating_video', 'completed'];
  if (!validStates.includes(session.gameState)) return false;
  
  return true;
}

/**
 * Sanitizes user input by removing HTML tags and trimming whitespace
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags but preserve the text content
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  return withoutTags.trim();
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}