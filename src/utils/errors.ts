export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'GameError'
  }
}

export class ValidationError extends GameError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class GameNotFoundError extends GameError {
  constructor(roomCode?: string) {
    super(
      roomCode ? `Game with room code ${roomCode} not found` : 'Game not found',
      'GAME_NOT_FOUND',
      404
    )
    this.name = 'GameNotFoundError'
  }
}

export class GameFullError extends GameError {
  constructor() {
    super('Game room is full', 'GAME_FULL', 409)
    this.name = 'GameFullError'
  }
}

export class PlayerNotFoundError extends GameError {
  constructor(playerId?: string) {
    super(
      playerId ? `Player ${playerId} not found` : 'Player not found',
      'PLAYER_NOT_FOUND',
      404
    )
    this.name = 'PlayerNotFoundError'
  }
}

export class UsernameConflictError extends GameError {
  constructor(username: string) {
    super(`Username "${username}" is already taken`, 'USERNAME_CONFLICT', 409)
    this.name = 'UsernameConflictError'
  }
}

export class AIServiceError extends GameError {
  constructor(service: string, originalError?: Error) {
    super(
      `${service} service is temporarily unavailable`,
      'AI_SERVICE_ERROR',
      503
    )
    this.name = 'AIServiceError'
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

export function handleGameError(error: unknown): GameError {
  if (error instanceof GameError) {
    return error
  }
  
  if (error instanceof Error) {
    return new GameError(error.message, 'UNKNOWN_ERROR', 500)
  }
  
  return new GameError('An unknown error occurred', 'UNKNOWN_ERROR', 500)
}