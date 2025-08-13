import { GAME_CONFIG } from './constants'

export function validateRoomCode(roomCode: string): boolean {
  return /^[A-Z0-9]{6}$/.test(roomCode)
}

export function validateUsername(username: string): boolean {
  return username.length >= 2 && username.length <= 20 && /^[a-zA-Z0-9\s]+$/.test(username)
}

export function validateWord(word: string, wordType?: string): boolean {
  if (word.length === 0 || word.length > GAME_CONFIG.WORD_MAX_LENGTH) {
    return false
  }
  
  // Allow numbers when the word type is NUMBER
  if (wordType === 'number' || wordType === 'NUMBER') {
    return /^[0-9]+$/.test(word)
  }
  
  // For all other word types, allow letters, spaces, hyphens, and apostrophes
  return /^[a-zA-Z\s'-]+$/.test(word)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, '')
}