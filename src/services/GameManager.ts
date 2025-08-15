import { GameSession, Player, Story, VideoResult, GameState, WordSubmission, WordType, StoryTemplate, Paragraph, WordBlank } from '@/types'
import { GAME_CONFIG } from '@/utils/constants'
import { validateRoomCode, validateUsername, validateWord } from '@/utils/validation'
import { 
  GameNotFoundError, 
  GameFullError, 
  ValidationError, 
  UsernameConflictError,
  AIServiceError 
} from '@/utils/errors'
import { StoryGenerator } from './StoryGenerator'
import { ImageGenerator } from './ImageGenerator'
import { v4 as uuidv4 } from 'uuid'

export class GameManager {
  private games: Map<string, GameSession> = new Map()
  private roomCodeHistory: Set<string> = new Set()
  
  async createGame(hostId: string): Promise<GameSession> {
    const roomCode = this.generateUniqueRoomCode()
    const gameId = uuidv4()
    
    const hostPlayer: Player = {
      id: hostId,
      username: '', // Will be set when host joins with username
      isHost: true,
      isConnected: true,
      wordsContributed: 0,
      joinedAt: new Date()
    }
    
    const gameSession: GameSession = {
      id: gameId,
      roomCode,
      hostId,
      players: [hostPlayer],
      gameState: GameState.WAITING_FOR_PLAYERS,
      storyTemplate: null,
      wordSubmissions: [],
      completedStory: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.games.set(roomCode, gameSession)
    this.roomCodeHistory.add(roomCode)
    
    // Auto-cleanup game after 2 hours of inactivity
    setTimeout(() => this.cleanupGame(roomCode), 2 * 60 * 60 * 1000)
    
    return gameSession
  }
  
  async joinGame(roomCode: string, playerId: string, username: string): Promise<void> {
    // Validate inputs
    if (!validateRoomCode(roomCode)) {
      throw new ValidationError('Invalid room code format')
    }
    
    if (!validateUsername(username)) {
      throw new ValidationError('Invalid username format')
    }
    
    const game = this.games.get(roomCode)
    if (!game) {
      throw new GameNotFoundError(roomCode)
    }
    
    // Check if game is full (excluding reconnections)
    const existingPlayer = game.players.find(p => p.id === playerId)
    if (!existingPlayer && game.players.filter(p => p.isConnected).length >= GAME_CONFIG.MAX_PLAYERS) {
      throw new GameFullError()
    }
    
    // Check if username is already taken by another player
    const usernameExists = game.players.find(p => 
      p.username.toLowerCase() === username.toLowerCase() && p.id !== playerId
    )
    if (usernameExists) {
      throw new UsernameConflictError(username)
    }
    
    if (existingPlayer) {
      // Player reconnection
      existingPlayer.isConnected = true
      existingPlayer.username = username
    } else {
      // New player joining
      const newPlayer: Player = {
        id: playerId,
        username,
        isHost: false,
        isConnected: true,
        wordsContributed: 0,
        joinedAt: new Date()
      }
      game.players.push(newPlayer)
    }
    
    game.updatedAt = new Date()
  }
  
  async startWordCollection(gameId: string): Promise<void> {
    const game = this.findGameById(gameId)
    if (!game) {
      throw new GameNotFoundError()
    }

    try {
      // Generate AI story template
      const storyGenerator = StoryGenerator.getInstance()
      const connectedPlayers = game.players.filter(p => p.isConnected)
      const storyTemplate = await storyGenerator.generateTemplate(undefined, connectedPlayers.length)
      
      // Validate the generated template
      if (!storyGenerator.validateTemplate(storyTemplate)) {
        console.warn('Generated template failed validation, using fallback')
        throw new Error('Invalid template generated')
      }
      
      // Assign word blanks to players in round-robin fashion
      this.assignWordBlanksToPlayers(storyTemplate, connectedPlayers)
      
      game.storyTemplate = storyTemplate
      game.gameState = GameState.COLLECTING_WORDS
      game.updatedAt = new Date()
    } catch (error) {
      console.error('Error generating AI template, using fallback:', error)
      
      // Fall back to default template
      const storyTemplate = this.createDefaultStoryTemplate(game.players.length)
      this.assignWordBlanksToPlayers(storyTemplate, game.players.filter(p => p.isConnected))
      
      game.storyTemplate = storyTemplate
      game.gameState = GameState.COLLECTING_WORDS
      game.updatedAt = new Date()
    }
  }
  
  async submitWord(gameId: string, playerId: string, word: string): Promise<void> {
    const game = this.findGameById(gameId)
    if (!game) {
      throw new GameNotFoundError()
    }

    if (game.gameState !== GameState.COLLECTING_WORDS) {
      throw new ValidationError('Game is not in word collection phase')
    }

    if (!validateWord(word)) {
      throw new ValidationError('Invalid word format')
    }

    const player = game.players.find(p => p.id === playerId)
    if (!player) {
      throw new ValidationError('Player not found in game')
    }

    // Find the next word blank assigned to this player
    const nextWordBlank = this.getNextWordBlankForPlayer(game, playerId)
    if (!nextWordBlank) {
      throw new ValidationError('No more words needed from this player')
    }

    // Create word submission
    const wordSubmission: WordSubmission = {
      id: uuidv4(),
      wordBlankId: nextWordBlank.id,
      playerId,
      playerUsername: player.username,
      word: word.trim(),
      wordType: nextWordBlank.type,
      submittedAt: new Date()
    }

    game.wordSubmissions.push(wordSubmission)
    player.wordsContributed++
    game.updatedAt = new Date()

    // Check if all words have been collected
    if (this.areAllWordsCollected(game)) {
      game.gameState = GameState.GENERATING_STORY
    }
  }
  
  async generateStory(gameId: string): Promise<Story> {
    const game = this.findGameById(gameId)
    if (!game) {
      throw new GameNotFoundError()
    }

    if (!game.storyTemplate) {
      throw new ValidationError('No story template found')
    }

    if (game.wordSubmissions.length < game.storyTemplate.totalWordBlanks) {
      throw new ValidationError('Not all words have been collected')
    }

    try {
      // Generate the story text first
      const storyGenerator = StoryGenerator.getInstance()
      const story = await storyGenerator.fillTemplate(game.storyTemplate, game.wordSubmissions)
      
      // Generate images for each paragraph
      const imageGenerator = ImageGenerator.getInstance()
      const imagePrompts = game.storyTemplate.paragraphs.map(p => p.imagePrompt)
      
      console.log('Generating images for story paragraphs...')
      const images = await imageGenerator.generateBatch(imagePrompts, {
        style: 'cartoon',
        colorScheme: 'vibrant'
      })

      // Update story paragraphs with image URLs
      story.paragraphs.forEach((paragraph, index) => {
        if (images[index]) {
          paragraph.imageUrl = images[index].url
        }
      })
      
      game.completedStory = story
      game.gameState = GameState.DISPLAYING_STORY
      game.updatedAt = new Date()

      return story
    } catch (error) {
      console.error('Error generating story:', error)
      throw new AIServiceError('Story Generation', error as Error)
    }
  }
  
  async createVideo(gameId: string): Promise<VideoResult> {
    // Implementation will be added in task 9
    throw new Error('Not implemented yet')
  }
  
  // Player management methods
  removePlayer(roomCode: string, playerId: string): void {
    const game = this.games.get(roomCode)
    if (!game) return
    
    const playerIndex = game.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1) return
    
    const player = game.players[playerIndex]
    
    // If host is leaving, transfer host to another player
    if (player.isHost && game.players.length > 1) {
      const newHost = game.players.find(p => p.id !== playerId && p.isConnected)
      if (newHost) {
        newHost.isHost = true
        game.hostId = newHost.id
      }
    }
    
    // Remove player or mark as disconnected based on game state
    if (game.gameState === GameState.WAITING_FOR_PLAYERS) {
      game.players.splice(playerIndex, 1)
    } else {
      player.isConnected = false
    }
    
    game.updatedAt = new Date()
    
    // Clean up empty games
    if (game.players.filter(p => p.isConnected).length === 0) {
      this.cleanupGame(roomCode)
    }
  }
  
