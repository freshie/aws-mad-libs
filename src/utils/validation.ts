import { WordType, StoryTemplate, GameSession } from '@/types/game';

export function validatePlayerName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20 && /^[a-zA-Z0-9_-\sÀ-ÿ]+$/.test(trimmed);
}

export function validateWordType(type: WordType): boolean {
  const validTypes: WordType[] = [
    'noun', 'verb', 'adjective', 'adverb', 'plural_noun',
    'past_tense_verb', 'color', 'number', 'place', 'person'
  ];
  return validTypes.includes(type);
}

export function validateStoryTemplate(template: StoryTemplate): boolean {
  if (!template || !template.title || !template.paragraphs || template.paragraphs.length === 0) {
    return false;
  }
  
  let totalBlanks = 0;
  for (const paragraph of template.paragraphs) {
    if (!paragraph.wordBlanks) return false;
    totalBlanks += paragraph.wordBlanks.length;
    
    for (const blank of paragraph.wordBlanks) {
      if (!validateWordType(blank.type)) return false;
    }
  }
  
  return totalBlanks === template.totalWordBlanks;
}

export function validateGameSession(session: GameSession): boolean {
  if (!session || !session.roomCode || !session.players || session.players.length === 0) {
    return false;
  }
  
  const validStates = ['waiting_for_players', 'collecting_words', 'generating_story', 'displaying_story', 'creating_video', 'completed'];
  if (!validStates.includes(session.gameState)) {
    return false;
  }
  
  const hasHost = session.players.some(player => player.isHost);
  return hasHost;
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/<[^>]*>/g, '');
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && !email.includes('..');
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}