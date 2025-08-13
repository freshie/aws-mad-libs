import { GameSession, Player, GameState } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// Simple in-memory mock for testing without backend
export class MockGameManager {
  private static instance: MockGameManager
  private games: Map<string, GameSession> = new Map()

  static getInstance(): MockGameManager {
    if (!MockGameManager.instance) {
      MockGameManager.instance = new MockGameManager()
    }
    return MockGameManager.instance
  }

  async createGame(): Promise<{ roomCode: string; game: GameSession }> {
    const roomCode = this.generateRoomCode()
    const gameId = uuidv4()
    
    const game: GameSession = {
      id: gameId,
      roomCode,
      hostId: 'mock-host',
      players: [{
        id: 'mock-host',
        username: 'Host',
        isHost: true,
        isConnected: true,
        wordsContributed: 0,
        joinedAt: new Date()
      }],
      gameState: GameState.WAITING_FOR_PLAYERS,
      storyTemplate: null,
      wordSubmissions: [],
      completedStory: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.games.set(roomCode, game)
    return { roomCode, game }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}