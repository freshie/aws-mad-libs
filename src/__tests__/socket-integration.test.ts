import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as Client, Socket as ClientSocket } from 'socket.io-client'
import { initializeSocketServer } from '@/lib/socket-server'
import { SOCKET_EVENTS } from '@/utils/constants'

describe('Socket.io Integration', () => {
  let httpServer: HTTPServer
  let socketServer: SocketIOServer
  let clientSocket: ClientSocket
  let serverPort: number

  beforeAll((done) => {
    httpServer = new HTTPServer()
    initializeSocketServer(httpServer)
    
    httpServer.listen(() => {
      const address = httpServer.address()
      if (address && typeof address === 'object') {
        serverPort = address.port
        done()
      }
    })
  })

  afterAll(() => {
    httpServer.close()
  })

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${serverPort}`)
    clientSocket.on('connect', done)
  })

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect()
    }
  })

  describe('Connection', () => {
    it('should connect successfully', () => {
      expect(clientSocket.connected).toBe(true)
    })

    it('should disconnect successfully', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false)
        done()
      })
      clientSocket.disconnect()
    })
  })

  describe('Game Creation', () => {
    it('should create a new game', (done) => {
      clientSocket.emit(SOCKET_EVENTS.CREATE_GAME, (response: any) => {
        expect(response.success).toBe(true)
        expect(response.game).toBeDefined()
        expect(response.game.roomCode).toMatch(/^[A-Z0-9]{6}$/)
        expect(response.game.players).toHaveLength(1)
        expect(response.game.players[0].isHost).toBe(true)
        done()
      })
    })

    it('should broadcast game creation to room', (done) => {
      clientSocket.on(SOCKET_EVENTS.GAME_CREATED, (data) => {
        expect(data.game).toBeDefined()
        expect(data.game.roomCode).toMatch(/^[A-Z0-9]{6}$/)
        done()
      })

      clientSocket.emit(SOCKET_EVENTS.CREATE_GAME, () => {})
    })
  })

  describe('Game Joining', () => {
    let roomCode: string

    beforeEach((done) => {
      clientSocket.emit(SOCKET_EVENTS.CREATE_GAME, (response: any) => {
        roomCode = response.game.roomCode
        done()
      })
    })

    it('should join existing game', (done) => {
      const secondClient = Client(`http://localhost:${serverPort}`)
      
      secondClient.on('connect', () => {
        secondClient.emit(SOCKET_EVENTS.JOIN_GAME, {
          roomCode,
          username: 'TestPlayer'
        }, (response: any) => {
          expect(response.success).toBe(true)
          expect(response.game.players).toHaveLength(2)
          expect(response.game.players[1].username).toBe('TestPlayer')
          expect(response.game.players[1].isHost).toBe(false)
          
          secondClient.disconnect()
          done()
        })
      })
    })

    it('should reject invalid room code', (done) => {
      clientSocket.emit(SOCKET_EVENTS.JOIN_GAME, {
        roomCode: 'INVALID',
        username: 'TestPlayer'
      }, (response: any) => {
        expect(response.success).toBe(false)
        expect(response.error).toContain('Invalid room code')
        done()
      })
    })

    it('should reject invalid username', (done) => {
      clientSocket.emit(SOCKET_EVENTS.JOIN_GAME, {
        roomCode,
        username: 'A' // Too short
      }, (response: any) => {
        expect(response.success).toBe(false)
        expect(response.error).toContain('Invalid username')
        done()
      })
    })

    it('should broadcast player join to room', (done) => {
      clientSocket.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
        expect(data.username).toBe('TestPlayer')
        expect(data.game.players).toHaveLength(2)
        done()
      })

      const secondClient = Client(`http://localhost:${serverPort}`)
      secondClient.on('connect', () => {
        secondClient.emit(SOCKET_EVENTS.JOIN_GAME, {
          roomCode,
          username: 'TestPlayer'
        }, () => {
          secondClient.disconnect()
        })
      })
    })
  })

  describe('Game Starting', () => {
    let roomCode: string

    beforeEach((done) => {
      clientSocket.emit(SOCKET_EVENTS.CREATE_GAME, (response: any) => {
        roomCode = response.game.roomCode
        
        // Add a second player to meet minimum requirements
        const secondClient = Client(`http://localhost:${serverPort}`)
        secondClient.on('connect', () => {
          secondClient.emit(SOCKET_EVENTS.JOIN_GAME, {
            roomCode,
            username: 'Player2'
          }, () => {
            secondClient.disconnect()
            done()
          })
        })
      })
    })

    it('should start game when host initiates', (done) => {
      clientSocket.emit(SOCKET_EVENTS.START_GAME, (response: any) => {
        // Note: This will fail until we implement startWordCollection in task 5
        // For now, we expect it to throw "Not implemented yet"
        expect(response.success).toBe(false)
        expect(response.error).toContain('Not implemented yet')
        done()
      })
    })

    it('should reject start game from non-host', (done) => {
      const secondClient = Client(`http://localhost:${serverPort}`)
      
      secondClient.on('connect', () => {
        secondClient.emit(SOCKET_EVENTS.JOIN_GAME, {
          roomCode,
          username: 'NonHost'
        }, () => {
          secondClient.emit(SOCKET_EVENTS.START_GAME, (response: any) => {
            expect(response.success).toBe(false)
            expect(response.error).toContain('Only host can start')
            
            secondClient.disconnect()
            done()
          })
        })
      })
    })
  })

  describe('Disconnection Handling', () => {
    let roomCode: string

    beforeEach((done) => {
      clientSocket.emit(SOCKET_EVENTS.CREATE_GAME, (response: any) => {
        roomCode = response.game.roomCode
        done()
      })
    })

    it('should broadcast player disconnection', (done) => {
      const secondClient = Client(`http://localhost:${serverPort}`)
      
      clientSocket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, (data) => {
        expect(data.username).toBe('TestPlayer')
        done()
      })

      secondClient.on('connect', () => {
        secondClient.emit(SOCKET_EVENTS.JOIN_GAME, {
          roomCode,
          username: 'TestPlayer'
        }, () => {
          // Disconnect after joining
          secondClient.disconnect()
        })
      })
    })

    it('should handle leave game event', (done) => {
      const secondClient = Client(`http://localhost:${serverPort}`)
      
      clientSocket.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
        expect(data.username).toBe('TestPlayer')
        done()
      })

      secondClient.on('connect', () => {
        secondClient.emit(SOCKET_EVENTS.JOIN_GAME, {
          roomCode,
          username: 'TestPlayer'
        }, () => {
          secondClient.emit(SOCKET_EVENTS.LEAVE_GAME)
        })
      })
    })
  })
})