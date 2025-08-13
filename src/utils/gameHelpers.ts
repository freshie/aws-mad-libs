import { GameSession, Player, GameState } from '@/types'
import { GAME_CONFIG } from './constants'

export function isGameFull(game: GameSession): boolean {
  return game.players.filter(p => p.isConnected).length >= GAME_CONFIG.MAX_PLAYERS
}

export function canPlayerJoin(game: GameSession, playerId: string): boolean {
  const existingPlayer = game.players.find(p => p.id === playerId)
  return existingPlayer !== undefined || !isGameFull(game)
}

export function getGameHost(game: GameSession): Player | undefined {
  return game.players.find(p => p.isHost)
}

export function getConnectedPlayersCount(game: GameSession): number {
  return game.players.filter(p => p.isConnected).length
}

export function isGameStartable(game: GameSession): boolean {
  const connectedCount = getConnectedPlayersCount(game)
  return connectedCount >= GAME_CONFIG.MIN_PLAYERS && 
         connectedCount <= GAME_CONFIG.MAX_PLAYERS &&
         game.gameState === GameState.WAITING_FOR_PLAYERS
}

export function getNextHost(game: GameSession, currentHostId: string): Player | undefined {
  return game.players.find(p => 
    p.id !== currentHostId && 
    p.isConnected && 
    !p.isHost
  )
}

export function formatGameDuration(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date()
  const durationMs = end.getTime() - startTime.getTime()
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function getGameStateDisplay(state: GameState): string {
  switch (state) {
    case GameState.WAITING_FOR_PLAYERS:
      return 'Waiting for players'
    case GameState.COLLECTING_WORDS:
      return 'Collecting words'
    case GameState.GENERATING_STORY:
      return 'Generating story'
    case GameState.DISPLAYING_STORY:
      return 'Showing story'
    case GameState.CREATING_VIDEO:
      return 'Creating video'
    case GameState.COMPLETED:
      return 'Game completed'
    default:
      return 'Unknown state'
  }
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}