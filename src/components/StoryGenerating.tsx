'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface StoryGeneratingProps {
  totalParagraphs: number
  loadingMessage?: string
}

export function StoryGenerating({ totalParagraphs, loadingMessage }: StoryGeneratingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [currentStepText, setCurrentStepText] = useState('Preparing your story...')

  const steps = [
    'Preparing your story...',
    'Weaving your words together...',
    'Creating magical illustrations...',
    'Adding finishing touches...',
    'Almost ready!'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = (prev + 1) % steps.length
        setCurrentStepText(steps[next])
        return next
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="game-container">
      <div className="max-w-2xl mx-auto text-center">
        <div className="card">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <LoadingSpinner size="lg" className="w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-primary-700 mb-4">
              Creating Your Story
            </h2>
            
            <p className="text-xl text-gray-600 mb-8">
              {loadingMessage || currentStepText}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Words collected</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-primary-700">Generating story</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-purple-700">Creating images</span>
              </div>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-700 mb-3">Did you know?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>🎨 We're creating {totalParagraphs} unique illustrations for your story</p>
              <p>🤖 Our AI is carefully placing each of your words for maximum hilarity</p>
              <p>✨ Each image is generated specifically for your story content</p>
              <p>🎬 Your story will be ready for sharing and video creation</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs text-gray-500">
              This usually takes 30-60 seconds depending on story length
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}