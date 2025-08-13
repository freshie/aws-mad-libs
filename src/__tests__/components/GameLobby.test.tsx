import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GameLobby } from '@/components/GameLobby'
import { GameProvider } from '@/contexts/GameContext'
import { GameSession, GameState, Player } from '@/types'

// Mock the useGame hook
const mockUseGame = {
  currentGame: null as GameSession | null,
  currentPlayer: null as Player | null,
  startGame: jest.fn(),
  leaveGame: jest.fn(),
  isLoading: false,
  error: null,
}

jest.mock('@/contexts/GameContext', () => ({
  ...jest.requireActual('@/contexts/GameContext'),
  useGame: () => mockUseGame,
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

describe('GameLobby', () => {
  const mockGame: GameSession = {
    id: 'game-123',
    roomCode: 'ABC123',
    hostId: 'host-1',
    players: [
      {
        id: 'host-1',
        username: 'Host Player',
        isHost: true,
        isConnected: true,
        wordsContributed: 0,
        joinedAt: new Date(),
      },
      {
        id: 'player-2',
        username: 'Player Two',
        isHost: false,
        isConnected: true,
        wordsContributed: 0,
        joinedAt: new Date(),
      },
    ],
    gameState: GameState.WAITING_FOR_PLAYERS,
    storyTemplate: null,
    wordSubmissions: [],
    completedStory: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGame.currentGame = mockGame
    mockUseGame.currentPlayer = mockGame.players[0] // Host player
    mockUseGame.isLoading = false
    mockUseGame.error = null
  })

  it('should render game lobby with room code', () => {
    render(<GameLobby />)
    
    expect(screen.getByText('Game Lobby')).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('Room Code')).toBeInTheDocument()
  })

  it('should display all players', () => {
    render(<GameLobby />)
    
    expect(screen.getByText('Host Player')).toBeInTheDocument()
    expect(screen.getByText('Player Two')).toBeInTheDocument()
    expect(screen.getByText('Players (2/8)')).toBeInTheDocument()
  })

  it('should show host badge for host player', () => {
    render(<GameLobby />)
    
    expect(screen.getByText('Host')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('should allow host to start game when enough players', () => {
    render(<GameLobby />)
    
    const startButton = screen.getByText('Start Game')
    expect(startButton).toBeEnabled()
    
    fireEvent.click(startButton)
    expect(mockUseGame.startGame).toHaveBeenCalled()
  })

  it('should disable start button when not enough players', () => {
    mockUseGame.currentGame = {
      ...mockGame,
      players: [mockGame.players[0]], // Only host
    }
    
    render(<GameLobby />)
    
    const startButton = screen.getByText('Start Game')
    expect(startButton).toBeDisabled()
    expect(screen.getByText('Need at least 2 players to start')).toBeInTheDocument()
  })

  it('should not show start button for non-host players', () => {
    mockUseGame.currentPlayer = mockGame.players[1] // Non-host player
    
    render(<GameLobby />)
    
    expect(screen.queryByText('Start Game')).not.toBeInTheDocument()
    expect(screen.getByText('Waiting for the host to start the game...')).toBeInTheDocument()
  })

  it('should copy room code to clipboard', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    navigator.clipboard.writeText = writeTextMock
    
    render(<GameLobby />)
    
    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)
    
    expect(writeTextMock).toHaveBeenCalledWith('ABC123')
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })
  })

  it('should show leave game confirmation', () => {
    window.confirm = jest.fn().mockReturnValue(true)
    
    render(<GameLobby />)
    
    const leaveButton = screen.getByText('Leave Game')
    fireEvent.click(leaveButton)
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to leave the game?')
    expect(mockUseGame.leaveGame).toHaveBeenCalled()
  })

  it('should display error message', () => {
    mockUseGame.error = 'Test error message'
    
    render(<GameLobby />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseGame.isLoading = true
    
    render(<GameLobby />)
    
    expect(screen.getByText('Starting Game...')).toBeInTheDocument()
  })

  it('should show disconnected players differently', () => {
    mockUseGame.currentGame = {
      ...mockGame,
      players: [
        ...mockGame.players,
        {
          id: 'player-3',
          username: 'Disconnected Player',
          isHost: false,
          isConnected: false,
          wordsContributed: 0,
          joinedAt: new Date(),
        },
      ],
    }
    
    render(<GameLobby />)
    
    expect(screen.getByText('Disconnected Player')).toBeInTheDocument()
    expect(screen.getByText('Players (2/8)')).toBeInTheDocument() // Only connected players counted
  })

  it('should return null when no current game', () => {
    mockUseGame.currentGame = null
    
    const { container } = render(<GameLobby />)
    
    expect(container.firstChild).toBeNull()
  })
})