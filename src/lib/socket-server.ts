import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { getGameManager } from '@/services'
import { SOCKET_EVENTS } from '@/utils/constants'
import { handleGameError } from '@/utils/errors'
import { generatePlayerId } from '@/utils/gameHelpers'
import { validateRoomCode, validateUsername } from '@/utils/validation'
import { GameState } from '@/types'

export class SocketServer {
  private io: SocketIOServer
  private gameManager = getGameManager()

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Generate a unique player ID for this connection
      const playerId = generatePlayerId()
      socket.data.playerId = playerId

      // Handle game creation
      socket.on(SOCKET_EVENTS.CREATE_GAME, async (callback) => {
        try {
          const game = await this.gameManager.createGame(playerId)
          
          // Join the socket room
          await socket.join(game.roomCode)
          socket.data.roomCode = game.roomCode
          
          callback({ success: true, game })
          
          // Broadcast to room that game was created
          this.io.to(game.roomCode).emit(SOCKET_EVENTS.GAME_CREATED, { game })
          
        } catch (error) {
          const gameError = handleGameError(error)
          callback({ success: false, error: gameError.message })
        }
      })

      // Handle joining game
      socket.on(SOCKET_EVENTS.JOIN_GAME, async (data, callback) => {
        try {
          const { roomCode, username } = data
          
          if (!validateRoomCode(roomCode)) {
            throw new Error('Invalid room code format')
          }
          
          if (!validateUsername(username)) {
            throw new Error('Invalid username format')
          }

          await this.gameManager.joinGame(roomCode, playerId, username)
          
          // Join the socket room
          await socket.join(roomCode)
          socket.data.roomCode = roomCode
          socket.data.username = username
          
          const game = this.gameManager.getGame(roomCode)
          callback({ success: true, game })
          
          // Broadcast to room that player joined
          this.io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_JOINED, { 
            playerId, 
            username,
            game 
          })
          
        } catch (error) {
          const gameError = handleGameError(error)
          callback({ success: false, error: gameError.message })
        }
      })

      // Handle starting game
      socket.on(SOCKET_EVENTS.START_GAME, async (callback) => {
        try {
          const roomCode = socket.data.roomCode
          if (!roomCode) {
            throw new Error('Not in a game room')
          }

          const game = this.gameManager.getGame(roomCode)
          if (!game) {
            throw new Error('Game not found')
          }

          // Check if player is host
          const player = game.players.find(p => p.id === playerId)
          if (!player?.isHost) {
            throw new Error('Only host can start the game')
          }

          // Check if game can start
          if (!this.gameManager.canStartGame(roomCode)) {
            throw new Error('Not enough players to start game')
          }

          // Start word collection (will be implemented in task 5)
          await this.gameManager.startWordCollection(game.id)
          
          callback({ success: true })
          
          // Broadcast to room that game started
          this.io.to(roomCode).emit(SOCKET_EVENTS.GAME_STARTED, { game })
          
        } catch (error) {
          const gameError = handleGameError(error)
          callback({ success: false, error: gameError.message })
        }
      })

      // Handle word submission
      socket.on(SOCKET_EVENTS.SUBMIT_WORD, async (data, callback) => {
        try {
          const { word } = data
          const roomCode = socket.data.roomCode
          
          if (!roomCode) {
            throw new Error('Not in a game room')
          }

          const game = this.gameManager.getGame(roomCode)
          if (!game) {
            throw new Error('Game not found')
          }

          // Submit word
          await this.gameManager.submitWord(game.id, playerId, word)
          
          const updatedGame = this.gameManager.getGame(roomCode)
          callback({ success: true, game: updatedGame })
          
          // Broadcast to room that word was submitted
          this.io.to(roomCode).emit(SOCKET_EVENTS.WORD_SUBMITTED, { 
            playerId,
            username: socket.data.username,
            word,
            game: updatedGame
          })

          // Check if all words are collected
          if (updatedGame?.gameState === GameState.GENERATING_STORY) {
            this.io.to(roomCode).emit(SOCKET_EVENTS.ALL_WORDS_COLLECTED, {
              game: updatedGame,
              wordSubmissions: updatedGame.wordSubmissions
            })

            // Automatically start story generation
            try {
              this.io.to(roomCode).emit(SOCKET_EVENTS.STORY_GENERATING, { game: updatedGame })
              
              // Generate story with images
              const story = await this.gameManager.generateStory(updatedGame.id)
              const finalGame = this.gameManager.getGame(roomCode)
              
              this.io.to(roomCode).emit(SOCKET_EVENTS.STORY_GENERATED, {
                game: finalGame,
                story
              })
            } catch (error) {
              console.error('Error generating story:', error)
              this.io.to(roomCode).emit(SOCKET_EVENTS.ERROR, {
                message: 'Failed to generate story. Please try again.'
              })
            }
          }
          
        } catch (error) {
          const gameError = handleGameError(error)
          callback({ success: false, error: gameError.message })
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
        
        const roomCode = socket.data.roomCode
        if (roomCode && playerId) {
          // Mark player as disconnected
          this.gameManager.updatePlayerStatus(roomCode, playerId, false)
          
          // Broadcast to room that player disconnected
          this.io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, { 
            playerId,
            username: socket.data.username 
          })
          
          // If no connected players remain, clean up after timeout
          setTimeout(() => {
            const connectedCount = this.gameManager.getPlayerCount(roomCode)
            if (connectedCount === 0) {
              this.gameManager.removePlayer(roomCode, playerId)
            }
          }, 30000) // 30 second grace period
        }
      })

      // Handle leaving game
      socket.on(SOCKET_EVENTS.LEAVE_GAME, () => {
        const roomCode = socket.data.roomCode
        if (roomCode && playerId) {
          this.gameManager.removePlayer(roomCode, playerId)
          socket.leave(roomCode)
          
          // Broadcast to room that player left
          this.io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_LEFT, { 
            playerId,
            username: socket.data.username 
          })
          
          // Clear socket data
          socket.data.roomCode = null
          socket.data.username = null
        }
      })
    })
  }

  // Utility methods for broadcasting
  broadcastToRoom(roomCode: string, event: string, data: any): void {
    this.io.to(roomCode).emit(event, data)
  }

  notifyPlayer(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data)
  }

  getRoomSockets(roomCode: string): Promise<Set<string>> {
    return this.io.in(roomCode).allSockets()
  }

  getConnectedClientsCount(): number {
    return this.io.engine.clientsCount
  }
}

let socketServer: SocketServer | null = null

export function initializeSocketServer(httpServer: HTTPServer): SocketServer {
  if (!socketServer) {
    socketServer = new SocketServer(httpServer)
  }
  return socketServer
}

export function getSocketServer(): SocketServer | null {
  return socketServer
}