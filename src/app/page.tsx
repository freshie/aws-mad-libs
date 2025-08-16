'use client'

import { useState } from 'react'
import { useGame, GameProvider } from '@/contexts/GameContext'
import { GameLobby } from '@/components/GameLobby'
import { JoinGameModal } from '@/components/JoinGameModal'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { LocalGameProvider } from '@/contexts/LocalGameContext'
import { LocalGameFlow } from '@/components/LocalGameFlow'

type GameMode = 'menu' | 'online' | 'local'

function OnlineGameContent() {
  const { currentGame, createGame, isLoading, error } = useGame()
  const [showJoinModal, setShowJoinModal] = useState(false)

  const handleHostGame = async () => {
    await createGame()
  }

  const handleJoinGame = () => {
    setShowJoinModal(true)
  }

  // If we're in an online game, show the game lobby
  if (currentGame) {
    return <GameLobby />
  }

  return (
    <>
      <ConnectionStatus />
      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center">
          {error}
        </div>
      )}
      <div className="flex space-x-6">
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-primary-600 mb-4">🌐 Host Online</h2>
          <p className="text-gray-600 mb-6">
            Start a new Mad Libs party and invite your friends to join remotely!
          </p>
          <button 
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleHostGame}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Game...' : 'Host Game'}
          </button>
        </div>
        
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-secondary-600 mb-4">🔗 Join Online</h2>
          <p className="text-gray-600 mb-6">
            Enter a room code to join an existing online game!
          </p>
          <button 
            className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleJoinGame}
            disabled={isLoading}
          >
            Join Game
          </button>
        </div>
      </div>
      {showJoinModal && (
        <JoinGameModal onClose={() => setShowJoinModal(false)} />
      )}
    </>
  )
}

export default function HomePage() {
  const [gameMode, setGameMode] = useState<GameMode>('menu')

  const handleLocalPlay = () => {
    setGameMode('local')
  }

  const handleOnlinePlay = () => {
    // Show coming soon message instead of navigating to online mode
    alert('🚧 Online multiplayer mode is coming soon! 🚧\n\nFor now, enjoy the Local Play mode with friends on the same device.')
  }

  const handleBackToMenu = () => {
    setGameMode('menu')
  }

  // Local play mode
  if (gameMode === 'local') {
    return (
      <LocalGameProvider>
        <LocalGameFlow onBack={handleBackToMenu} />
      </LocalGameProvider>
    )
  }

  // Online play mode
  if (gameMode === 'online') {
    return (
      <GameProvider>
        <OnlineGameContent />
        <div className="fixed bottom-4 left-4">
          <button
            onClick={handleBackToMenu}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← Back to Menu
          </button>
        </div>
      </GameProvider>
    )
  }

  return (
    <div className="game-container">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-700 mb-4">
            AI Mad Libs
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Create hilarious stories with friends using AI magic! ✨
          </p>
        </div>


        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">🏠 Local Play</h2>
            <p className="text-gray-600 mb-6">
              Play with friends on the same device. Perfect for testing and offline fun!
            </p>
            <button 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full"
              onClick={handleLocalPlay}
            >
              Start Local Game
            </button>
          </div>

          <div className="card text-center bg-blue-50 border-2 border-dashed border-blue-300">
            <h2 className="text-2xl font-bold text-primary-600 mb-4">🌐 Online Play</h2>
            <p className="text-gray-600 mb-4">
              Host or join online games with friends on different devices!
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 font-medium">🚧 Coming Soon! 🚧</p>
            </div>
            <button 
              className="bg-gray-400 text-white font-bold py-3 px-6 rounded-lg w-full cursor-not-allowed opacity-75"
              onClick={handleOnlinePlay}
            >
              Online Mode (Preview)
            </button>
          </div>
          
          <div className="card text-center bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-600 mb-4">ℹ️ About</h2>
            <p className="text-gray-600 mb-6">
              Create hilarious Mad Libs stories with AI-generated content and images!
            </p>
            <div className="text-sm text-gray-500">
              <p>• AI creates unique stories</p>
              <p>• Images for each paragraph</p>
              <p>• Player word attribution</p>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <div className="card max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-700 mb-2">How to Play (Local Mode)</h3>
            <ol className="text-left text-gray-600 space-y-1">
              <li>1. Start a local game</li>
              <li>2. Add players on the same device</li>
              <li>3. Take turns entering words</li>
              <li>4. AI creates your story with images</li>
              <li>5. Share your hilarious stories!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}