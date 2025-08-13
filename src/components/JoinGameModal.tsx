'use client'

import { useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import { validateRoomCode, validateUsername } from '@/utils/validation'

interface JoinGameModalProps {
  onClose: () => void
}

export function JoinGameModal({ onClose }: JoinGameModalProps) {
  const { joinGame, isLoading, error } = useGame()
  const [roomCode, setRoomCode] = useState('')
  const [username, setUsername] = useState('')
  const [validationErrors, setValidationErrors] = useState<{
    roomCode?: string
    username?: string
  }>({})

  const validateForm = () => {
    const errors: { roomCode?: string; username?: string } = {}

    if (!roomCode.trim()) {
      errors.roomCode = 'Room code is required'
    } else if (!validateRoomCode(roomCode.trim().toUpperCase())) {
      errors.roomCode = 'Room code must be 6 characters (letters and numbers)'
    }

    if (!username.trim()) {
      errors.username = 'Username is required'
    } else if (!validateUsername(username.trim())) {
      errors.username = 'Username must be 2-20 characters (letters, numbers, spaces only)'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await joinGame(roomCode.trim().toUpperCase(), username.trim())
      onClose()
    } catch (err) {
      // Error is handled by the context
    }
  }

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setRoomCode(value)
    
    // Clear validation error when user starts typing
    if (validationErrors.roomCode) {
      setValidationErrors(prev => ({ ...prev, roomCode: undefined }))
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 20)
    setUsername(value)
    
    // Clear validation error when user starts typing
    if (validationErrors.username) {
      setValidationErrors(prev => ({ ...prev, username: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Join Game</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-1">
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={handleRoomCodeChange}
              placeholder="ABC123"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-center text-lg ${
                validationErrors.roomCode ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {validationErrors.roomCode && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.roomCode}</p>
            )}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your name"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                validationErrors.username ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {validationErrors.username && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !roomCode.trim() || !username.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Ask your friend for the 6-character room code to join their game
          </p>
        </div>
      </div>
    </div>
  )
}