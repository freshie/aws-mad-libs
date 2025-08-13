import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WordPrompt } from '@/components/WordPrompt'
import { WordType } from '@/types'

describe('WordPrompt', () => {
  const mockOnSubmit = jest.fn()

  const defaultProps = {
    wordType: WordType.NOUN,
    position: 1,
    totalWords: 5,
    playerName: 'TestPlayer',
    onSubmit: mockOnSubmit,
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render word prompt with correct information', () => {
    render(<WordPrompt {...defaultProps} />)
    
    expect(screen.getByText("TestPlayer's Turn")).toBeInTheDocument()
    expect(screen.getByText('Noun')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('of 5')).toBeInTheDocument()
    expect(screen.getByText('Examples: cat, house, book')).toBeInTheDocument()
  })

  it('should display correct examples for different word types', () => {
    const { rerender } = render(<WordPrompt {...defaultProps} wordType={WordType.VERB} />)
    expect(screen.getByText('Examples: run, jump, sing')).toBeInTheDocument()
    
    rerender(<WordPrompt {...defaultProps} wordType={WordType.ADJECTIVE} />)
    expect(screen.getByText('Examples: funny, big, red')).toBeInTheDocument()
    
    rerender(<WordPrompt {...defaultProps} wordType={WordType.PAST_TENSE_VERB} />)
    expect(screen.getByText('Examples: ran, jumped, sang')).toBeInTheDocument()
  })

  it('should handle word input and submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined)
    
    render(<WordPrompt {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Enter a noun...')
    const submitButton = screen.getByText('Submit Word')
    
    expect(submitButton).toBeDisabled()
    
    fireEvent.change(input, { target: { value: 'cat' } })
    expect(submitButton).toBeEnabled()
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('cat')
    })
  })

  it('should validate empty input', async () => {
    render(<WordPrompt {...defaultProps} />)
    
    const submitButton = screen.getByText('Submit Word')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a word')).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate word format', async () => {
    render(<WordPrompt {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Enter a noun...')
    fireEvent.change(input, { target: { value: 'test123' } })
    fireEvent.click(screen.getByText('Submit Word'))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid word (letters, spaces, hyphens, and apostrophes only)')).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should clear error when user starts typing', async () => {
    render(<WordPrompt {...defaultProps} />)
    
    // Trigger validation error
    fireEvent.click(screen.getByText('Submit Word'))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a word')).toBeInTheDocument()
    })
    
    // Start typing
    const input = screen.getByPlaceholderText('Enter a noun...')
    fireEvent.change(input, { target: { value: 'c' } })
    
    expect(screen.queryByText('Please enter a word')).not.toBeInTheDocument()
  })

  it('should handle loading state', () => {
    render(<WordPrompt {...defaultProps} isLoading={true} />)
    
    const input = screen.getByPlaceholderText('Enter a noun...')
    const submitButton = screen.getByText('Submitting...')
    
    expect(input).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('should limit input length', () => {
    render(<WordPrompt {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Enter a noun...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'a'.repeat(60) } })
    
    expect(input.value).toHaveLength(50) // maxLength is 50
  })

  it('should clear input after successful submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined)
    
    render(<WordPrompt {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Enter a noun...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'cat' } })
    fireEvent.click(screen.getByText('Submit Word'))
    
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('should handle submission error', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Network error'))
    
    render(<WordPrompt {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Enter a noun...')
    fireEvent.change(input, { target: { value: 'cat' } })
    fireEvent.click(screen.getByText('Submit Word'))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to submit word. Please try again.')).toBeInTheDocument()
    })
  })

  it('should trim whitespace from input', async () => {
    mockOnSubmit.mockResolvedValue(undefined)
    
    render(<WordPrompt {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Enter a noun...')
    fireEvent.change(input, { target: { value: '  cat  ' } })
    fireEvent.click(screen.getByText('Submit Word'))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('cat')
    })
  })
})