'use client'

interface StoryLoadingStateProps {
  message?: string
  showProgress?: boolean
  progress?: number
  error?: string
  onRetry?: () => void
}

export function StoryLoadingState({ 
  message = 'Loading your story...', 
  showProgress = false, 
  progress = 0,
  error,
  onRetry 
}: StoryLoadingStateProps) {
  if (error) {
    return (
      <div className="game-container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn-primary"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="max-w-2xl mx-auto text-center">
        <div className="card">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="animate-spin w-full h-full border-4 border-primary-500 border-t-transparent rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {message}
            </h2>
            
            {showProgress && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              ✨ Creating your personalized story experience
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}