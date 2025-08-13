'use client'

import { Story } from '@/types'

interface StoryStatsProps {
  story: Story
}

export function StoryStats({ story }: StoryStatsProps) {
  const totalWords = story.paragraphs.reduce((sum, p) => sum + p.text.split(' ').length, 0)
  const totalCharacters = story.paragraphs.reduce((sum, p) => sum + p.text.length, 0)
  const totalHighlights = story.paragraphs.reduce((sum, p) => sum + p.wordHighlights.length, 0)
  const uniqueContributors = new Set(story.playerContributions.map(c => c.playerId)).size
  const averageWordsPerParagraph = Math.round(totalWords / story.paragraphs.length)

  const getPlayerColor = (playerId: string): { dot: string } => {
    const playerIndex = story.playerContributions.findIndex(p => p.playerId === playerId)
    const colors = [
      { dot: 'bg-blue-500' },
      { dot: 'bg-green-500' },
      { dot: 'bg-purple-500' },
      { dot: 'bg-pink-500' },
      { dot: 'bg-yellow-500' },
      { dot: 'bg-indigo-500' },
      { dot: 'bg-red-500' },
      { dot: 'bg-teal-500' }
    ]
    
    return colors[playerIndex % colors.length] || colors[0]
  }
  
  // Calculate reading time (average 200 words per minute)
  const readingTimeMinutes = Math.ceil(totalWords / 200)
  
  // Find most active contributor
  const mostActiveContributor = story.playerContributions.reduce((prev, current) => 
    current.wordsContributed.length > prev.wordsContributed.length ? current : prev
  )

  const stats = [
    {
      label: 'Total Words',
      value: totalWords.toLocaleString(),
      icon: '📝',
      color: 'bg-blue-50 text-blue-700'
    },
    {
      label: 'Characters',
      value: totalCharacters.toLocaleString(),
      icon: '🔤',
      color: 'bg-green-50 text-green-700'
    },
    {
      label: 'Player Words',
      value: totalHighlights,
      icon: '✨',
      color: 'bg-yellow-50 text-yellow-700'
    },
    {
      label: 'Contributors',
      value: uniqueContributors,
      icon: '👥',
      color: 'bg-purple-50 text-purple-700'
    },
    {
      label: 'Paragraphs',
      value: story.paragraphs.length,
      icon: '📄',
      color: 'bg-indigo-50 text-indigo-700'
    },
    {
      label: 'Reading Time',
      value: `${readingTimeMinutes} min`,
      icon: '⏱️',
      color: 'bg-pink-50 text-pink-700'
    }
  ]

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-700 mb-6 text-center">Story Statistics</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-lg p-4 text-center`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Additional insights */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Most Active Player:</span>
          <span className="font-medium text-gray-800">
            {mostActiveContributor.playerUsername} ({mostActiveContributor.wordsContributed.length} words)
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Average Words per Paragraph:</span>
          <span className="font-medium text-gray-800">{averageWordsPerParagraph}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Story Created:</span>
          <span className="font-medium text-gray-800">
            {new Date(story.createdAt).toLocaleDateString()} at {new Date(story.createdAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Word frequency */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="font-medium text-gray-700 mb-3">Player Contributions</h4>
        <div className="space-y-2">
          {story.playerContributions.map((contribution) => (
            <div key={contribution.playerId} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${getPlayerColor(contribution.playerId).dot}`}></div>
                <span className="font-medium text-gray-800">{contribution.playerUsername}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {contribution.wordsContributed.map((word, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}