'use client'

import { useGame } from '@/contexts/GameContext'

interface GameHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
}

export function GameHeader({ title, subtitle, showBackButton = false, onBack }: GameHeaderProps) {
  const { currentGame } = useGame()

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <div>
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>

          {currentGame && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-800">
                  Room: {currentGame.roomCode}
                </div>
                <div className="text-xs text-gray-600">
                  {currentGame.players.filter(p => p.isConnected).length} players
                </div>
              </div>
              
              <div className="sm:hidden">
                <div className="text-sm font-mono font-bold text-primary-600">
                  {currentGame.roomCode}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}