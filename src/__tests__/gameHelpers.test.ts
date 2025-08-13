import {
  isGameFull,
  canPlayerJoin,
  getGameHost,
  getConnectedPlayersCount,
  isGameStartable,
  getNextHost,
  formatGameDuration,
  getGameStateDisplay,
  generatePlayerId
} from '@/utils/gameHelpers'
import { GameSession, GameState, Player } from '@/types'
import { GAME_CONFIG } from '@/utils/constants'

describe('Game Helpers', () => {
  const createMockGame = (playerCount: number, gameState: GameState = GameState.WAITING_FOR_PLAYERS): GameSession => {
    const players: Player[] = []
    
    for (let i = 0; i < playerCount; i++) {
      players.push({
        id: `player-${i}`,
        username: `Player${i}`,
        isHost: i === 0,
        isConnected: true,
        wordsContributed: 0,
        joinedAt: new Date()
      })
    }

    return {
      id: 'game-123',
      roomCode: 'ABC123',
      hostId: 'player-0',
      players,
      gameState,
      storyTemplate: null,
      wordSubmissions: [],
      completedStory: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  describe('isGameFull', () => {
    it('should return false for game with available slots', () => {
      const game = createMockGame(3)
      expect(isGameFull(game)).toBe(false)
    })

    it('should return true for game at max capacity', () => {
      const game = createMockGame(GAME_CONFIG.MAX_PLAYERS)
      expect(isGameFull(game)).toBe(true)
    })

    it('should only count connected players', () => {
      const game = createMockGame(GAME_CONFIG.MAX_PLAYERS)
      game.players[0].isConnected = false
      expect(isGameFull(game)).toBe(false)
    })
  })

  describe('canPlayerJoin', () => {
    it('should allow existing player to rejoin', () => {
      const game = createMockGame(GAME_CONFIG.MAX_PLAYERS)
      expect(canPlayerJoin(game, 'player-0')).toBe(true)
    })

    it('should allow new player when game not full', () => {
      const game = createMockGame(3)
      expect(canPlayerJoin(game, 'new-player')).toBe(true)
    })

    it('should not allow new player when game is full', () => {
      const game = createMockGame(GAME_CONFIG.MAX_PLAYERS)
      expect(canPlayerJoin(game, 'new-player')).toBe(false)
    })
  })

  describe('getGameHost', () => {
    it('should return the host player', () => {
      const game = createMockGame(3)
      const host = getGameHost(game)
      
      expect(host).toBeDefined()
      expect(host?.isHost).toBe(true)
      expect(host?.id).toBe('player-0')
    })

    it('should return undefined if no host exists', () => {
      const game = createMockGame(3)
      game.players.forEach(p => p.isHost = false)
      
      const host = getGameHost(game)
      expect(host).toBeUndefined()
    })
  })

  describe('getConnectedPlayersCount', () => {
    it('should count only connected players', () => {
      const game = createMockGame(5)
      game.players[1].isConnected = false
      game.players[2].isConnected = false
      
      expect(getConnectedPlayersCount(game)).toBe(3)
    })
  })

  describe('isGameStartable', () => {
    it('should return true for valid game', () => {
      const game = createMockGame(GAME_CONFIG.MIN_PLAYERS)
      expect(isGameStartable(game)).toBe(true)
    })

    it('should return false for game with too few players', () => {
      const game = createMockGame(GAME_CONFIG.MIN_PLAYERS - 1)
      expect(isGameStartable(game)).toBe(false)
    })

    it('should return false for game not in waiting state', () => {
      const game = createMockGame(GAME_CONFIG.MIN_PLAYERS, GameState.COLLECTING_WORDS)
      expect(isGameStartable(game)).toBe(false)
    })
  })

  describe('getNextHost', () => {
    it('should return next available connected player', () => {
      const game = createMockGame(3)
      const nextHost = getNextHost(game, 'player-0')
      
      expect(nextHost).toBeDefined()
      expect(nextHost?.id).toBe('player-1')
      expect(nextHost?.isConnected).toBe(true)
    })

    it('should return undefined if no other connected players', () => {
      const game = createMockGame(2)
      game.players[1].isConnected = false
      
      const nextHost = getNextHost(game, 'player-0')
      expect(nextHost).toBeUndefined()
    })
  })

  describe('formatGameDuration', () => {
    it('should format duration in minutes and seconds', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const end = new Date('2023-01-01T10:02:30Z')
      
      expect(formatGameDuration(start, end)).toBe('2m 30s')
    })

    it('should format duration in seconds only', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const end = new Date('2023-01-01T10:00:45Z')
      
      expect(formatGameDuration(start, end)).toBe('45s')
    })
  })

  describe('getGameStateDisplay', () => {
    it('should return readable state names', () => {
      expect(getGameStateDisplay(GameState.WAITING_FOR_PLAYERS)).toBe('Waiting for players')
      expect(getGameStateDisplay(GameState.COLLECTING_WORDS)).toBe('Collecting words')
      expect(getGameStateDisplay(GameState.GENERATING_STORY)).toBe('Generating story')
      expect(getGameStateDisplay(GameState.DISPLAYING_STORY)).toBe('Showing story')
      expect(getGameStateDisplay(GameState.CREATING_VIDEO)).toBe('Creating video')
      expect(getGameStateDisplay(GameState.COMPLETED)).toBe('Game completed')
    })
  })

  describe('generatePlayerId', () => {
    it('should generate unique player IDs', () => {
      const id1 = generatePlayerId()
      const id2 = generatePlayerId()
      
      expect(id1).toMatch(/^player_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^player_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })
})