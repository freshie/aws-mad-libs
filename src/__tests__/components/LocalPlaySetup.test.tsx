import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocalPlaySetup from '@/components/LocalPlaySetup';

// Mock the LocalGameContext
const mockStartThemeSelection = jest.fn();

jest.mock('@/contexts/LocalGameContext', () => ({
  useLocalGame: () => ({
    startThemeSelection: mockStartThemeSelection,
    isLoading: false,
  }),
}));

describe('LocalPlaySetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the setup form correctly', () => {
    render(<LocalPlaySetup />);
    
    expect(screen.getByText('Local Play Setup')).toBeInTheDocument();
    expect(screen.getByText('Add Player')).toBeInTheDocument();
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter player name')).toBeInTheDocument();
  });

  it('adds a player when Add Player button is clicked', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    const addButton = screen.getByText('Add Player');
    
    await user.type(input, 'Alice');
    await user.click(addButton);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('prevents adding empty player names', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const addButton = screen.getByText('Add Player');
    await user.click(addButton);
    
    // Should not add any players
    expect(screen.queryByText('Player 1:')).not.toBeInTheDocument();
  });

  it('prevents adding duplicate player names', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    const addButton = screen.getByText('Add Player');
    
    // Add first player
    await user.type(input, 'Alice');
    await user.click(addButton);
    
    // Try to add duplicate
    await user.type(input, 'Alice');
    await user.click(addButton);
    
    // Should only have one Alice
    const aliceElements = screen.getAllByText('Alice');
    expect(aliceElements).toHaveLength(1);
  });

  it('limits players to maximum of 8', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    const addButton = screen.getByText('Add Player');
    
    // Add 8 players
    for (let i = 1; i <= 8; i++) {
      await user.type(input, `Player${i}`);
      await user.click(addButton);
    }
    
    // Try to add 9th player
    await user.type(input, 'Player9');
    await user.click(addButton);
    
    // Should not have 9th player
    expect(screen.queryByText('Player9')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Player\d/)).toHaveLength(8);
  });

  it('removes a player when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    const addButton = screen.getByText('Add Player');
    
    // Add a player
    await user.type(input, 'Alice');
    await user.click(addButton);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    
    // Remove the player
    const removeButton = screen.getByText('Remove');
    await user.click(removeButton);
    
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('disables Start Game button when no players', () => {
    render(<LocalPlaySetup />);
    
    const startButton = screen.getByText('Start Game');
    expect(startButton).toBeDisabled();
  });

  it('enables Start Game button when players are added', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    const addButton = screen.getByText('Add Player');
    const startButton = screen.getByText('Start Game');
    
    // Initially disabled
    expect(startButton).toBeDisabled();
    
    // Add a player
    await user.type(input, 'Alice');
    await user.click(addButton);
    
    // Should be enabled now
    expect(startButton).not.toBeDisabled();
  });

  it('starts the game when Start Game button is clicked', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    const addButton = screen.getByText('Add Player');
    const startButton = screen.getByText('Start Game');
    
    // Add players
    await user.type(input, 'Alice');
    await user.click(addButton);
    await user.type(input, 'Bob');
    await user.click(addButton);
    
    // Start the game
    await user.click(startButton);
    
    expect(mockStartThemeSelection).toHaveBeenCalledWith([
      { id: expect.any(String), username: 'Alice', isHost: true, isConnected: true, wordsContributed: 0, joinedAt: expect.any(Date) },
      { id: expect.any(String), username: 'Bob', isHost: false, isConnected: true, wordsContributed: 0, joinedAt: expect.any(Date) }
    ]);
  });

  it('adds player on Enter key press', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    
    await user.type(input, 'Alice');
    await user.keyboard('{Enter}');
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('trims whitespace from player names', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    const addButton = screen.getByText('Add Player');
    
    await user.type(input, '  Alice  ');
    await user.click(addButton);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows player count', async () => {
    const user = userEvent.setup();
    render(<LocalPlaySetup />);
    
    const input = screen.getByPlaceholderText('Enter player name');
    const addButton = screen.getByText('Add Player');
    
    // Add players
    await user.type(input, 'Alice');
    await user.click(addButton);
    await user.type(input, 'Bob');
    await user.click(addButton);
    
    expect(screen.getByText('Players (2)')).toBeInTheDocument();
  });
});