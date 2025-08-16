'use client'

import { useState, useCallback } from 'react'
import { useLocalGame } from '@/contexts/LocalGameContext'
import { LocalPlaySetup } from './LocalPlaySetup'
import { WordPrompt } from './WordPrompt'
import { StoryGenerating } from './StoryGenerating'
import { StoryDisplay } from './StoryDisplay'
import { ThemeSelector } from './ThemeSelector'
import { GameState } from '@/types'

interface LocalGameFlowProps {
  onBack: () => void
}

export function LocalGameFlow({ onBack }: LocalGameFlowProps) {
  const [showGameInfo, setShowGameInfo] = useState(false)
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false)
  
  const { 
    currentGame, 
    currentPlayer, 
    isLoading, 
    loadingMessage,
    error, 
    startGame, 
    startThemeSelection,
    completeThemeSelection,
    isSelectingTheme,
    submitWord, 
    resetGame,
    getCurrentWordPrompt 
  } = useLocalGame()

  // Theme completion callback - must be at top level to avoid hook order issues
  const handleThemeComplete = useCallback((selectedTheme: string, aiTemplate?: any) => {
    if (currentGame?.players) {
      completeThemeSelection(selectedTheme, currentGame.players, aiTemplate)
    }
  }, [completeThemeSelection, currentGame?.players])

  const getThemeIcon = (theme?: string): string => {
    const themeIcons: Record<string, string> = {
      adventure: '⚔️',
      school: '🏫',
      space: '🚀',
      food: '🍕',
      animals: '🦁',
      vacation: '🏖️',
      superhero: '🦸',
      mystery: '🔍',
      pirates: '🏴‍☠️',
      work: '💼',
      sports: '⚽',
      music: '🎸'
    }
    return themeIcons[theme || ''] || '🎲'
  }

  const formatWordType = (wordType: string): string => {
    switch (wordType) {
      case 'noun': return 'Noun'
      case 'verb': return 'Verb'
      case 'adjective': return 'Adjective'
      case 'adverb': return 'Adverb'
      case 'plural_noun': return 'Plural Noun'
      case 'past_tense_verb': return 'Past Tense Verb'
      case 'color': return 'Color'
      case 'number': return 'Number'
      case 'place': return 'Place'
      case 'person': return 'Person'
      default: return wordType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getPlayerColor = (playerId: string): { bg: string; border: string; text: string; dot: string } => {
    if (!currentGame) return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', dot: 'bg-gray-400' }
    
    const playerIndex = currentGame.players.findIndex(p => p.id === playerId)
    const colors = [
      { bg: 'bg-gradient-to-r from-blue-100 to-blue-200', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500' },
      { bg: 'bg-gradient-to-r from-green-100 to-green-200', border: 'border-green-300', text: 'text-green-800', dot: 'bg-green-500' },
      { bg: 'bg-gradient-to-r from-purple-100 to-purple-200', border: 'border-purple-300', text: 'text-purple-800', dot: 'bg-purple-500' },
      { bg: 'bg-gradient-to-r from-pink-100 to-pink-200', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-500' },
      { bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200', border: 'border-yellow-300', text: 'text-yellow-800', dot: 'bg-yellow-500' },
      { bg: 'bg-gradient-to-r from-indigo-100 to-indigo-200', border: 'border-indigo-300', text: 'text-indigo-800', dot: 'bg-indigo-500' },
      { bg: 'bg-gradient-to-r from-red-100 to-red-200', border: 'border-red-300', text: 'text-red-800', dot: 'bg-red-500' },
      { bg: 'bg-gradient-to-r from-teal-100 to-teal-200', border: 'border-teal-300', text: 'text-teal-800', dot: 'bg-teal-500' }
    ]
    
    return colors[playerIndex % colors.length] || colors[0]
  }

  // Setup phase - choose players
  if (!currentGame) {
    return (
      <LocalPlaySetup 
        onStartGame={startThemeSelection}
        onBack={onBack}
      />
    )
  }

  // Theme selection phase
  if (isSelectingTheme) {
    const themes = ['adventure', 'school', 'space', 'food', 'animals', 'vacation', 'superhero', 'mystery', 'pirates', 'work', 'sports', 'music']
    
    return (
      <ThemeSelector
        themes={themes}
        onComplete={handleThemeComplete}
        isVisible={true}
        playerCount={currentGame?.players.length || 0}
      />
    )
  }

  // Word collection phase
  if (currentGame.gameState === GameState.COLLECTING_WORDS) {
    const prompt = getCurrentWordPrompt()
    
    if (!prompt) {
      // All words collected, show story if available, otherwise show generating
      if (currentGame.completedStory) {
        return (
          <StoryDisplay
            story={currentGame.completedStory}
            onPlayAgain={() => {
              resetGame()
            }}
            onShare={() => {
              // Simple share - copy to clipboard
              const storyText = currentGame.completedStory!.paragraphs
                .map(p => p.text)
                .join('\n\n')
              
              navigator.clipboard.writeText(storyText).then(() => {
                alert('Story copied to clipboard!')
              })
            }}
            isLoading={isLoading}
          />
        )
      }
      
      // All words collected, generate story immediately
      return (
        <StoryGenerating 
          totalParagraphs={currentGame.storyTemplate?.paragraphs.length || 3}
          loadingMessage={loadingMessage}
        />
      )
    }

    return (
      <div className="game-container">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="text-center mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h1 className="text-2xl font-bold text-primary-700 mb-2">
                Local Mad Libs Game
              </h1>
              {currentGame.storyTemplate && (
                <div className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-2">
                  <span className="text-lg">
                    {getThemeIcon(currentGame.storyTemplate.theme)}
                  </span>
                  <span>
                    {currentGame.storyTemplate.theme?.charAt(0).toUpperCase() + currentGame.storyTemplate.theme?.slice(1)} Story
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                Word {currentGame.wordSubmissions.length + 1} of {currentGame.storyTemplate?.totalWordBlanks || 0}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((currentGame.wordSubmissions.length) / (currentGame.storyTemplate?.totalWordBlanks || 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          <WordPrompt
            wordType={prompt.wordType}
            position={prompt.position}
            totalWords={currentGame.storyTemplate?.totalWordBlanks || 0}
            playerName={prompt.playerName}
            onSubmit={submitWord}
            isLoading={isLoading}
            usedWords={currentGame.wordSubmissions.map(submission => submission.word)}
          />

          {/* Players & Words Collection */}
          <div className="mt-8 card">
            
            <div className="space-y-4">
              {currentGame.players.map((player) => {
                const playerColor = getPlayerColor(player.id)
                const isCurrentPlayer = player.id === currentPlayer?.id
                const playerWords = currentGame.wordSubmissions.filter(submission => submission.playerId === player.id)
                
                return (
                  <div
                    key={player.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isCurrentPlayer
                        ? `${playerColor.bg} ${playerColor.border} ring-2 ring-offset-1 ring-primary-400`
                        : `${playerColor.bg} ${playerColor.border} opacity-60`
                    }`}
                  >
                    {/* Player Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 ${playerColor.dot} rounded-full`}></div>
                        <span className={`font-bold text-lg ${playerColor.text}`}>
                          {player.username}
                        </span>
                        {isCurrentPlayer && (
                          <span className="bg-white bg-opacity-50 text-xs px-2 py-1 rounded-full font-medium">
                            Your Turn
                          </span>
                        )}
                      </div>
                      <span className={`text-sm ${playerColor.text} opacity-75`}>
                        {playerWords.length} words
                      </span>
                    </div>
                    
                    {/* Player's Words */}
                    {playerWords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {playerWords.map((submission) => (
                          <div
                            key={submission.id}
                            className="bg-white bg-opacity-50 border border-white border-opacity-30 rounded-lg px-3 py-2 shadow-sm"
                          >
                            <div className="text-center">
                              <div className={`font-bold ${playerColor.text} text-base mb-1`}>
                                {submission.word}
                              </div>
                              <div className={`text-xs ${playerColor.text} opacity-75`}>
                                {formatWordType(submission.wordType)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-sm ${playerColor.text} opacity-60 italic`}>
                        No words submitted yet
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Game Controls */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowEndGameConfirm(true)}
                className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg border border-red-300 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                End Game
              </button>
              
              <button
                onClick={() => setShowGameInfo(true)}
                className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg border border-blue-300 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Game Info
              </button>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                Need help? The game will automatically continue once all words are collected.
              </p>
            </div>
          </div>

          {/* Game Info Modal */}
          {showGameInfo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Game Progress</h3>
                  <button
                    onClick={() => setShowGameInfo(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getThemeIcon(currentGame.storyTemplate?.theme)}</span>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {currentGame.storyTemplate?.theme ? (currentGame.storyTemplate.theme.charAt(0).toUpperCase() + currentGame.storyTemplate.theme.slice(1)) : 'Unknown'} Story
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentGame.storyTemplate?.title}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Words Collected</span>
                      <span className="text-sm font-bold text-primary-600">
                        {currentGame.wordSubmissions.length} / {currentGame.storyTemplate?.totalWordBlanks || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((currentGame.wordSubmissions.length) / (currentGame.storyTemplate?.totalWordBlanks || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Players</div>
                    <div className="space-y-2">
                      {currentGame.players.map((player) => {
                        const playerWords = currentGame.wordSubmissions.filter(s => s.playerId === player.id)
                        return (
                          <div key={player.id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-800">{player.username}</span>
                            <span className="text-sm font-medium text-gray-600">
                              {playerWords.length} words
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowGameInfo(false)}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Continue Playing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* End Game Confirmation Modal */}
          {showEndGameConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">End Game?</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to end this game? All progress will be lost and you'll return to the main menu.
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        Progress: {currentGame.wordSubmissions.length} / {currentGame.storyTemplate?.totalWordBlanks || 0} words collected
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEndGameConfirm(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Keep Playing
                    </button>
                    <button
                      onClick={() => {
                        setShowEndGameConfirm(false)
                        resetGame()
                      }}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      End Game
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }



  // Story display phase
  if (currentGame.gameState === GameState.DISPLAYING_STORY && currentGame.completedStory) {
    return (
      <StoryDisplay
        story={currentGame.completedStory}
        players={currentGame.players}
        onPlayAgain={() => {
          resetGame()
        }}
        onShare={() => {
          // Simple share - copy to clipboard
          const storyText = currentGame.completedStory!.paragraphs
            .map(p => p.text)
            .join('\n\n')
          
          navigator.clipboard.writeText(storyText).then(() => {
            alert('Story copied to clipboard!')
          })
        }}
        isLoading={isLoading}
      />
    )
  }

  return null
}