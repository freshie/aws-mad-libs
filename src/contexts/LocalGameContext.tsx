import React, { createContext, useContext, useState, useCallback } from 'react';
import { Player, GameSession, GameState, StoryTemplate, WordSubmission, Story, WordPrompt } from '@/types/game';
import { generatePlayerId } from '@/utils/gameHelpers';

interface LocalGameContextValue {
  currentGame: GameSession | null;
  currentPlayer: Player | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  isSelectingTheme: boolean;
  startGame: (players: Player[]) => void;
  startThemeSelection: (players: Player[]) => void;
  completeThemeSelection: (theme: string, players: Player[], template?: any) => Promise<void>;
  submitWord: (word: string) => Promise<void>;
  regenerateStory: () => Promise<void>;
  resetGame: () => void;
  getCurrentWordPrompt: () => WordPrompt | null;
}

const LocalGameContext = createContext<LocalGameContextValue | null>(null);

export function useLocalGame() {
  const context = useContext(LocalGameContext);
  if (!context) {
    throw new Error('useLocalGame must be used within a LocalGameProvider');
  }
  return context;
}

export function LocalGameProvider({ children }: { children: React.ReactNode }) {
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSelectingTheme, setIsSelectingTheme] = useState(false);

  const startGame = useCallback((players: Player[]) => {
    const gameSession: GameSession = {
      id: `local-game-${Date.now()}`,
      roomCode: 'LOCAL',
      hostId: players[0]?.id || '',
      players,
      gameState: GameState.WAITING_FOR_PLAYERS,
      storyTemplate: null,
      wordSubmissions: [],
      completedStory: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCurrentGame(gameSession);
    setCurrentPlayer(players[0] || null);
    setError(null);
  }, []);

  const startThemeSelection = useCallback((players: Player[]) => {
    startGame(players);
    setIsSelectingTheme(true);
  }, [startGame]);

  const completeThemeSelection = useCallback(async (theme: string, players: Player[], template?: any) => {
    setIsLoading(true);
    setLoadingMessage('Generating story template...');
    setError(null);

    try {
      let storyTemplate: StoryTemplate;
      
      if (template) {
        storyTemplate = template;
      } else {
        // Call API to generate template
        const response = await fetch('/api/story/generate-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme, playerCount: players.length })
        });

        if (!response.ok) {
          throw new Error('Failed to generate story template');
        }

        const data = await response.json();
        storyTemplate = data.template;
      }

      // Update game with template and start word collection
      setCurrentGame(prev => prev ? {
        ...prev,
        storyTemplate,
        gameState: GameState.COLLECTING_WORDS,
        updatedAt: new Date()
      } : null);
      
      setIsSelectingTheme(false);
    } catch (err) {
      setError('Failed to generate story template. Please try again.');
      console.error('Template generation error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const getCurrentWordPrompt = useCallback((): WordPrompt | null => {
    if (!currentGame?.storyTemplate) return null;

    const submittedWordBlankIds = new Set(currentGame.wordSubmissions.map(s => s.wordBlankId));
    
    for (const paragraph of currentGame.storyTemplate.paragraphs) {
      for (const wordBlank of paragraph.wordBlanks) {
        if (!submittedWordBlankIds.has(wordBlank.id)) {
          const assignedPlayer = currentGame.players.find(p => p.id === wordBlank.assignedPlayerId);
          return {
            wordBlankId: wordBlank.id,
            wordType: wordBlank.type,
            position: wordBlank.position,
            playerName: assignedPlayer?.username || 'Unknown Player'
          };
        }
      }
    }
    
    return null;
  }, [currentGame]);

  const submitWord = useCallback(async (word: string) => {
    if (!currentGame?.storyTemplate) return;

    const prompt = getCurrentWordPrompt();
    if (!prompt) return;

    const wordSubmission: WordSubmission = {
      id: `word-${Date.now()}`,
      wordBlankId: prompt.wordBlankId,
      playerId: currentPlayer?.id || '',
      playerUsername: currentPlayer?.username || '',
      word: word.trim(),
      wordType: prompt.wordType,
      submittedAt: new Date()
    };

    // Add word submission
    const updatedSubmissions = [...currentGame.wordSubmissions, wordSubmission];
    
    setCurrentGame(prev => prev ? {
      ...prev,
      wordSubmissions: updatedSubmissions,
      updatedAt: new Date()
    } : null);

    // Check if all words are collected
    if (updatedSubmissions.length >= currentGame.storyTemplate.totalWordBlanks) {
      // Generate story
      setIsLoading(true);
      setLoadingMessage('Creating your story...');

      try {
        const response = await fetch('/api/story/fill-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: currentGame.storyTemplate,
            wordSubmissions: updatedSubmissions
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate story');
        }

        const data = await response.json();
        const completedStory: Story = data.story;

        setCurrentGame(prev => prev ? {
          ...prev,
          completedStory,
          gameState: GameState.DISPLAYING_STORY,
          updatedAt: new Date()
        } : null);
      } catch (err) {
        setError('Failed to generate story. Please try again.');
        console.error('Story generation error:', err);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  }, [currentGame, currentPlayer, getCurrentWordPrompt]);

  const regenerateStory = useCallback(async () => {
    if (!currentGame?.storyTemplate || !currentGame.wordSubmissions.length) return;

    setIsLoading(true);
    setLoadingMessage('Regenerating your story...');
    setError(null);

    try {
      const response = await fetch('/api/story/fill-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: currentGame.storyTemplate,
          wordSubmissions: currentGame.wordSubmissions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate story');
      }

      const data = await response.json();
      const completedStory: Story = data.story;

      setCurrentGame(prev => prev ? {
        ...prev,
        completedStory,
        updatedAt: new Date()
      } : null);
    } catch (err) {
      setError('Failed to regenerate story. Please try again.');
      console.error('Story regeneration error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentGame]);

  const resetGame = useCallback(() => {
    setCurrentGame(null);
    setCurrentPlayer(null);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setIsSelectingTheme(false);
  }, []);

  const value: LocalGameContextValue = {
    currentGame,
    currentPlayer,
    isLoading,
    loadingMessage,
    error,
    isSelectingTheme,
    startGame,
    startThemeSelection,
    completeThemeSelection,
    submitWord,
    regenerateStory,
    resetGame,
    getCurrentWordPrompt,
  };

  return (
    <LocalGameContext.Provider value={value}>
      {children}
    </LocalGameContext.Provider>
  );
}