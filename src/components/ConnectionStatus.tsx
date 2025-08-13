'use client'

import { useGame } from '@/contexts/GameContext'

export function ConnectionStatus() {
  const { isConnected } = useGame()

  return (
    <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
      isConnected 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  )
}