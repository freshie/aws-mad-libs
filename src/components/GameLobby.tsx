'use client'

import { useGame } from '@/contexts/GameContext'
import { getGameStateDisplay } from '@/utils/gameHelpers'
import { GameState } from '@/types'
import { useState } from 'react'
import { WordCollection } from './WordCollection'
import { StoryDisplay } from './StoryDisplay'

export function GameLobby() {
  const { currentGame, currentPlayer, startGame, leaveGame, isLoading, error } = useGame()
  const [copied, setCopied] = useState(false)

  if (!currentGame) {
    return null
  }

  // Show word collection if game has started
  if (currentGame.gameState === GameState.COLLECTING_WORDS || 
      currentGame.gameState === GameState.GENERATING_STORY) {
    return <WordCollection />
  }

  // Show story display if story is ready
  if (currentGame.gameState === GameState.DISPLAYING_STORY && currentGame.completedStory) {
    return (
      <StoryDisplay
        story={currentGame.completedStory}
        onCreateVideo={() => {
          // Will be implemented in task 9
          console.log('Creating video...')
        }}
        onPlayAgain={() => {
          // Reset game state
          window.location.reload()
        }}
        onShare={() => {
          // Will be implemented in task 10
          console.log('Sharing story...')
        }}
        isLoading={isLoading}
      />
    )
  }

  const connectedPlayers = currentGame.players.filter(p => p.isConnected)
  const isHost = currentPlayer?.isHost || false
  const canStart = connectedPlayers.length >= 2 && currentGame.gameState === GameState.WAITING_FOR_PLAYERS

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(currentGame.roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy room code:', err)
    }
  }

  const handleStartGame = async () => {
    await startGame()
  }

  const handleLeaveGame = () => {
    if (confirm('Are you sure you want to leave the game?')) {
      leaveGame()
    }
  }

  return (
    <div className="game-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-2">Game Lobby</h1>
          <p className="text-gray-600">
            {getGameStateDisplay(currentGame.gameState)}
          </p>
        </div>

        {/* Room Code */}
        <div className="card text-center mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Room Code</h2>
          <div className="flex items-center justify-center space-x-4">
            <div className="text-4xl font-mono font-bold text-primary-600 bg-primary-50 px-6 py-3 rounded-lg border-2 border-primary-200">
              {currentGame.roomCode}
            </div>
            <button
              onClick={handleCopyRoomCode}
              className="btn-primary text-sm px-4 py-2"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-500 mt-2">Share this code with your friends!</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Players List */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              Players ({connectedPlayers.length}/8)
            </h3>
            <div className="space-y-3">
              {currentGame.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.isConnected
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        player.isConnected ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className={`font-medium ${
                      player.isConnected ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {player.username || 'Setting up...'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {player.isHost && (
                      <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium">
                        Host
                      </span>
                    )}
                    {player.id === currentPlayer?.id && (
                      <span className="bg-secondary-100 text-secondary-700 text-xs px-2 py-1 rounded-full font-medium">
                        You
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {connectedPlayers.length < 2 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-sm">
                  Need at least 2 players to start the game
                </p>
              </div>
            )}
          </div>

          {/* Game Controls */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Game Controls</h3>
            
            {isHost ? (
              <div className="space-y-4">
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || isLoading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Starting Game...' : 'Start Game'}
                </button>
                
                {!canStart && currentGame.gameState === GameState.WAITING_FOR_PLAYERS && (
                  <p className="text-sm text-gray-600 text-center">
                    Need at least 2 players to start
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Waiting for the host to start the game...
                </p>
                <div className="animate-pulse flex justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleLeaveGame}
                className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>

        {/* Game Instructions */}
        <div className="card mt-8 text-center">
          <h3 className="text-lg font-bold text-gray-700 mb-2">What happens next?</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mb-2">1</div>
              <p>Host starts the game</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mb-2">2</div>
              <p>Take turns adding words</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mb-2">3</div>
              <p>AI creates your story</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mb-2">4</div>
              <p>Share and enjoy!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}