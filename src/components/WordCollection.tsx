'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/contexts/GameContext'
import { WordPrompt } from './WordPrompt'
import { WordSummary } from './WordSummary'
import { StoryGenerating } from './StoryGenerating'
import { GameState, WordType } from '@/types'
import { getGameManager } from '@/services'

export function WordCollection() {
  const { currentGame, currentPlayer, submitWord, isLoading, error } = useGame()
  const [currentPrompt, setCurrentPrompt] = useState<{ wordType: WordType; position: number } | null>(null)
  const [progress, setProgress] = useState({ collected: 0, total: 0, byPlayer: {} as Record<string, number> })

  useEffect(() => {
    if (!currentGame || !currentPlayer) return

    // Get current word prompt for this player
    const gameManager = getGameManager()
    const prompt = gameManager.getCurrentWordPrompt(currentGame.roomCode, currentPlayer.id)
    setCurrentPrompt(prompt)

    // Get collection progress
    const progressData = gameManager.getWordCollectionProgress(currentGame.roomCode)
    setProgress(progressData)
  }, [currentGame, currentPlayer, currentGame?.wordSubmissions])

  if (!currentGame || !currentPlayer) {
    return null
  }

  // Show story generating screen if story is being created
  if (currentGame.gameState === GameState.GENERATING_STORY && progress.collected >= progress.total) {
    return (
      <StoryGenerating 
        totalParagraphs={currentGame.storyTemplate?.paragraphs.length || 3}
      />
    )
  }

  // Show word summary if all words are collected but story generation hasn't started
  if (progress.collected >= progress.total) {
    return (
      <WordSummary
        wordSubmissions={currentGame.wordSubmissions}
        onContinue={async () => {
          try {
            const gameManager = getGameManager()
            await gameManager.generateStory(currentGame.id)
          } catch (error) {
            console.error('Failed to generate story:', error)
          }
        }}
        isLoading={isLoading}
      />
    )
  }

  // Show waiting screen if it's not this player's turn
  if (!currentPrompt) {
    return (
      <div className="game-container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Waiting for Other Players...
            </h2>
            
            <div className="mb-6">
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot" style={{ animationDelay: '0.1s' }}></div>
                <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-700 mb-2">Collection Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.collected / progress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {progress.collected} of {progress.total} words collected
              </p>
            </div>

            {/* Show which players still need to submit words */}
            <div className="space-y-2">
              {currentGame.players.filter(p => p.isConnected).map(player => {
                const playerProgress = progress.byPlayer[player.id] || 0
                const expectedWords = Math.ceil(progress.total / currentGame.players.filter(p => p.isConnected).length)
                const isComplete = playerProgress >= expectedWords
                
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      isComplete ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    <span className="font-medium">{player.username}</span>
                    <span className="text-sm">
                      {isComplete ? '✓ Complete' : `${playerProgress} words submitted`}
                    </span>
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show word prompt for current player
  return (
    <div className="game-container">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="text-center mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h1 className="text-2xl font-bold text-primary-700 mb-2">
              Word Collection
            </h1>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(progress.collected / progress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {progress.collected} of {progress.total} words collected
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <WordPrompt
          wordType={currentPrompt.wordType}
          position={currentPrompt.position}
          totalWords={Math.ceil(progress.total / currentGame.players.filter(p => p.isConnected).length)}
          playerName={currentPlayer.username}
          onSubmit={submitWord}
          isLoading={isLoading}
          usedWords={currentGame.wordSubmissions.map(submission => submission.word)}
        />
      </div>
    </div>
  )
}