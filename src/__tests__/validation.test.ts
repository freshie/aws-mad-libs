import { validateRoomCode, validateUsername, validateWord, sanitizeInput } from '@/utils/validation'

describe('Validation Utils', () => {
  describe('validateRoomCode', () => {
    it('should validate correct room codes', () => {
      expect(validateRoomCode('ABC123')).toBe(true)
      expect(validateRoomCode('XYZ789')).toBe(true)
      expect(validateRoomCode('123456')).toBe(true)
      expect(validateRoomCode('ABCDEF')).toBe(true)
    })

    it('should reject invalid room codes', () => {
      expect(validateRoomCode('abc123')).toBe(false) // lowercase
      expect(validateRoomCode('ABC12')).toBe(false) // too short
      expect(validateRoomCode('ABC1234')).toBe(false) // too long
      expect(validateRoomCode('ABC-12')).toBe(false) // special characters
      expect(validateRoomCode('')).toBe(false) // empty
    })
  })

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      expect(validateUsername('John')).toBe(true)
      expect(validateUsername('Player123')).toBe(true)
      expect(validateUsername('Cool Player')).toBe(true)
      expect(validateUsername('AB')).toBe(true) // minimum length
    })

    it('should reject invalid usernames', () => {
      expect(validateUsername('A')).toBe(false) // too short
      expect(validateUsername('A'.repeat(21))).toBe(false) // too long
      expect(validateUsername('Player@123')).toBe(false) // special characters
      expect(validateUsername('')).toBe(false) // empty
      expect(validateUsername('Player<script>')).toBe(false) // HTML tags
    })
  })

  describe('validateWord', () => {
    it('should validate correct words', () => {
      expect(validateWord('cat')).toBe(true)
      expect(validateWord('running')).toBe(true)
      expect(validateWord('blue-green')).toBe(true)
      expect(validateWord("don't")).toBe(true)
      expect(validateWord('New York')).toBe(true)
    })

    it('should reject invalid words', () => {
      expect(validateWord('')).toBe(false) // empty
      expect(validateWord('A'.repeat(51))).toBe(false) // too long
      expect(validateWord('word123')).toBe(false) // numbers
      expect(validateWord('word@home')).toBe(false) // special characters
      expect(validateWord('word<script>')).toBe(false) // HTML tags
    })
  })

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('Hello<script>alert("xss")</script>')).toBe('Helloscriptalert(xss)/script')
      expect(sanitizeInput('Test & "quotes"')).toBe('Test  quotes')
      expect(sanitizeInput("  spaced  ")).toBe('spaced')
    })

    it('should preserve safe characters', () => {
      expect(sanitizeInput('Hello World 123')).toBe('Hello World 123')
      expect(sanitizeInput("don't worry")).toBe("dont worry")
    })
  })
})