  updatePlayerStatus(roomCode: string, playerId: string, isConnected: boolean): void {
    const game = this.games.get(roomCode)
    if (!game) return
    
    const player = game.players.find(p => p.id === playerId)
    if (player) {
      player.isConnected = isConnected
      game.updatedAt = new Date()
    }
  }
  
  getConnectedPlayers(roomCode: string): Player[] {
    const game = this.games.get(roomCode)
    return game ? game.players.filter(p => p.isConnected) : []
  }
  
  getPlayerCount(roomCode: string): number {
    return this.getConnectedPlayers(roomCode).length
  }
  
  canStartGame(roomCode: string): boolean {
    const connectedPlayers = this.getConnectedPlayers(roomCode)
    return connectedPlayers.length >= GAME_CONFIG.MIN_PLAYERS
  }
  
  // Game state management
  updateGameState(roomCode: string, newState: GameState): void {
    const game = this.games.get(roomCode)
    if (game) {
      game.gameState = newState
      game.updatedAt = new Date()
    }
  }
  
  getGame(roomCode: string): GameSession | undefined {
    return this.games.get(roomCode)
  }
  
  getAllGames(): GameSession[] {
    return Array.from(this.games.values())
  }
  
  getActiveGamesCount(): number {
    return this.games.size
  }
  
