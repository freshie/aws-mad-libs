import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JoinGameModal } from '@/components/JoinGameModal'

// Mock the useGame hook
const mockUseGame = {
  joinGame: jest.fn(),
  isLoading: false,
  error: null,
}

jest.mock('@/contexts/GameContext', () => ({
  useGame: () => mockUseGame,
}))

describe('JoinGameModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGame.isLoading = false
    mockUseGame.error = null
  })

  it('should render modal with form fields', () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    expect(screen.getByText('Join Game')).toBeInTheDocument()
    expect(screen.getByLabelText('Room Code')).toBeInTheDocument()
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Join Game' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should close modal when cancel button is clicked', () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when X button is clicked', () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    fireEvent.click(screen.getByText('×'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should format room code input to uppercase', () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    const roomCodeInput = screen.getByLabelText('Room Code') as HTMLInputElement
    fireEvent.change(roomCodeInput, { target: { value: 'abc123' } })
    
    expect(roomCodeInput.value).toBe('ABC123')
  })

  it('should limit room code to 6 characters', () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    const roomCodeInput = screen.getByLabelText('Room Code') as HTMLInputElement
    fireEvent.change(roomCodeInput, { target: { value: 'ABCDEFGH' } })
    
    expect(roomCodeInput.value).toBe('ABCDEF')
  })

  it('should filter out invalid characters from room code', () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    const roomCodeInput = screen.getByLabelText('Room Code') as HTMLInputElement
    fireEvent.change(roomCodeInput, { target: { value: 'AB-C@123!' } })
    
    expect(roomCodeInput.value).toBe('ABC123')
  })

  it('should limit username to 20 characters', () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    const usernameInput = screen.getByLabelText('Your Name') as HTMLInputElement
    fireEvent.change(usernameInput, { target: { value: 'A'.repeat(25) } })
    
    expect(usernameInput.value).toBe('A'.repeat(20))
  })

  it('should validate required fields', async () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    fireEvent.click(screen.getByText('Join Game'))
    
    await waitFor(() => {
      expect(screen.getByText('Room code is required')).toBeInTheDocument()
      expect(screen.getByText('Username is required')).toBeInTheDocument()
    })
    
    expect(mockUseGame.joinGame).not.toHaveBeenCalled()
  })

  it('should validate room code format', async () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'ABC' } })
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'TestUser' } })
    fireEvent.click(screen.getByText('Join Game'))
    
    await waitFor(() => {
      expect(screen.getByText('Room code must be 6 characters (letters and numbers)')).toBeInTheDocument()
    })
    
    expect(mockUseGame.joinGame).not.toHaveBeenCalled()
  })

  it('should validate username format', async () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'ABC123' } })
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'A' } })
    fireEvent.click(screen.getByText('Join Game'))
    
    await waitFor(() => {
      expect(screen.getByText('Username must be 2-20 characters (letters, numbers, spaces only)')).toBeInTheDocument()
    })
    
    expect(mockUseGame.joinGame).not.toHaveBeenCalled()
  })

  it('should submit form with valid data', async () => {
    mockUseGame.joinGame.mockResolvedValue(undefined)
    
    render(<JoinGameModal onClose={mockOnClose} />)
    
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'ABC123' } })
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'TestUser' } })
    fireEvent.click(screen.getByText('Join Game'))
    
    await waitFor(() => {
      expect(mockUseGame.joinGame).toHaveBeenCalledWith('ABC123', 'TestUser')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should clear validation errors when user starts typing', async () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    // Trigger validation errors
    fireEvent.click(screen.getByText('Join Game'))
    
    await waitFor(() => {
      expect(screen.getByText('Room code is required')).toBeInTheDocument()
    })
    
    // Start typing in room code field
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'A' } })
    
    expect(screen.queryByText('Room code is required')).not.toBeInTheDocument()
  })

  it('should disable form when loading', () => {
    mockUseGame.isLoading = true
    
    render(<JoinGameModal onClose={mockOnClose} />)
    
    expect(screen.getByLabelText('Room Code')).toBeDisabled()
    expect(screen.getByLabelText('Your Name')).toBeDisabled()
    expect(screen.getByText('Joining...')).toBeInTheDocument()
    expect(screen.getByText('×')).toBeDisabled()
  })

  it('should display error message', () => {
    mockUseGame.error = 'Game not found'
    
    render(<JoinGameModal onClose={mockOnClose} />)
    
    expect(screen.getByText('Game not found')).toBeInTheDocument()
  })

  it('should disable join button when fields are empty', () => {
    render(<JoinGameModal onClose={mockOnClose} />)
    
    const joinButton = screen.getByText('Join Game')
    expect(joinButton).toBeDisabled()
    
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'ABC123' } })
    expect(joinButton).toBeDisabled()
    
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'TestUser' } })
    expect(joinButton).toBeEnabled()
  })
})