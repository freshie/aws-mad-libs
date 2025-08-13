import { render, screen } from '@testing-library/react'
import { StoryStats } from '@/components/StoryStats'
import { Story } from '@/types'

describe('StoryStats', () => {
  const mockStory: Story = {
    id: 'story-1',
    title: 'Test Adventure',
    paragraphs: [
      {
        id: 'para-1',
        text: 'Once upon a time there was a funny cat.',
        imageUrl: null,
        wordHighlights: [
          { word: 'funny', playerUsername: 'Alice', startIndex: 30, endIndex: 35 },
          { word: 'cat', playerUsername: 'Bob', startIndex: 36, endIndex: 39 }
        ]
      },
      {
        id: 'para-2',
        text: 'The cat was very happy and danced quickly.',
        imageUrl: null,
        wordHighlights: [
          { word: 'happy', playerUsername: 'Alice', startIndex: 13, endIndex: 18 },
          { word: 'quickly', playerUsername: 'Charlie', startIndex: 30, endIndex: 37 }
        ]
      }
    ],
    playerContributions: [
      {
        playerId: 'player-1',
        playerUsername: 'Alice',
        wordsContributed: ['funny', 'happy']
      },
      {
        playerId: 'player-2',
        playerUsername: 'Bob',
        wordsContributed: ['cat']
      },
      {
        playerId: 'player-3',
        playerUsername: 'Charlie',
        wordsContributed: ['quickly']
      }
    ],
    createdAt: new Date('2023-01-01T12:00:00Z')
  }

  it('should display basic story statistics', () => {
    render(<StoryStats story={mockStory} />)
    
    expect(screen.getByText('Story Statistics')).toBeInTheDocument()
    
    // Check for stat values
    expect(screen.getByText('16')).toBeInTheDocument() // Total words
    expect(screen.getByText('4')).toBeInTheDocument() // Player words (highlights)
    expect(screen.getByText('3')).toBeInTheDocument() // Contributors
    expect(screen.getByText('2')).toBeInTheDocument() // Paragraphs
    expect(screen.getByText('1 min')).toBeInTheDocument() // Reading time
  })

  it('should display stat labels and icons', () => {
    render(<StoryStats story={mockStory} />)
    
    expect(screen.getByText('Total Words')).toBeInTheDocument()
    expect(screen.getByText('Characters')).toBeInTheDocument()
    expect(screen.getByText('Player Words')).toBeInTheDocument()
    expect(screen.getByText('Contributors')).toBeInTheDocument()
    expect(screen.getByText('Paragraphs')).toBeInTheDocument()
    expect(screen.getByText('Reading Time')).toBeInTheDocument()
    
    // Check for emoji icons
    expect(screen.getByText('📝')).toBeInTheDocument()
    expect(screen.getByText('🔤')).toBeInTheDocument()
    expect(screen.getByText('✨')).toBeInTheDocument()
    expect(screen.getByText('👥')).toBeInTheDocument()
    expect(screen.getByText('📄')).toBeInTheDocument()
    expect(screen.getByText('⏱️')).toBeInTheDocument()
  })

  it('should identify most active contributor', () => {
    render(<StoryStats story={mockStory} />)
    
    expect(screen.getByText('Most Active Player:')).toBeInTheDocument()
    expect(screen.getByText('Alice (2 words)')).toBeInTheDocument()
  })

  it('should display average words per paragraph', () => {
    render(<StoryStats story={mockStory} />)
    
    expect(screen.getByText('Average Words per Paragraph:')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument() // 16 words / 2 paragraphs = 8
  })

  it('should display creation date and time', () => {
    render(<StoryStats story={mockStory} />)
    
    expect(screen.getByText('Story Created:')).toBeInTheDocument()
    // Date format may vary by locale, so just check that some date text is present
    expect(screen.getByText(/1\/1\/2023|2023-01-01/)).toBeInTheDocument()
  })

  it('should display player contributions with avatars', () => {
    render(<StoryStats story={mockStory} />)
    
    expect(screen.getByText('Player Contributions')).toBeInTheDocument()
    
    // Check for player names
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    
    // Check for player initials in avatars
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    
    // Check for contributed words
    expect(screen.getByText('funny')).toBeInTheDocument()
    expect(screen.getByText('happy')).toBeInTheDocument()
    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('quickly')).toBeInTheDocument()
  })

  it('should handle large numbers with locale formatting', () => {
    const largeStory = {
      ...mockStory,
      paragraphs: Array(100).fill(mockStory.paragraphs[0]).map((p, i) => ({
        ...p,
        id: `para-${i}`,
        text: 'This is a very long paragraph with many words to test large number formatting in the statistics component.'
      }))
    }

    render(<StoryStats story={largeStory} />)
    
    // Should format large numbers with commas
    const totalWordsElement = screen.getByText(/1,/)
    expect(totalWordsElement).toBeInTheDocument()
  })

  it('should truncate long word lists', () => {
    const storyWithManyWords = {
      ...mockStory,
      playerContributions: [
        {
          playerId: 'player-1',
          playerUsername: 'Alice',
          wordsContributed: ['word1', 'word2', 'word3', 'word4', 'word5']
        }
      ]
    }

    render(<StoryStats story={storyWithManyWords} />)
    
    // Should show first 3 words and "+X more"
    expect(screen.getByText('word1')).toBeInTheDocument()
    expect(screen.getByText('word2')).toBeInTheDocument()
    expect(screen.getByText('word3')).toBeInTheDocument()
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('should calculate reading time correctly', () => {
    const longStory = {
      ...mockStory,
      paragraphs: [
        {
          id: 'para-1',
          text: Array(200).fill('word').join(' '), // 200 words
          imageUrl: null,
          wordHighlights: []
        }
      ]
    }

    render(<StoryStats story={longStory} />)
    
    // 200 words should be 1 minute reading time
    expect(screen.getByText('1 min')).toBeInTheDocument()
  })
})