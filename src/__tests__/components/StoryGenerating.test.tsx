import { render, screen, act } from '@testing-library/react'
import { StoryGenerating } from '@/components/StoryGenerating'

// Mock timers for testing
jest.useFakeTimers()

describe('StoryGenerating', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should render initial loading state', () => {
    render(<StoryGenerating totalParagraphs={3} />)
    
    expect(screen.getByText('Creating Your Story')).toBeInTheDocument()
    expect(screen.getByText('Preparing your story...')).toBeInTheDocument()
    expect(screen.getByText('✨')).toBeInTheDocument()
  })

  it('should show progress steps', () => {
    render(<StoryGenerating totalParagraphs={3} />)
    
    expect(screen.getByText('Words collected')).toBeInTheDocument()
    expect(screen.getByText('Generating story')).toBeInTheDocument()
    expect(screen.getByText('Creating images')).toBeInTheDocument()
  })

  it('should display fun facts about the process', () => {
    render(<StoryGenerating totalParagraphs={4} />)
    
    expect(screen.getByText('Did you know?')).toBeInTheDocument()
    expect(screen.getByText(/We're creating 4 unique illustrations/)).toBeInTheDocument()
    expect(screen.getByText(/Our AI is carefully placing each of your words/)).toBeInTheDocument()
    expect(screen.getByText(/Each image is generated specifically/)).toBeInTheDocument()
    expect(screen.getByText(/Your story will be ready for sharing/)).toBeInTheDocument()
  })

  it('should cycle through different step messages', () => {
    render(<StoryGenerating totalParagraphs={3} />)
    
    // Initial message
    expect(screen.getByText('Preparing your story...')).toBeInTheDocument()
    
    // Advance time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    
    expect(screen.getByText('Weaving your words together...')).toBeInTheDocument()
    
    // Advance another 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    
    expect(screen.getByText('Creating magical illustrations...')).toBeInTheDocument()
    
    // Advance another 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    
    expect(screen.getByText('Adding finishing touches...')).toBeInTheDocument()
    
    // Advance another 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    
    expect(screen.getByText('Almost ready!')).toBeInTheDocument()
    
    // Should cycle back to beginning
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    
    expect(screen.getByText('Preparing your story...')).toBeInTheDocument()
  })

  it('should show estimated time', () => {
    render(<StoryGenerating totalParagraphs={3} />)
    
    expect(screen.getByText(/This usually takes 30-60 seconds/)).toBeInTheDocument()
  })

  it('should handle different paragraph counts', () => {
    const { rerender } = render(<StoryGenerating totalParagraphs={2} />)
    
    expect(screen.getByText(/We're creating 2 unique illustrations/)).toBeInTheDocument()
    
    rerender(<StoryGenerating totalParagraphs={5} />)
    
    expect(screen.getByText(/We're creating 5 unique illustrations/)).toBeInTheDocument()
  })

  it('should have animated elements', () => {
    render(<StoryGenerating totalParagraphs={3} />)
    
    // Check for animated elements (classes that indicate animation)
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })

  it('should clean up timer on unmount', () => {
    const { unmount } = render(<StoryGenerating totalParagraphs={3} />)
    
    // Verify timer is running
    expect(jest.getTimerCount()).toBe(1)
    
    unmount()
    
    // Timer should be cleaned up
    expect(jest.getTimerCount()).toBe(0)
  })
})