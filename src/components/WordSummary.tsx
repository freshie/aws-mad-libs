'use client'

import { WordSubmission, WordType } from '@/types'

interface WordSummaryProps {
  wordSubmissions: WordSubmission[]
  onContinue: () => void
  isLoading?: boolean
}

export function WordSummary({ wordSubmissions, onContinue, isLoading = false }: WordSummaryProps) {
  const getWordTypeDisplay = (type: WordType): string => {
    switch (type) {
      case WordType.NOUN: return 'Noun'
      case WordType.VERB: return 'Verb'
      case WordType.ADJECTIVE: return 'Adjective'
      case WordType.ADVERB: return 'Adverb'
      case WordType.PLURAL_NOUN: return 'Plural Noun'
      case WordType.PAST_TENSE_VERB: return 'Past Tense Verb'
      case WordType.COLOR: return 'Color'
      case WordType.NUMBER: return 'Number'
      case WordType.PLACE: return 'Place'
      case WordType.PERSON: return 'Person'
      default: return type
    }
  }

  const groupedSubmissions = wordSubmissions.reduce((acc, submission) => {
    if (!acc[submission.playerUsername]) {
      acc[submission.playerUsername] = []
    }
    acc[submission.playerUsername].push(submission)
    return acc
  }, {} as Record<string, WordSubmission[]>)

  return (
    <div className="game-container">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-4">
            All Words Collected! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Here's what everyone contributed to the story
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          {Object.entries(groupedSubmissions).map(([playerName, submissions]) => (
            <div key={playerName} className="card">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {playerName.charAt(0).toUpperCase()}
                </div>
                {playerName}'s Words ({submissions.length})
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div className="text-sm text-gray-500 mb-1">
                      {getWordTypeDisplay(submission.wordType)}
                    </div>
                    <div className="font-bold text-gray-800 text-lg">
                      "{submission.word}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="card text-center mb-8">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Collection Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary-600">
                {wordSubmissions.length}
              </div>
              <div className="text-sm text-primary-700">Total Words</div>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-secondary-600">
                {Object.keys(groupedSubmissions).length}
              </div>
              <div className="text-sm text-secondary-700">Contributors</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {new Set(wordSubmissions.map(w => w.wordType)).size}
              </div>
              <div className="text-sm text-green-700">Word Types</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(wordSubmissions.reduce((sum, w) => sum + w.word.length, 0) / wordSubmissions.length)}
              </div>
              <div className="text-sm text-purple-700">Avg Length</div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Your Story...' : 'Create Our Story! ✨'}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            The AI will now weave your words into an amazing story with pictures!
          </p>
        </div>
      </div>
    </div>
  )
}