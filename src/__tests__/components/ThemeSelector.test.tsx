import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeSelector from '@/components/ThemeSelector';

// Mock the LocalGameContext
const mockCompleteThemeSelection = jest.fn();

jest.mock('@/contexts/LocalGameContext', () => ({
  useLocalGame: () => ({
    completeThemeSelection: mockCompleteThemeSelection,
    isLoading: false,
    loadingMessage: '',
  }),
}));

// Mock the spinning wheel animation
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((fn, deps) => {
    if (deps && deps.length === 0) {
      fn();
    }
  }),
}));

describe('ThemeSelector', () => {
  const mockPlayers = [
    { id: '1', username: 'Alice', isHost: true, isConnected: true, wordsContributed: 0, joinedAt: new Date() },
    { id: '2', username: 'Bob', isHost: false, isConnected: true, wordsContributed: 0, joinedAt: new Date() }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the theme selector correctly', () => {
    render(<ThemeSelector players={mockPlayers} />);
    
    expect(screen.getByText('Choose Your Adventure')).toBeInTheDocument();
    expect(screen.getByText('Spin the Wheel!')).toBeInTheDocument();
    expect(screen.getByText('Adventure')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
    expect(screen.getByText('Comedy')).toBeInTheDocument();
  });

  it('displays all available themes', () => {
    render(<ThemeSelector players={mockPlayers} />);
    
    const expectedThemes = [
      'Adventure', 'Mystery', 'Comedy', 'Romance', 'Sci-Fi', 'Fantasy',
      'Horror', 'Western', 'Superhero', 'Pirate', 'Space', 'Medieval'
    ];
    
    expectedThemes.forEach(theme => {
      expect(screen.getByText(theme)).toBeInTheDocument();
    });
  });

  it('spins the wheel when Spin button is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector players={mockPlayers} />);
    
    const spinButton = screen.getByText('Spin the Wheel!');
    await user.click(spinButton);
    
    // Should show spinning state
    expect(screen.getByText('Spinning...')).toBeInTheDocument();
    
    // Wait for spin to complete
    await waitFor(() => {
      expect(screen.getByText('Generate Story!')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows selected theme after spinning', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector players={mockPlayers} />);
    
    const spinButton = screen.getByText('Spin the Wheel!');
    await user.click(spinButton);
    
    // Wait for spin to complete
    await waitFor(() => {
      expect(screen.getByText('Generate Story!')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Should show a selected theme
    const selectedThemeElement = screen.getByText(/Selected Theme:/);
    expect(selectedThemeElement).toBeInTheDocument();
  });

  it('generates story when Generate Story button is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector players={mockPlayers} />);
    
    // First spin the wheel
    const spinButton = screen.getByText('Spin the Wheel!');
    await user.click(spinButton);
    
    // Wait for spin to complete
    await waitFor(() => {
      expect(screen.getByText('Generate Story!')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Click generate story
    const generateButton = screen.getByText('Generate Story!');
    await user.click(generateButton);
    
    expect(mockCompleteThemeSelection).toHaveBeenCalledWith(
      expect.any(String),
      mockPlayers,
      undefined
    );
  });

  it('disables spin button while spinning', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector players={mockPlayers} />);
    
    const spinButton = screen.getByText('Spin the Wheel!');
    await user.click(spinButton);
    
    // Button should be disabled during spin
    expect(screen.getByText('Spinning...')).toBeDisabled();
  });

  it('allows manual theme selection', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector players={mockPlayers} />);
    
    // Click on a specific theme
    const adventureTheme = screen.getByText('Adventure');
    await user.click(adventureTheme);
    
    // Should show generate button
    expect(screen.getByText('Generate Story!')).toBeInTheDocument();
    
    // Click generate
    const generateButton = screen.getByText('Generate Story!');
    await user.click(generateButton);
    
    expect(mockCompleteThemeSelection).toHaveBeenCalledWith(
      'Adventure',
      mockPlayers,
      undefined
    );
  });

  it('highlights selected theme', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector players={mockPlayers} />);
    
    const adventureTheme = screen.getByText('Adventure');
    await user.click(adventureTheme);
    
    // Theme should be highlighted (you might need to check for specific CSS classes)
    expect(adventureTheme.closest('button')).toHaveClass('selected'); // Adjust based on actual implementation
  });

  it('shows player count in the interface', () => {
    render(<ThemeSelector players={mockPlayers} />);
    
    expect(screen.getByText(/2 players/i)).toBeInTheDocument();
  });

  it('handles empty players array', () => {
    render(<ThemeSelector players={[]} />);
    
    expect(screen.getByText('Choose Your Adventure')).toBeInTheDocument();
    expect(screen.getByText(/0 players/i)).toBeInTheDocument();
  });

  it('shows loading state when generating story', () => {
    // Mock loading state
    jest.doMock('@/contexts/LocalGameContext', () => ({
      useLocalGame: () => ({
        completeThemeSelection: mockCompleteThemeSelection,
        isLoading: true,
        loadingMessage: 'Generating your story...',
      }),
    }));

    const { rerender } = render(<ThemeSelector players={mockPlayers} />);
    
    // Re-render with loading state
    rerender(<ThemeSelector players={mockPlayers} />);
    
    expect(screen.getByText('Generating your story...')).toBeInTheDocument();
  });

  it('prevents multiple spins while one is in progress', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector players={mockPlayers} />);
    
    const spinButton = screen.getByText('Spin the Wheel!');
    
    // Click spin button multiple times quickly
    await user.click(spinButton);
    await user.click(spinButton);
    await user.click(spinButton);
    
    // Should only show one spinning state
    expect(screen.getAllByText('Spinning...')).toHaveLength(1);
  });
});