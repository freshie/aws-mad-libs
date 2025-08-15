import { GameState, StoryTemplate, WordSubmission, WordType } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generatePlayerId(): string {
  return `player-${uuidv4()}`;
}

export function calculateGameProgress(template: StoryTemplate, submissions: WordSubmission[]) {
  const total = template.totalWordBlanks;
  const completed = submissions.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

export function getNextWordPrompt(template: StoryTemplate, submissions: WordSubmission[]) {
  const submittedBlankIds = new Set(submissions.map(s => s.wordBlankId));
  
  for (const paragraph of template.paragraphs) {
    for (const blank of paragraph.wordBlanks) {
      if (!submittedBlankIds.has(blank.id)) {
        return {
          wordBlank: blank,
          promptText: `Enter ${getArticle(blank.type)} ${blank.type.replace('_', ' ')}:`,
          exampleWords: getExampleWords(blank.type)
        };
      }
    }
  }
  
  return null;
}

function getArticle(wordType: WordType): string {
  const vowelTypes = ['adjective', 'adverb'];
  return vowelTypes.includes(wordType) ? 'an' : 'a';
}

function getExampleWords(wordType: WordType): string[] {
  const examples: Record<WordType, string[]> = {
    noun: ['cat', 'house', 'book'],
    verb: ['run', 'jump', 'sing'],
    adjective: ['funny', 'big', 'red'],
    adverb: ['quickly', 'loudly', 'carefully'],
    plural_noun: ['cats', 'houses', 'books'],
    past_tense_verb: ['ran', 'jumped', 'sang'],
    color: ['blue', 'green', 'purple'],
    number: ['5', '100', '42'],
    place: ['park', 'school', 'beach'],
    person: ['teacher', 'friend', 'doctor']
  };
  
  return examples[wordType] || [];
}

export function highlightPlayerWords(storyText: string, contributions: Array<{word: string, playerUsername: string, startIndex: number, endIndex: number}>) {
  if (contributions.length === 0) return storyText;
  
  // Sort by start index in reverse order to avoid index shifting
  const sortedContributions = [...contributions].sort((a, b) => b.startIndex - a.startIndex);
  
  let result = storyText;
  for (const contribution of sortedContributions) {
    const before = result.substring(0, contribution.startIndex);
    const after = result.substring(contribution.endIndex);
    const highlighted = `<span class="player-word" data-player="${contribution.playerUsername}">${contribution.word}</span>`;
    result = before + highlighted + after;
  }
  
  return result;
}

export function formatPlayerContributions(contributions: Array<{playerName: string, wordsContributed: string[]}>) {
  if (contributions.length === 0) return '';
  
  return contributions.map(contribution => {
    const words = contribution.wordsContributed.length > 0 
      ? contribution.wordsContributed.join(', ')
      : '(no words)';
    return `${contribution.playerName}: ${words}`;
  }).join('\n');
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomTheme(): string {
  const themes = [
    'Adventure', 'Mystery', 'Comedy', 'Romance', 'Sci-Fi', 'Fantasy',
    'Horror', 'Western', 'Superhero', 'Pirate', 'Space', 'Medieval'
  ];
  return themes[Math.floor(Math.random() * themes.length)];
}

export function isGameComplete(gameState: GameState): boolean {
  return gameState === 'completed';
}