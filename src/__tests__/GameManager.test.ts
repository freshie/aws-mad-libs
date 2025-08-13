import { GameManager } from '@/services/GameManager'
import { GameState } from '@/types'
import { GAME_CONFIG } from '@/utils/constants'

describe('GameManager', () => {
  let gameManager: GameManager

  beforeEach(() => {
    gameManager = new GameManager()
  })

  describe('createGame', () => {
    it('should create a new game with unique room code', async () => {
      const hostId = 'host-123'
      const game = await gameManager.createGame(hostId)

      expect(game.id).toBeDefined()
      expect(game.roomCode).toMatch(/^[A-Z0-9]{6}$/)
      expect(game.hostId).toBe(hostId)
      expect(game.gameState).toBe(GameState.WAITING_FOR_PLAYERS)
      expect(game.players).toHaveLength(1)
      expect(game.players[0].isHost).toBe(true)
      expect(game.players[0].isConnected).toBe(true)
    })

    it('should generate unique room codes for different games', async () => {
      const game1 = await gameManager.createGame('host-1')
      const game2 = await gameManager.createGame('host-2')

      expect(game1.roomCode).not.toBe(game2.roomCode)
    })

    it('should track creation and update timestamps', async () => {
      const before = new Date()
      const game = await gameManager.createGame('host-123')
      const after = new Date()

      expect(game.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(game.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(game.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(game.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('joinGame', () => {
    it('should allow player to join existing game', async () => {
      const game = await gameManager.createGame('host-123')
      const playerId = 'player-456'
      const username = 'TestPlayer'

      await gameManager.joinGame(game.roomCode, playerId, username)

      const updatedGame = gameManager.getGame(game.roomCode)
      expect(updatedGame?.players).toHaveLength(2)
      expect(updatedGame?.players[1].id).toBe(playerId)
      expect(updatedGame?.players[1].username).toBe(username)
      expect(updatedGame?.players[1].isHost).toBe(false)
      expect(updatedGame?.players[1].isConnected).toBe(true)
    })

    it('should throw error for non-existent game', async () => {
      await expect(
        gameManager.joinGame('INVALID', 'player-123', 'TestPlayer')
      ).rejects.toThrow('Game room not found')
    })

    it('should throw error for invalid room code format', async () => {
      await expect(
        gameManager.joinGame('invalid', 'player-123', 'TestPlayer')
      ).rejects.toThrow('Invalid room code')
    })

    it('should throw error for invalid username', async () => {
      const game = await gameManager.createGame('host-123')
      
      await expect(
        gameManager.joinGame(game.roomCode, 'player-123', 'A') // Too short
      ).rejects.toThrow('Invalid username')
      
      await expect(
        gameManager.joinGame(game.roomCode, 'player-123', 'Player@123') // Invalid chars
      ).rejects.toThrow('Invalid username')
    })

    it('should throw error when game is full', async () => {
      const game = await gameManager.createGame('host-123')
      
      // Fill the game to max capacity
      for (let i = 1; i < GAME_CONFIG.MAX_PLAYERS; i++) {
        await gameManager.joinGame(game.roomCode, `player-${i}`, `Player${i}`)
      }
      
      // Try to add one more player
      await expect(
        gameManager.joinGame(game.roomCode, 'extra-player', 'ExtraPlayer')
      ).rejects.toThrow('Game room is full')
    })

    it('should throw error for duplicate username', async () => {
      const game = await gameManager.createGame('host-123')
      
      await gameManager.joinGame(game.roomCode, 'player-1', 'TestPlayer')
      
      await expect(
        gameManager.joinGame(game.roomCode, 'player-2', 'TestPlayer')
      ).rejects.toThrow('Username already taken')
    })

    it('should handle player reconnection', async () => {
      const game = await gameManager.createGame('host-123')
      const playerId = 'player-456'
      
      // First join
      await gameManager.joinGame(game.roomCode, playerId, 'TestPlayer')
      
      // Reconnection with same player ID
      await gameManager.joinGame(game.roomCode, playerId, 'TestPlayerReconnected')
      
      const updatedGame = gameManager.getGame(game.roomCode)
      expect(updatedGame?.players).toHaveLength(2) // Should not add duplicate
      expect(updatedGame?.players[1].username).toBe('TestPlayerReconnected')
      expect(updatedGame?.players[1].isConnected).toBe(true)
    })

    it('should update game timestamp when player joins', async () => {
      const game = await gameManager.createGame('host-123')
      const originalTimestamp = game.updatedAt
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await gameManager.joinGame(game.roomCode, 'player-456', 'TestPlayer')
      
      const updatedGame = gameManager.getGame(game.roomCode)
      expect(updatedGame?.updatedAt.getTime()).toBeGreaterThan(originalTimestamp.getTime())
    })
  })

  describe('getGame', () => {
    it('should return game for valid room code', async () => {
      const game = await gameManager.createGame('host-123')
      const retrievedGame = gameManager.getGame(game.roomCode)

      expect(retrievedGame).toBeDefined()
      expect(retrievedGame?.id).toBe(game.id)
    })

    it('should return undefined for invalid room code', () => {
      const game = gameManager.getGame('INVALID')
      expect(game).toBeUndefined()
    })
  })
})  descri
be('removePlayer', () => {
    it('should remove player from waiting game', async () => {
      const game = await gameManager.createGame('host-123')
      await gameManager.joinGame(game.roomCode, 'player-456', 'TestPlayer')
      
      gameManager.removePlayer(game.roomCode, 'player-456')
      
      const updatedGame = gameManager.getGame(game.roomCode)
      expect(updatedGame?.players).toHaveLength(1)
      expect(updatedGame?.players[0].isHost).toBe(true)
    })

    it('should transfer host when host leaves', async () => {
      const game = await gameManager.createGame('host-123')
      await gameManager.joinGame(game.roomCode, 'player-456', 'TestPlayer')
      
      gameManager.removePlayer(game.roomCode, 'host-123')
      
      const updatedGame = gameManager.getGame(game.roomCode)
      expect(updatedGame?.hostId).toBe('player-456')
      expect(updatedGame?.players.find(p => p.id === 'player-456')?.isHost).toBe(true)
    })

    it('should mark player as disconnected in active game', async () => {
      const game = await gameManager.createGame('host-123')
      await gameManager.joinGame(game.roomCode, 'player-456', 'TestPlayer')
      
      // Simulate game in progress
      gameManager.updateGameState(game.roomCode, GameState.COLLECTING_WORDS)
      
      gameManager.removePlayer(game.roomCode, 'player-456')
      
      const updatedGame = gameManager.getGame(game.roomCode)
      expect(updatedGame?.players).toHaveLength(2) // Player still in list
      expect(updatedGame?.players.find(p => p.id === 'player-456')?.isConnected).toBe(false)
    })
  })

  describe('player management', () => {
    it('should get connected players count', async () => {
      const game = await gameManager.createGame('host-123')
      await gameManager.joinGame(game.roomCode, 'player-1', 'Player1')
      await gameManager.joinGame(game.roomCode, 'player-2', 'Player2')
      
      expect(gameManager.getPlayerCount(game.roomCode)).toBe(3)
      
      gameManager.updatePlayerStatus(game.roomCode, 'player-1', false)
      expect(gameManager.getPlayerCount(game.roomCode)).toBe(2)
    })

    it('should check if game can start', async () => {
      const game = await gameManager.createGame('host-123')
      
      expect(gameManager.canStartGame(game.roomCode)).toBe(false) // Only 1 player
      
      await gameManager.joinGame(game.roomCode, 'player-1', 'Player1')
      expect(gameManager.canStartGame(game.roomCode)).toBe(true) // 2 players minimum
    })

    it('should update player connection status', async () => {
      const game = await gameManager.createGame('host-123')
      await gameManager.joinGame(game.roomCode, 'player-456', 'TestPlayer')
      
      gameManager.updatePlayerStatus(game.roomCode, 'player-456', false)
      
      const updatedGame = gameManager.getGame(game.roomCode)
      const player = updatedGame?.players.find(p => p.id === 'player-456')
      expect(player?.isConnected).toBe(false)
    })
  })

  describe('game state management', () => {
    it('should update game state', async () => {
      const game = await gameManager.createGame('host-123')
      
      gameManager.updateGameState(game.roomCode, GameState.COLLECTING_WORDS)
      
      const updatedGame = gameManager.getGame(game.roomCode)
      expect(updatedGame?.gameState).toBe(GameState.COLLECTING_WORDS)
    })

    it('should get all games', async () => {
      await gameManager.createGame('host-1')
      await gameManager.createGame('host-2')
      
      const allGames = gameManager.getAllGames()
      expect(allGames).toHaveLength(2)
    })

    it('should get active games count', async () => {
      expect(gameManager.getActiveGamesCount()).toBe(0)
      
      await gameManager.createGame('host-1')
      await gameManager.createGame('host-2')
      
      expect(gameManager.getActiveGamesCount()).toBe(2)
    })
  })
})  d
escribe('word collection', () => {
    let game: GameSession

    beforeEach(async () => {
      game = await gameManager.createGame('host-123')
      await gameManager.joinGame(game.roomCode, 'player-456', 'TestPlayer')
    })

    describe('startWordCollection', () => {
      it('should start word collection and create story template', async () => {
        await gameManager.startWordCollection(game.id)

        const updatedGame = gameManager.getGame(game.roomCode)
        expect(updatedGame?.gameState).toBe(GameState.COLLECTING_WORDS)
        expect(updatedGame?.storyTemplate).toBeDefined()
        expect(updatedGame?.storyTemplate?.totalWordBlanks).toBeGreaterThan(0)
      })

      it('should assign word blanks to players', async () => {
        await gameManager.startWordCollection(game.id)

        const updatedGame = gameManager.getGame(game.roomCode)
        const allWordBlanks = updatedGame?.storyTemplate?.paragraphs.flatMap(p => p.wordBlanks) || []
        
        // All word blanks should be assigned to players
        allWordBlanks.forEach(wordBlank => {
          expect(wordBlank.assignedPlayerId).toBeDefined()
          expect(['host-123', 'player-456']).toContain(wordBlank.assignedPlayerId)
        })
      })

      it('should throw error for non-existent game', async () => {
        await expect(
          gameManager.startWordCollection('invalid-game-id')
        ).rejects.toThrow('Game room not found')
      })
    })

    describe('submitWord', () => {
      beforeEach(async () => {
        await gameManager.startWordCollection(game.id)
      })

      it('should accept valid word submission', async () => {
        const updatedGame = gameManager.getGame(game.roomCode)
        const firstWordBlank = updatedGame?.storyTemplate?.paragraphs[0].wordBlanks[0]
        const assignedPlayerId = firstWordBlank?.assignedPlayerId

        if (assignedPlayerId) {
          await gameManager.submitWord(game.id, assignedPlayerId, 'cat')

          const gameAfterSubmission = gameManager.getGame(game.roomCode)
          expect(gameAfterSubmission?.wordSubmissions).toHaveLength(1)
          expect(gameAfterSubmission?.wordSubmissions[0].word).toBe('cat')
          expect(gameAfterSubmission?.wordSubmissions[0].playerId).toBe(assignedPlayerId)
        }
      })

      it('should reject invalid word format', async () => {
        const updatedGame = gameManager.getGame(game.roomCode)
        const firstWordBlank = updatedGame?.storyTemplate?.paragraphs[0].wordBlanks[0]
        const assignedPlayerId = firstWordBlank?.assignedPlayerId

        if (assignedPlayerId) {
          await expect(
            gameManager.submitWord(game.id, assignedPlayerId, 'cat123')
          ).rejects.toThrow('Invalid word format')
        }
      })

      it('should reject submission when not in word collection phase', async () => {
        gameManager.updateGameState(game.roomCode, GameState.WAITING_FOR_PLAYERS)

        await expect(
          gameManager.submitWord(game.id, 'host-123', 'cat')
        ).rejects.toThrow('Game is not in word collection phase')
      })

      it('should reject submission from non-existent player', async () => {
        await expect(
          gameManager.submitWord(game.id, 'invalid-player', 'cat')
        ).rejects.toThrow('Player not found in game')
      })

      it('should transition to story generation when all words collected', async () => {
        const updatedGame = gameManager.getGame(game.roomCode)
        const allWordBlanks = updatedGame?.storyTemplate?.paragraphs.flatMap(p => p.wordBlanks) || []

        // Submit words for all blanks
        for (const wordBlank of allWordBlanks) {
          if (wordBlank.assignedPlayerId) {
            await gameManager.submitWord(game.id, wordBlank.assignedPlayerId, 'testword')
          }
        }

        const finalGame = gameManager.getGame(game.roomCode)
        expect(finalGame?.gameState).toBe(GameState.GENERATING_STORY)
      })

      it('should increment player word contribution count', async () => {
        const updatedGame = gameManager.getGame(game.roomCode)
        const firstWordBlank = updatedGame?.storyTemplate?.paragraphs[0].wordBlanks[0]
        const assignedPlayerId = firstWordBlank?.assignedPlayerId

        if (assignedPlayerId) {
          const playerBefore = updatedGame?.players.find(p => p.id === assignedPlayerId)
          const contributionsBefore = playerBefore?.wordsContributed || 0

          await gameManager.submitWord(game.id, assignedPlayerId, 'cat')

          const gameAfter = gameManager.getGame(game.roomCode)
          const playerAfter = gameAfter?.players.find(p => p.id === assignedPlayerId)
          
          expect(playerAfter?.wordsContributed).toBe(contributionsBefore + 1)
        }
      })
    })

    describe('getCurrentWordPrompt', () => {
      beforeEach(async () => {
        await gameManager.startWordCollection(game.id)
      })

      it('should return current word prompt for player', () => {
        const prompt = gameManager.getCurrentWordPrompt(game.roomCode, 'host-123')
        
        expect(prompt).toBeDefined()
        expect(prompt?.wordType).toBeDefined()
        expect(prompt?.position).toBeGreaterThan(0)
      })

      it('should return null when not in word collection phase', () => {
        gameManager.updateGameState(game.roomCode, GameState.WAITING_FOR_PLAYERS)
        
        const prompt = gameManager.getCurrentWordPrompt(game.roomCode, 'host-123')
        expect(prompt).toBeNull()
      })

      it('should return null when no more words needed from player', async () => {
        // Submit all words for a player
        const updatedGame = gameManager.getGame(game.roomCode)
        const playerWordBlanks = updatedGame?.storyTemplate?.paragraphs
          .flatMap(p => p.wordBlanks)
          .filter(wb => wb.assignedPlayerId === 'host-123') || []

        for (const wordBlank of playerWordBlanks) {
          await gameManager.submitWord(game.id, 'host-123', 'testword')
        }

        const prompt = gameManager.getCurrentWordPrompt(game.roomCode, 'host-123')
        expect(prompt).toBeNull()
      })
    })

    describe('getWordCollectionProgress', () => {
      beforeEach(async () => {
        await gameManager.startWordCollection(game.id)
      })

      it('should return correct progress information', () => {
        const progress = gameManager.getWordCollectionProgress(game.roomCode)
        
        expect(progress.collected).toBe(0)
        expect(progress.total).toBeGreaterThan(0)
        expect(progress.byPlayer).toBeDefined()
        expect(progress.byPlayer['host-123']).toBe(0)
        expect(progress.byPlayer['player-456']).toBe(0)
      })

      it('should update progress after word submission', async () => {
        const updatedGame = gameManager.getGame(game.roomCode)
        const firstWordBlank = updatedGame?.storyTemplate?.paragraphs[0].wordBlanks[0]
        const assignedPlayerId = firstWordBlank?.assignedPlayerId

        if (assignedPlayerId) {
          await gameManager.submitWord(game.id, assignedPlayerId, 'cat')

          const progress = gameManager.getWordCollectionProgress(game.roomCode)
          expect(progress.collected).toBe(1)
          expect(progress.byPlayer[assignedPlayerId]).toBe(1)
        }
      })

      it('should return empty progress for non-existent game', () => {
        const progress = gameManager.getWordCollectionProgress('INVALID')
        
        expect(progress.collected).toBe(0)
        expect(progress.total).toBe(0)
        expect(progress.byPlayer).toEqual({})
      })
    })
  })
})