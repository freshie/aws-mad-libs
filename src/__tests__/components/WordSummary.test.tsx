import { render, screen, fireEvent } from '@testing-library/react'
import { WordSummary } from '@/components/WordSummary'
import { WordSubmission, WordType } from '@/types'

describe('WordSummary', () => {
  const mockOnContinue = jest.fn()

  const mockWordSubmissions: WordSubmission[] = [
    {
      id: '1',
      wordBlankId: 'blank1',
      playerId: 'player1',
      playerUsername: 'Alice',
      word: 'cat',
      wordType: WordType.NOUN,
      submittedAt: new Date(),
    },
    {
      id: '2',
      wordBlankId: 'blank2',
      playerId: 'player2',
      playerUsername: 'Bob',
      word: 'quickly',
      wordType: WordType.ADVERB,
      submittedAt: new Date(),
    },
    {
      id: '3',
      wordBlankId: 'blank3',
      playerId: 'player1',
      playerUsername: 'Alice',
      word: 'red',
      wordType: WordType.ADJECTIVE,
      submittedAt: new Date(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render word summary with all submissions', () => {
    render(<WordSummary wordSubmissions={mockWordSubmissions} onContinue={mockOnContinue} />)
    
    expect(screen.getByText('All Words Collected! 🎉')).toBeInTheDocument()
    expect(screen.getByText("Here's what everyone contributed to the story")).toBeInTheDocument()
    
    // Check player sections
    expect(screen.getByText("Alice's Words (2)")).toBeInTheDocument()
    expect(screen.getByText("Bob's Words (1)")).toBeInTheDocument()
    
    // Check individual words
    expect(screen.getByText('"cat"')).toBeInTheDocument()
    expect(screen.getByText('"quickly"')).toBeInTheDocument()
    expect(screen.getByText('"red"')).toBeInTheDocument()
  })

  it('should display word types correctly', () => {
    render(<WordSummary wordSubmissions={mockWordSubmissions} onContinue={mockOnContinue} />)
    
    expect(screen.getByText('Noun')).toBeInTheDocument()
    expect(screen.getByText('Adverb')).toBeInTheDocument()
    expect(screen.getByText('Adjective')).toBeInTheDocument()
  })

  it('should show correct summary statistics', () => {
    render(<WordSummary wordSubmissions={mockWordSubmissions} onContinue={mockOnContinue} />)
    
    // Total words
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Total Words')).toBeInTheDocument()
    
    // Contributors
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Contributors')).toBeInTheDocument()
    
    // Word types (3 unique types)
    expect(screen.getByText('Word Types')).toBeInTheDocument()
    
    // Average length (should be calculated)
    expect(screen.getByText('Avg Length')).toBeInTheDocument()
  })

  it('should call onContinue when continue button is clicked', () => {
    render(<WordSummary wordSubmissions={mockWordSubmissions} onContinue={mockOnContinue} />)
    
    const continueButton = screen.getByText('Create Our Story! ✨')
    fireEvent.click(continueButton)
    
    expect(mockOnContinue).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    render(<WordSummary wordSubmissions={mockWordSubmissions} onContinue={mockOnContinue} isLoading={true} />)
    
    const continueButton = screen.getByText('Creating Your Story...')
    expect(continueButton).toBeDisabled()
  })

  it('should handle empty submissions', () => {
    render(<WordSummary wordSubmissions={[]} onContinue={mockOnContinue} />)
    
    expect(screen.getByText('All Words Collected! 🎉')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // Total words
    expect(screen.getByText('Contributors')).toBeInTheDocument()
  })

  it('should group submissions by player correctly', () => {
    const submissions = [
      ...mockWordSubmissions,
      {
        id: '4',
        wordBlankId: 'blank4',
        playerId: 'player3',
        playerUsername: 'Charlie',
        word: 'jumped',
        wordType: WordType.PAST_TENSE_VERB,
        submittedAt: new Date(),
      },
    ]

    render(<WordSummary wordSubmissions={submissions} onContinue={mockOnContinue} />)
    
    expect(screen.getByText("Alice's Words (2)")).toBeInTheDocument()
    expect(screen.getByText("Bob's Words (1)")).toBeInTheDocument()
    expect(screen.getByText("Charlie's Words (1)")).toBeInTheDocument()
  })

  it('should display player initials in avatars', () => {
    render(<WordSummary wordSubmissions={mockWordSubmissions} onContinue={mockOnContinue} />)
    
    // Check for player initials (first letter of username)
    expect(screen.getByText('A')).toBeInTheDocument() // Alice
    expect(screen.getByText('B')).toBeInTheDocument() // Bob
  })

  it('should calculate average word length correctly', () => {
    const submissions = [
      {
        id: '1',
        wordBlankId: 'blank1',
        playerId: 'player1',
        playerUsername: 'Test',
        word: 'cat', // 3 letters
        wordType: WordType.NOUN,
        submittedAt: new Date(),
      },
      {
        id: '2',
        wordBlankId: 'blank2',
        playerId: 'player1',
        playerUsername: 'Test',
        word: 'elephant', // 8 letters
        wordType: WordType.NOUN,
        submittedAt: new Date(),
      },
    ]

    render(<WordSummary wordSubmissions={submissions} onContinue={mockOnContinue} />)
    
    // Average should be (3 + 8) / 2 = 5.5, rounded to 6
    expect(screen.getByText('6')).toBeInTheDocument()
  })
})