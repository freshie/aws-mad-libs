import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalPlaySetup } from '@/components/LocalPlaySetup';

// Mock functions
const mockOnStartGame = jest.fn();
const mockOnBack = jest.fn();

describe('LocalPlaySetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders the setup form correctly', () => {
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    expect(screen.getByText('Local Play Setup')).toBeInTheDocument();
    expect(screen.getByText('+ Add Player')).toBeInTheDocument();
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Player 1 name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Player 2 name')).toBeInTheDocument();
  });

  it('adds a player when Add Player button is clicked', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const addButton = screen.getByText('+ Add Player');
    
    // Initially has 2 players
    expect(screen.getByText('Players (2/8)')).toBeInTheDocument();
    
    await act(async () => {
      await user.click(addButton);
    });
    
    // Should now have 3 players
    expect(screen.getByText('Players (3/8)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Player 3 name')).toBeInTheDocument();
  });

  it('validates player names when starting game', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const startButton = screen.getByText('Start Game');
    
    // Try to start with empty names
    await act(async () => {
      await user.click(startButton);
    });
    
    // Should not call onStartGame due to validation
    expect(mockOnStartGame).not.toHaveBeenCalled();
    
    // Button should remain disabled
    expect(startButton).toBeDisabled();
  });

  it('prevents duplicate player names', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const input1 = screen.getByPlaceholderText('Player 1 name');
    const input2 = screen.getByPlaceholderText('Player 2 name');
    const startButton = screen.getByText('Start Game');
    
    // Add same name to both players
    await act(async () => {
      await user.type(input1, 'Alice');
      await user.type(input2, 'Alice');
    });
    
    // Try to start game
    await act(async () => {
      await user.click(startButton);
    });
    
    // Should show duplicate name error
    expect(screen.getByText('Name must be unique')).toBeInTheDocument();
    expect(mockOnStartGame).not.toHaveBeenCalled();
  });

  it('limits players to maximum of 8', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    // Add players one by one until we reach 8 (starting with 2)
    for (let i = 3; i <= 8; i++) {
      const addButton = screen.getByText('+ Add Player');
      if (!addButton.disabled) {
        await act(async () => {
          await user.click(addButton);
        });
        // Wait for the UI to update
        expect(screen.getByText(`Players (${i}/8)`)).toBeInTheDocument();
      }
    }
    
    // Should have 8 players
    expect(screen.getByText('Players (8/8)')).toBeInTheDocument();
    
    // Add button should be disabled
    const finalAddButton = screen.getByText('+ Add Player');
    expect(finalAddButton).toBeDisabled();
  });

  it('removes a player when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const input1 = screen.getByPlaceholderText('Player 1 name');
    const input2 = screen.getByPlaceholderText('Player 2 name');
    
    // Add names to players
    await act(async () => {
      await user.type(input1, 'Alice');
      await user.type(input2, 'Bob');
    });
    
    // Add a third player
    const addButton = screen.getByText('+ Add Player');
    await act(async () => {
      await user.click(addButton);
    });
    
    expect(screen.getByText('Players (3/8)')).toBeInTheDocument();
    
    // Remove the third player (remove buttons are SVG icons)
    const removeButtons = screen.getAllByTitle('Remove player');
    await act(async () => {
      await user.click(removeButtons[2]); // Remove the third player
    });
    
    expect(screen.getByText('Players (2/8)')).toBeInTheDocument();
  });

  it('disables Start Game button when player names are empty', () => {
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const startButton = screen.getByText('Start Game');
    expect(startButton).toBeDisabled();
  });

  it('enables Start Game button when player names are filled', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const input1 = screen.getByPlaceholderText('Player 1 name');
    const input2 = screen.getByPlaceholderText('Player 2 name');
    const startButton = screen.getByText('Start Game');
    
    // Initially disabled
    expect(startButton).toBeDisabled();
    
    // Add player names
    await act(async () => {
      await user.type(input1, 'Alice');
      await user.type(input2, 'Bob');
    });
    
    // Should be enabled now
    expect(startButton).not.toBeDisabled();
  });

  it('starts the game when Start Game button is clicked', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const input1 = screen.getByPlaceholderText('Player 1 name');
    const input2 = screen.getByPlaceholderText('Player 2 name');
    const startButton = screen.getByText('Start Game');
    
    // Add player names
    await act(async () => {
      await user.type(input1, 'Alice');
      await user.type(input2, 'Bob');
    });
    
    // Start the game
    await act(async () => {
      await user.click(startButton);
    });
    
    expect(mockOnStartGame).toHaveBeenCalledWith([
      { id: expect.any(String), username: 'Alice', isHost: true, isConnected: true, wordsContributed: 0, joinedAt: expect.any(Date) },
      { id: expect.any(String), username: 'Bob', isHost: false, isConnected: true, wordsContributed: 0, joinedAt: expect.any(Date) }
    ]);
  });

  it('updates player name when typing', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const input1 = screen.getByPlaceholderText('Player 1 name');
    
    await act(async () => {
      await user.type(input1, 'Alice');
    });
    
    expect(input1).toHaveValue('Alice');
  });

  it('trims whitespace from player names when starting game', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const input1 = screen.getByPlaceholderText('Player 1 name');
    const input2 = screen.getByPlaceholderText('Player 2 name');
    const startButton = screen.getByText('Start Game');
    
    await act(async () => {
      await user.type(input1, '  Alice  ');
      await user.type(input2, '  Bob  ');
      await user.click(startButton);
    });
    
    expect(mockOnStartGame).toHaveBeenCalledWith([
      expect.objectContaining({ username: 'Alice' }),
      expect.objectContaining({ username: 'Bob' })
    ]);
  });

  it('shows player count correctly', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    // Initially shows 2 players
    expect(screen.getByText('Players (2/8)')).toBeInTheDocument();
    
    // Add a player
    const addButton = screen.getByText('+ Add Player');
    await act(async () => {
      await user.click(addButton);
    });
    
    expect(screen.getByText('Players (3/8)')).toBeInTheDocument();
  });

  it('calls onBack when Back button is clicked', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup onStartGame={mockOnStartGame} onBack={mockOnBack} />);
    
    const backButton = screen.getByText('Back');
    await act(async () => {
      await user.click(backButton);
    });
    
    expect(mockOnBack).toHaveBeenCalled();
  });
});