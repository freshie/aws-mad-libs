import { GameManager } from './GameManager'

// Singleton instance for the game manager
let gameManagerInstance: GameManager | null = null

export function getGameManager(): GameManager {
  if (!gameManagerInstance) {
    gameManagerInstance = new GameManager()
    
    // Set up periodic cleanup of inactive games
    setInterval(() => {
      gameManagerInstance?.cleanupInactiveGames()
    }, 5 * 60 * 1000) // Every 5 minutes
  }
  
  return gameManagerInstance
}

export { GameManager }