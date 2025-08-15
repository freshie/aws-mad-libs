export enum GameState {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  COLLECTING_WORDS = 'collecting_words',
  GENERATING_STORY = 'generating_story',
  DISPLAYING_STORY = 'displaying_story',
  CREATING_VIDEO = 'creating_video',
  COMPLETED = 'completed'
}

export enum WordType {
  NOUN = 'noun',
  VERB = 'verb',
  ADJECTIVE = 'adjective',
  ADVERB = 'adverb',
  PLURAL_NOUN = 'plural_noun',
  PAST_TENSE_VERB = 'past_tense_verb',
  COLOR = 'color',
  NUMBER = 'number',
  PLACE = 'place',
  PERSON = 'person'
}

export interface Player {
  id: string
  username: string
  isHost: boolean
  isConnected: boolean
  wordsContributed: number
  joinedAt: Date
}

export interface WordBlank {
  id: string
  type: WordType
  position: number
  assignedPlayerId: string | null
}

export interface Paragraph {
  id: string
  text: string
  wordBlanks: WordBlank[]
  imagePrompt: string
}

export interface StoryTemplate {
  id: string
  title: string
  paragraphs: Paragraph[]
  totalWordBlanks: number
  theme: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface WordSubmission {
  id: string
  wordBlankId: string
  playerId: string
  playerUsername: string
  word: string
  wordType: WordType
  submittedAt: Date
}

export interface GameSession {
  id: string
  roomCode: string
  hostId: string
  players: Player[]
  gameState: GameState
  storyTemplate: StoryTemplate | null
  wordSubmissions: WordSubmission[]
  completedStory: Story | null
  createdAt: Date
  updatedAt: Date
}

export interface WordHighlight {
  word: string
  playerUsername: string
  wordType?: WordType | string
  startIndex: number
  endIndex: number
}

export interface CompletedParagraph {
  id: string
  text: string
  imageUrl: string | null
  wordHighlights: WordHighlight[]
}

export interface PlayerContribution {
  playerId: string
  playerUsername: string
  wordsContributed: string[]
}

export interface Story {
  id: string
  title: string
  theme?: string
  paragraphs: CompletedParagraph[]
  playerContributions: PlayerContribution[]
  videoUrl?: string
  createdAt: Date
}

export interface ImageResult {
  id: string
  url: string
  prompt: string
  width: number
  height: number
  createdAt: Date
}

export interface VideoResult {
  id: string
  url: string
  thumbnailUrl: string
  duration: number
  format: VideoFormat
  size: number
  createdAt: Date
}

export enum VideoFormat {
  MP4 = 'mp4',
  WEBM = 'webm'
}

export interface GameEvent {
  type: string
  payload: any
  timestamp: Date
}