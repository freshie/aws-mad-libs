'use client'

import { Story } from '@/types'
import { useState, useEffect } from 'react'
import { ImageGallery } from './ImageGallery'
import { StorySection } from './StorySection'
import { StoryLoadingState } from './StoryLoadingState'
import { StoryStats } from './StoryStats'


interface StoryDisplayProps {
  story: Story
  onCreateVideo?: () => void
  onPlayAgain?: () => void
  onShare?: () => void
  isLoading?: boolean
  players?: Array<{ id: string; username: string }>
}

export function StoryDisplay({ 
  story, 
  onCreateVideo, 
  onPlayAgain, 
  onShare, 
  isLoading = false,
  players = []
}: StoryDisplayProps) {
  const [currentParagraph, setCurrentParagraph] = useState(0)
  const [showFullStory, setShowFullStory] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)
  const [updatedStory, setUpdatedStory] = useState(story)

  // Update story when prop changes
  useEffect(() => {
    setUpdatedStory(story)
  }, [story])



  // Auto-advance slideshow
  useEffect(() => {
    if (!autoPlay || showFullStory) return

    const interval = setInterval(() => {
      setCurrentParagraph(prev => {
        if (prev >= updatedStory.paragraphs.length - 1) {
          setAutoPlay(false)
          return prev
        }
        return prev + 1
      })
    }, 5000) // 5 seconds per slide

    return () => clearInterval(interval)
  }, [autoPlay, showFullStory, updatedStory.paragraphs.length])

  const handleNextParagraph = () => {
    if (currentParagraph < updatedStory.paragraphs.length - 1) {
      setCurrentParagraph(currentParagraph + 1)
    } else {
      setShowFullStory(true)
    }
  }

  const handlePreviousParagraph = () => {
    if (currentParagraph > 0) {
      setCurrentParagraph(currentParagraph - 1)
    }
  }

  const renderWordWithHighlight = (text: string, highlights: any[]) => {
    if (!highlights || highlights.length === 0) {
      return text
    }

    // Sort highlights by start index
    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex)
    
    let result = []
    let lastIndex = 0

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.startIndex > lastIndex) {
        result.push(text.substring(lastIndex, highlight.startIndex))
      }

      // Add highlighted word
      result.push(
        <span
          key={index}
          className="bg-yellow-200 text-yellow-800 px-1 rounded font-bold cursor-help"
          title={`Contributed by ${highlight.playerUsername}`}
        >
          {highlight.word}
        </span>
      )

      lastIndex = highlight.endIndex
    })

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex))
    }

    return result
  }

  if (showFullStory) {
    return (
      <div className="game-container">
        <div className="max-w-4xl mx-auto">

          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-700 mb-2">
              {updatedStory.title}
            </h1>
            <p className="text-gray-600">Your completed Mad Libs story!</p>
          </div>

          {/* Scroll View */}
          <div className="space-y-8 mb-8">
            {updatedStory.paragraphs.map((paragraph, index) => (
              <StorySection
                key={paragraph.id}
                paragraph={paragraph}
                index={index}
                isActive={false}
                players={players}
              />
            ))}
          </div>

          {/* Story Video */}
          {updatedStory.videoUrl && (
            <div className="mb-8">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-primary-700 mb-2">
                  🎬 Your Story Video
                </h2>
                <p className="text-gray-600">Watch your Mad Libs story come to life!</p>
              </div>
              <div className="max-w-4xl mx-auto">
                {updatedStory.videoUrl.endsWith('.txt') ? (
                  // Mock video response - show informational message
                  <div className="relative aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg overflow-hidden shadow-lg flex items-center justify-center border-2 border-dashed border-primary-300">
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🎬</div>
                      <h3 className="text-xl font-bold text-primary-700 mb-2">Video Feature Preview</h3>
                      <p className="text-primary-600 mb-4">
                        Your story video is ready to be generated!
                      </p>
                      <p className="text-sm text-primary-500 mb-4">
                        Amazon Nova Reel video generation is not yet available in this region.
                        <br />
                        Once available, this will create an animated video of your story.
                      </p>
                      <a
                        href={updatedStory.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 underline"
                      >
                        <span>📄</span>
                        <span>View story details</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  // Real video response - show video player
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                    <video
                      controls
                      className="w-full h-full"
                      poster="/video-poster.jpg"
                    >
                      <source src={updatedStory.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Story Statistics */}
          <div className="mb-8">
            <StoryStats story={updatedStory} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onCreateVideo && (
              <button
                onClick={onCreateVideo}
                disabled={isLoading}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <span>🎬</span>
                <span>{isLoading ? 'Creating Video...' : 'Create Video'}</span>
              </button>
            )}
            
            {onShare && (
              <button
                onClick={onShare}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <span>📤</span>
                <span>Share Story</span>
              </button>
            )}
            
            {onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <span>🔄</span>
                <span>Play Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Slideshow view (paragraph-by-paragraph)
  const currentPara = updatedStory.paragraphs[currentParagraph]
  
  return (
    <div className="game-container">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            {updatedStory.title}
          </h1>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span>Paragraph {currentParagraph + 1} of {updatedStory.paragraphs.length}</span>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-2 py-1 rounded text-xs ${
                autoPlay 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {autoPlay ? '⏸️ Pause' : '▶️ Auto-play'}
            </button>
          </div>
        </div>

        <StorySection
          paragraph={currentPara}
          index={currentParagraph}
          isActive={true}
          players={players}
        />

        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handlePreviousParagraph}
            disabled={currentParagraph === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex space-x-1">
            {updatedStory.paragraphs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentParagraph(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentParagraph
                    ? 'bg-primary-500'
                    : index < currentParagraph
                    ? 'bg-primary-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextParagraph}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            {currentParagraph === updatedStory.paragraphs.length - 1 ? 'Finish' : 'Next'} →
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowFullStory(true)}
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Skip to full story
          </button>
        </div>
      </div>
    </div>
  )
}