  // Cleanup methods
  private cleanupGame(roomCode: string): void {
    this.games.delete(roomCode)
    this.roomCodeHistory.delete(roomCode)
  }
  
  cleanupInactiveGames(): void {
    const now = new Date()
    const inactiveThreshold = GAME_CONFIG.RECONNECTION_TIMEOUT
    
    for (const [roomCode, game] of Array.from(this.games.entries())) {
      const timeSinceUpdate = now.getTime() - game.updatedAt.getTime()
      const hasConnectedPlayers = game.players.some(p => p.isConnected)
      
      if (timeSinceUpdate > inactiveThreshold && !hasConnectedPlayers) {
        this.cleanupGame(roomCode)
      }
    }
  }
  
  // Room code generation
  private generateUniqueRoomCode(): string {
    let roomCode: string
    let attempts = 0
    const maxAttempts = 100
    
    do {
      roomCode = this.generateRoomCode()
      attempts++
      
      if (attempts > maxAttempts) {
        throw new Error('Unable to generate unique room code')
      }
    } while (this.games.has(roomCode) || this.roomCodeHistory.has(roomCode))
    
    return roomCode
  }
  
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < GAME_CONFIG.ROOM_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private findGameById(gameId: string): GameSession | undefined {
    for (const game of Array.from(this.games.values())) {
      if (game.id === gameId) {
        return game
      }
    }
    return undefined
  }

