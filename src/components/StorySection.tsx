'use client'

import { useEffect, useRef, useState } from 'react'
import { CompletedParagraph } from '@/types'

interface StorySectionProps {
  paragraph: CompletedParagraph
  index: number
  isActive: boolean
  onInView?: (index: number) => void
  players?: Array<{ id: string; username: string }>
}

export function StorySection({ paragraph, index, isActive, onInView, players = [] }: StorySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(paragraph.imageUrl)

  // Watch for imageUrl changes (when background generation completes)
  useEffect(() => {
    if (paragraph.imageUrl !== currentImageUrl) {
      setCurrentImageUrl(paragraph.imageUrl)
      setImageLoaded(false) // Reset to show loading state for new image
      setImageError(false) // Reset error state
    }
  }, [paragraph.imageUrl, currentImageUrl, index])

  const getPlayerColor = (playerUsername: string): { bg: string; border: string; text: string; dot: string } => {
    const playerIndex = players.findIndex(p => p.username === playerUsername)
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          onInView?.(index)
        }
      },
      { threshold: 0.5 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [index, onInView])

  const renderWordWithHighlight = (text: string, highlights: any[]) => {
    if (!highlights || highlights.length === 0) {
      return text
    }

    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex)
    
    let result = []
    let lastIndex = 0

    sortedHighlights.forEach((highlight, highlightIndex) => {
      if (highlight.startIndex > lastIndex) {
        result.push(text.substring(lastIndex, highlight.startIndex))
      }

      const playerColor = getPlayerColor(highlight.playerUsername)

      
      result.push(
        <span
          key={highlightIndex}
          className={`inline-flex flex-col items-center ${playerColor.bg} border ${playerColor.border} rounded-lg px-2 py-1 mx-1 shadow-sm hover:shadow-md transition-shadow cursor-help align-top`}
          style={{ verticalAlign: 'baseline' }}
          title={`${formatWordType(highlight.wordType || '')} contributed by ${highlight.playerUsername}`}
        >
          <span className={`font-bold ${playerColor.text} text-base`}>
            {highlight.word}
          </span>
          <span className={`text-xs ${playerColor.text} opacity-60 flex items-center space-x-1`}>
            <div className={`w-2 h-2 ${playerColor.dot} rounded-full`}></div>
            <span>{highlight.playerUsername} | {formatWordType(highlight.wordType || '')}</span>
          </span>
        </span>
      )

      lastIndex = highlight.endIndex
    })

    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex))
    }

    return result
  }

  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${isActive ? 'scale-105' : 'scale-100'}`}
    >
      <div className="card mb-8 overflow-hidden">
        <div className={`flex flex-col md:flex-row gap-6 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
          {/* Image */}
          <div className="flex-shrink-0 w-full md:w-1/2">
            <div className="relative">
              {paragraph.imageUrl ? (
                <div className={`transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                  <img
                    key={paragraph.imageUrl} // Force re-render when URL changes
                    src={paragraph.imageUrl}
                    alt={`Story illustration ${index + 1}`}
                    className="w-full rounded-lg shadow-md"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageError(true)
                      setImageLoaded(true) // Stop showing loading spinner
                    }}
                    loading="lazy"
                  />
                </div>
              ) : null}
              
              {!paragraph.imageUrl && (
                <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Generating AI image...</p>
                    <p className="text-gray-400 text-xs mt-1">This may take a moment</p>
                  </div>
                </div>
              )}
              
              {paragraph.imageUrl && !imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading image...</p>
                  </div>
                </div>
              )}
              
              {imageError && (
                <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <p className="text-gray-500 text-sm">Image generation failed</p>
                    <p className="text-gray-400 text-xs">Using fallback placeholder</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Text */}
          <div className="flex-1 w-full md:w-1/2">
            <div className="text-xl leading-loose text-gray-800" style={{ lineHeight: '2.5' }}>
              {renderWordWithHighlight(paragraph.text, paragraph.wordHighlights)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}