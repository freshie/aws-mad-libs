'use client'

import { useState, useEffect } from 'react'
import { Player } from '@/types'
import { validateUsername } from '@/utils/validation'
import { v4 as uuidv4 } from 'uuid'

interface LocalPlaySetupProps {
  onStartGame: (players: Player[]) => void
  onBack: () => void
}

export function LocalPlaySetup({ onStartGame, onBack }: LocalPlaySetupProps) {
  // Load previous player names from localStorage
  const loadPreviousNames = (): string[] => {
    try {
      const saved = localStorage.getItem('madlibs-player-names')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  const [players, setPlayers] = useState<Player[]>(() => {
    const previousNames = loadPreviousNames()
    
    // Create initial players with previous names if available
    const initialPlayers = []
    for (let i = 0; i < Math.max(2, previousNames.length); i++) {
      initialPlayers.push({
        id: uuidv4(),
        username: previousNames[i] || '',
        isHost: i === 0,
        isConnected: true,
        wordsContributed: 0,
        joinedAt: new Date()
      })
    }
    
    return initialPlayers
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, {
        id: uuidv4(),
        username: '',
        isHost: false,
        isConnected: true,
        wordsContributed: 0,
        joinedAt: new Date()
      }])
    }
  }

  const removePlayer = (playerId: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== playerId))
      // Clear any errors for removed player
      const newErrors = { ...errors }
      delete newErrors[playerId]
      setErrors(newErrors)
    }
  }

  const updatePlayerName = (playerId: string, username: string) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, username } : p
    ))
    
    // Clear error when user starts typing
    if (errors[playerId]) {
      const newErrors = { ...errors }
      delete newErrors[playerId]
      setErrors(newErrors)
    }
  }

  const validatePlayers = () => {
    const newErrors: Record<string, string> = {}
    const usernames = new Set<string>()

    players.forEach(player => {
      const trimmedName = player.username.trim()
      
      if (!trimmedName) {
        newErrors[player.id] = 'Name is required'
      } else if (!validateUsername(trimmedName)) {
        newErrors[player.id] = 'Name must be 2-20 characters (letters, numbers, spaces only)'
      } else if (usernames.has(trimmedName.toLowerCase())) {
        newErrors[player.id] = 'Name must be unique'
      } else {
        usernames.add(trimmedName.toLowerCase())
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Save player names to localStorage
  const savePlayerNames = (playerList: Player[]) => {
    try {
      const names = playerList
        .map(p => p.username.trim())
        .filter(name => name.length > 0)
      localStorage.setItem('madlibs-player-names', JSON.stringify(names))
    } catch {
      // Ignore localStorage errors
    }
  }

  const handleStartGame = () => {
    if (validatePlayers()) {
      // Trim usernames and start game
      const validPlayers = players.map(p => ({
        ...p,
        username: p.username.trim()
      }))
      
      // Save names for next time
      savePlayerNames(validPlayers)
      
      onStartGame(validPlayers)
    }
  }

  const canStartGame = players.length >= 2 && players.every(p => p.username.trim())

  return (
    <div className="game-container">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-4">
            Local Play Setup
          </h1>
          <p className="text-xl text-gray-600">
            Add players and their names to start your Mad Libs game
          </p>
        </div>

        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-700">
              Players ({players.length}/8)
            </h2>
            <button
              onClick={addPlayer}
              disabled={players.length >= 8}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Player
            </button>
          </div>

          <div className="space-y-4">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <input
                    type="text"
                    value={player.username}
                    onChange={(e) => updatePlayerName(player.id, e.target.value)}
                    placeholder={`Player ${index + 1} name`}
                    className={`input-field ${errors[player.id] ? 'input-error' : ''}`}
                    maxLength={20}
                  />
                  {errors[player.id] && (
                    <p className="error-message">{errors[player.id]}</p>
                  )}
                </div>

                {player.isHost && (
                  <span className="badge badge-host">Host</span>
                )}

                {players.length > 1 && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove player"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {players.length < 2 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                Add at least 2 players to start the game
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleStartGame}
            disabled={!canStartGame}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Game
          </button>
        </div>

        <div className="mt-8 card bg-gray-50">
          <h3 className="font-bold text-gray-700 mb-2">How Local Play Works:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Each player will take turns entering words</li>
            <li>• The game will prompt for different word types (nouns, verbs, etc.)</li>
            <li>• AI will create a story using everyone's words</li>
            <li>• You'll see who contributed each word in the final story</li>
          </ul>
        </div>
      </div>
    </div>
  )
}