  private createDefaultStoryTemplate(playerCount: number): StoryTemplate {
    // Create a simple default template for testing
    // This will be replaced with AI generation in task 6
    const wordTypes = [
      WordType.NOUN, WordType.ADJECTIVE, WordType.VERB, WordType.ADVERB,
      WordType.PLURAL_NOUN, WordType.COLOR, WordType.PLACE, WordType.PERSON,
      WordType.PAST_TENSE_VERB, WordType.NUMBER
    ]

    const paragraphs: Paragraph[] = [
      {
        id: uuidv4(),
        text: "Once upon a time, there was a {adjective} {noun} who loved to {verb} {adverb}.",
        wordBlanks: [
          { id: uuidv4(), type: WordType.ADJECTIVE, position: 0, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.NOUN, position: 1, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.VERB, position: 2, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.ADVERB, position: 3, assignedPlayerId: null }
        ],
        imagePrompt: "A whimsical character in a fairy tale setting"
      },
      {
        id: uuidv4(),
        text: "Every day, they would visit the {color} {place} with {number} {plural_noun}.",
        wordBlanks: [
          { id: uuidv4(), type: WordType.COLOR, position: 0, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.PLACE, position: 1, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.NUMBER, position: 2, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.PLURAL_NOUN, position: 3, assignedPlayerId: null }
        ],
        imagePrompt: "A colorful location with various objects"
      },
      {
        id: uuidv4(),
        text: "One day, {person} {past_tense_verb} and everything changed forever!",
        wordBlanks: [
          { id: uuidv4(), type: WordType.PERSON, position: 0, assignedPlayerId: null },
          { id: uuidv4(), type: WordType.PAST_TENSE_VERB, position: 1, assignedPlayerId: null }
        ],
        imagePrompt: "A dramatic moment with a person taking action"
      }
    ]

    const allWordBlanks = paragraphs.flatMap(p => p.wordBlanks)

    return {
      id: uuidv4(),
      title: "A Magical Adventure",
      paragraphs,
      totalWordBlanks: allWordBlanks.length,
      theme: "adventure",
      difficulty: 'easy'
    }
  }

  private assignWordBlanksToPlayers(template: StoryTemplate, players: Player[]): void {
    const allWordBlanks = template.paragraphs.flatMap(p => p.wordBlanks)
    
    // Assign word blanks to players in round-robin fashion
    allWordBlanks.forEach((wordBlank, index) => {
      const playerIndex = index % players.length
      wordBlank.assignedPlayerId = players[playerIndex].id
    })
  }

  private getNextWordBlankForPlayer(game: GameSession, playerId: string): WordBlank | null {
    if (!game.storyTemplate) return null

    const allWordBlanks = game.storyTemplate.paragraphs.flatMap(p => p.wordBlanks)
    const submittedWordBlankIds = new Set(game.wordSubmissions.map(ws => ws.wordBlankId))

    // Find the first unsubmitted word blank assigned to this player
    return allWordBlanks.find(wb => 
      wb.assignedPlayerId === playerId && 
      !submittedWordBlankIds.has(wb.id)
    ) || null
  }

  private areAllWordsCollected(game: GameSession): boolean {
    if (!game.storyTemplate) return false

    const totalWordBlanks = game.storyTemplate.totalWordBlanks
    return game.wordSubmissions.length >= totalWordBlanks
  }

  // Public methods for word collection state
  getCurrentWordPrompt(roomCode: string, playerId: string): { wordType: WordType; position: number } | null {
    const game = this.games.get(roomCode)
    if (!game || game.gameState !== GameState.COLLECTING_WORDS) {
      return null
    }

    const nextWordBlank = this.getNextWordBlankForPlayer(game, playerId)
    if (!nextWordBlank) return null

    return {
      wordType: nextWordBlank.type,
      position: this.getPlayerWordPosition(game, playerId, nextWordBlank.id)
    }
  }

  private getPlayerWordPosition(game: GameSession, playerId: string, wordBlankId: string): number {
    if (!game.storyTemplate) return 0

    const playerWordBlanks = game.storyTemplate.paragraphs
      .flatMap(p => p.wordBlanks)
      .filter(wb => wb.assignedPlayerId === playerId)

    return playerWordBlanks.findIndex(wb => wb.id === wordBlankId) + 1
  }

  getWordCollectionProgress(roomCode: string): { collected: number; total: number; byPlayer: Record<string, number> } {
    const game = this.games.get(roomCode)
    if (!game || !game.storyTemplate) {
      return { collected: 0, total: 0, byPlayer: {} }
    }

    const byPlayer: Record<string, number> = {}
    game.players.forEach(player => {
      byPlayer[player.id] = player.wordsContributed
    })

    return {
      collected: game.wordSubmissions.length,
      total: game.storyTemplate.totalWordBlanks,
      byPlayer
    }
  }
}