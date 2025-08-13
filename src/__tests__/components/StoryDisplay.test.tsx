import { render, screen, fireEvent } from '@testing-library/react'
import { StoryDisplay } from '@/components/StoryDisplay'
import { Story, WordType } from '@/types'

describe('StoryDisplay', () => {
  const mockStory: Story = {
    id: 'story-1',
    title: 'Test Adventure',
    paragraphs: [
      {
        id: 'para-1',
        text: 'Once upon a time, there was a funny cat who loved to dance quickly.',
        imageUrl: null,
        wordHighlights: [
          {
            word: 'funny',
            playerUsername: 'Alice',
            startIndex: 30,
            endIndex: 35
          },
          {
            word: 'cat',
            playerUsername: 'Bob',
            startIndex: 36,
            endIndex: 39
          }
        ]
      },
      {
        id: 'para-2',
        text: 'The end of our amazing story!',
        imageUrl: null,
        wordHighlights: [
          {
            word: 'amazing',
            playerUsername: 'Alice',
            startIndex: 15,
            endIndex: 22
          }
        ]
      }
    ],
    playerContributions: [
      {
        playerId: 'player-1',
        playerUsername: 'Alice',
        wordsContributed: ['funny', 'amazing']
      },
      {
        playerId: 'player-2',
        playerUsername: 'Bob',
        wordsContributed: ['cat']
      }
    ],
    createdAt: new Date()
  }

  const mockProps = {
    story: mockStory,
    onCreateVideo: jest.fn(),
    onPlayAgain: jest.fn(),
    onShare: jest.fn(),
    isLoading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render story title and first paragraph', () => {
    render(<StoryDisplay {...mockProps} />)
    
    expect(screen.getByText('Test Adventure')).toBeInTheDocument()
    expect(screen.getByText(/Once upon a time/)).toBeInTheDocument()
    expect(screen.getByText('Paragraph 1 of 2')).toBeInTheDocument()
  })

  it('should highlight contributed words with player attribution', () => {
    render(<StoryDisplay {...mockProps} />)
    
    const funnyWord = screen.getByText('funny')
    const catWord = screen.getByText('cat')
    
    expect(funnyWord).toHaveClass('bg-yellow-200')
    expect(funnyWord).toHaveAttribute('title', 'Contributed by Alice')
    expect(catWord).toHaveClass('bg-yellow-200')
    expect(catWord).toHaveAttribute('title', 'Contributed by Bob')
  })

  it('should show word contributors for current paragraph', () => {
    render(<StoryDisplay {...mockProps} />)
    
    expect(screen.getByText('Words contributed in this paragraph:')).toBeInTheDocument()
    expect(screen.getByText('"funny" by Alice')).toBeInTheDocument()
    expect(screen.getByText('"cat" by Bob')).toBeInTheDocument()
  })

  it('should navigate between paragraphs', () => {
    render(<StoryDisplay {...mockProps} />)
    
    // Should start on first paragraph
    expect(screen.getByText(/Once upon a time/)).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeDisabled()
    
    // Navigate to next paragraph
    fireEvent.click(screen.getByText('Next →'))
    
    expect(screen.getByText(/The end of our amazing story/)).toBeInTheDocument()
    expect(screen.getByText('Paragraph 2 of 2')).toBeInTheDocument()
    
    // Navigate back
    fireEvent.click(screen.getByText('← Previous'))
    expect(screen.getByText(/Once upon a time/)).toBeInTheDocument()
  })

  it('should show finish button on last paragraph', () => {
    render(<StoryDisplay {...mockProps} />)
    
    // Navigate to last paragraph
    fireEvent.click(screen.getByText('Next →'))
    
    expect(screen.getByText('Finish →')).toBeInTheDocument()
  })

  it('should show full story when finish is clicked', () => {
    render(<StoryDisplay {...mockProps} />)
    
    // Navigate to last paragraph and finish
    fireEvent.click(screen.getByText('Next →'))
    fireEvent.click(screen.getByText('Finish →'))
    
    // Should show full story view
    expect(screen.getByText('Your completed Mad Libs story!')).toBeInTheDocument()
    expect(screen.getByText('Player Contributions')).toBeInTheDocument()
    
    // Should show all paragraphs
    expect(screen.getByText(/Once upon a time/)).toBeInTheDocument()
    expect(screen.getByText(/The end of our amazing story/)).toBeInTheDocument()
  })

  it('should skip to full story when skip link is clicked', () => {
    render(<StoryDisplay {...mockProps} />)
    
    fireEvent.click(screen.getByText('Skip to full story'))
    
    expect(screen.getByText('Your completed Mad Libs story!')).toBeInTheDocument()
  })

  it('should show player contributions in full story view', () => {
    render(<StoryDisplay {...mockProps} />)
    
    // Skip to full story
    fireEvent.click(screen.getByText('Skip to full story'))
    
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    
    // Check Alice's contributions
    const aliceSection = screen.getByText('Alice').closest('div')
    expect(aliceSection).toHaveTextContent('funny')
    expect(aliceSection).toHaveTextContent('amazing')
    
    // Check Bob's contributions
    const bobSection = screen.getByText('Bob').closest('div')
    expect(bobSection).toHaveTextContent('cat')
  })

  it('should call action handlers when buttons are clicked', () => {
    render(<StoryDisplay {...mockProps} />)
    
    // Skip to full story to see action buttons
    fireEvent.click(screen.getByText('Skip to full story'))
    
    fireEvent.click(screen.getByText('Create Video'))
    expect(mockProps.onCreateVideo).toHaveBeenCalled()
    
    fireEvent.click(screen.getByText('Share Story'))
    expect(mockProps.onShare).toHaveBeenCalled()
    
    fireEvent.click(screen.getByText('Play Again'))
    expect(mockProps.onPlayAgain).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    render(<StoryDisplay {...mockProps} isLoading={true} />)
    
    // Skip to full story
    fireEvent.click(screen.getByText('Skip to full story'))
    
    expect(screen.getByText('Creating Video...')).toBeInTheDocument()
    expect(screen.getByText('Creating Video...')).toBeDisabled()
  })

  it('should handle paragraphs without word highlights', () => {
    const storyWithoutHighlights = {
      ...mockStory,
      paragraphs: [
        {
          id: 'para-1',
          text: 'A simple paragraph without highlights.',
          imageUrl: null,
          wordHighlights: []
        }
      ]
    }

    render(<StoryDisplay {...mockProps} story={storyWithoutHighlights} />)
    
    expect(screen.getByText('A simple paragraph without highlights.')).toBeInTheDocument()
    expect(screen.queryByText('Words contributed in this paragraph:')).not.toBeInTheDocument()
  })

  it('should display images when available', () => {
    const storyWithImages = {
      ...mockStory,
      paragraphs: [
        {
          ...mockStory.paragraphs[0],
          imageUrl: 'https://example.com/image1.jpg'
        }
      ]
    }

    render(<StoryDisplay {...mockProps} story={storyWithImages} />)
    
    const image = screen.getByAltText('Story illustration 1')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg')
  })

  it('should allow direct paragraph navigation via dots', () => {
    render(<StoryDisplay {...mockProps} />)
    
    // Should have navigation dots
    const dots = screen.getAllByRole('button').filter(button => 
      button.className.includes('rounded-full')
    )
    expect(dots).toHaveLength(2)
    
    // Click second dot to go to second paragraph
    fireEvent.click(dots[1])
    
    expect(screen.getByText(/The end of our amazing story/)).toBeInTheDocument()
    expect(screen.getByText('Paragraph 2 of 2')).toBeInTheDocument()
  })
})