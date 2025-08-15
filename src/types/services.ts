import { GameSession, Player, Story, StoryTemplate, WordSubmission, ImageResult, VideoResult, VideoFormat, GameEvent } from './game'

export interface GameManager {
  createGame(hostId: string): Promise<GameSession>
  joinGame(roomCode: string, playerId: string, username: string): Promise<void>
  startWordCollection(gameId: string): Promise<void>
  submitWord(gameId: string, playerId: string, word: string): Promise<void>
  generateStory(gameId: string): Promise<Story>
  createVideo(gameId: string): Promise<VideoResult>
}

export interface StoryGenerator {
  generateTemplate(theme?: string, playerCount?: number): Promise<StoryTemplate>
  fillTemplate(template: StoryTemplate, words: WordSubmission[]): Promise<Story>
  validateTemplate(template: StoryTemplate): boolean
}

export interface ImageGenerator {
  generateImage(prompt: string, style?: ImageStyle): Promise<ImageResult>
  generateBatch(prompts: string[]): Promise<ImageResult[]>
  optimizeForVideo(image: ImageResult): Promise<ImageResult>
}

export interface VideoCreator {
  createStoryVideo(story: Story, images: ImageResult[], players: Player[]): Promise<VideoResult>
  addTransitions(scenes: VideoScene[]): Promise<VideoResult>
  exportVideo(video: VideoResult, format: VideoFormat): Promise<string>
}

export interface RealtimeHandler {
  broadcastToRoom(roomCode: string, event: GameEvent): void
  notifyPlayer(playerId: string, event: GameEvent): void
  handlePlayerDisconnect(playerId: string): void
  syncGameState(roomCode: string): void
}

export interface ImageStyle {
  style: 'cartoon' | 'realistic' | 'artistic' | 'comic'
  colorScheme: 'vibrant' | 'pastel' | 'monochrome'
}

export interface VideoScene {
  id: string
  duration: number
  content: string
  imageUrl?: string
  transition: 'fade' | 'slide' | 'zoom'
}

// VideoFormat is defined in game.ts

