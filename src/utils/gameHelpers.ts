import { v4 as uuidv4 } from 'uuid';
import { GameState, StoryTemplate, WordSubmission, WordType } from '@/types/game';

/**
 * Generates a random 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a unique player ID
 */
export function generatePlayerId(): string {
  return `player-${uuidv4()}`;
}

/**
 * Calculates game progress based on word submissions
 */
export function calculateGameProgress(template: StoryTemplate, submissions: WordSubmission[]) {
  const total = template.totalWordBlanks;
  const completed = submissions.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

/**
 * Gets the next word prompt that needs to be filled
 */
export function getNextWordPrompt(template: StoryTemplate, submissions: WordSubmission[]) {
  const submittedWordBlankIds = new Set(submissions.map(s => s.wordBlankId));
  
  for (const paragraph of template.paragraphs) {
    for (const wordBlank of paragraph.wordBlanks) {
      if (!submittedWordBlankIds.has(wordBlank.id)) {
        return {
          wordBlank,
          promptText: `Enter ${getArticle(wordBlank.type)} ${wordBlank.type.replace('_', ' ')}:`,
          exampleWords: getExampleWords(wordBlank.type)
        };
      }
    }
  }
  
  return null;
}

/**
 * Gets the appropriate article for a word type
 */
function getArticle(wordType: WordType): string {
  const vowelTypes = ['adjective', 'adverb'];
  return vowelTypes.includes(wordType) ? 'an' : 'a';
}

/**
 * Gets example words for a word type
 */
function getExampleWords(wordType: WordType): string[] {
  const examples: Record<WordType, string[]> = {
    noun: ['cat', 'house', 'book', 'car'],
    verb: ['run', 'jump', 'sing', 'dance'],
    adjective: ['funny', 'big', 'red', 'happy'],
    adverb: ['quickly', 'loudly', 'carefully', 'slowly'],
    plural_noun: ['cats', 'dogs', 'books', 'cars'],
    past_tense_verb: ['ran', 'jumped', 'sang', 'danced'],
    color: ['red', 'blue', 'green', 'yellow'],
    number: ['5', '100', '42', '7'],
    place: ['park', 'school', 'beach', 'mountain'],
    person: ['teacher', 'doctor', 'friend', 'neighbor']
  };
  
  return examples[wordType] || [];
}

/**
 * Highlights player words in story text
 */
export function highlightPlayerWords(storyText: string, contributions: Array<{
  word: string;
  playerUsername: string;
  startIndex: number;
  endIndex: number;
}>) {
  if (contributions.length === 0) return storyText;
  
  // Sort contributions by start index in reverse order to avoid index shifting
  const sortedContributions = [...contributions].sort((a, b) => b.startIndex - a.startIndex);
  
  let result = storyText;
  for (const contribution of sortedContributions) {
    const before = result.substring(0, contribution.startIndex);
    const word = result.substring(contribution.startIndex, contribution.endIndex);
    const after = result.substring(contribution.endIndex);
    
    result = `${before}<span class="player-word" data-player="${contribution.playerUsername}">${word}</span>${after}`;
  }
  
  return result;
}

/**
 * Formats player contributions for display
 */
export function formatPlayerContributions(contributions: Array<{
  playerName: string;
  wordsContributed: string[];
}>): string {
  if (contributions.length === 0) return '';
  
  return contributions
    .map(contribution => {
      const words = contribution.wordsContributed.length > 0 
        ? contribution.wordsContributed.join(', ')
        : '(no words)';
      return `${contribution.playerName}: ${words}`;
    })
    .join('\n');
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets a random theme from available themes
 */
export function getRandomTheme(): string {
  const themes = [
    'Adventure', 'Mystery', 'Comedy', 'Romance', 'Sci-Fi', 'Fantasy',
    'Horror', 'Western', 'Superhero', 'Pirate', 'Space', 'Medieval'
  ];
  
  return themes[Math.floor(Math.random() * themes.length)];
}

/**
 * Checks if a game is complete
 */
export function isGameComplete(gameState: GameState): boolean {
  return gameState === 'completed';
}