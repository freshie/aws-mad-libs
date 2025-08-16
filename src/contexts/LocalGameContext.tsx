import React, { createContext, useContext, useState, useCallback } from 'react';
import { Player, GameSession, GameState, StoryTemplate, WordSubmission, Story, WordPrompt, WordType } from '@/types/game';

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
  createVideo: () => Promise<void>;
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
        
        // Assign word blanks to players in round-robin fashion
        const allWordBlanks = storyTemplate.paragraphs.flatMap(p => p.wordBlanks);
        allWordBlanks.forEach((wordBlank, index) => {
          const playerIndex = index % players.length;
          wordBlank.assignedPlayerId = players[playerIndex].id;
        });
      } else {
        // This should not happen anymore since ThemeSelector always provides a template
        console.error('No template provided by ThemeSelector - this is unexpected');
        storyTemplate = {
          id: `fallback-${Date.now()}`,
          title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Adventure`,
          paragraphs: [
            {
              id: 'p1',
              text: 'Once there was a {adjective} {noun} who loved to {verb}.',
              wordBlanks: [
                { id: 'w1', type: WordType.ADJECTIVE, position: 0, assignedPlayerId: players[0]?.id || null },
                { id: 'w2', type: WordType.NOUN, position: 1, assignedPlayerId: players[1]?.id || players[0]?.id || null },
                { id: 'w3', type: WordType.VERB, position: 2, assignedPlayerId: players[2]?.id || players[0]?.id || null }
              ],
              imagePrompt: 'A simple adventure scene'
            }
          ],
          totalWordBlanks: 3,
          theme,
          difficulty: 'easy' as const
        };
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

    // Find the assigned player for this word blank
    const wordBlank = currentGame.storyTemplate.paragraphs
      .flatMap(p => p.wordBlanks)
      .find(wb => wb.id === prompt.wordBlankId);
    
    const assignedPlayer = currentGame.players.find(p => p.id === wordBlank?.assignedPlayerId);
    
    const wordSubmission: WordSubmission = {
      id: `word-${Date.now()}`,
      wordBlankId: prompt.wordBlankId,
      playerId: assignedPlayer?.id || '',
      playerUsername: assignedPlayer?.username || '',
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
        // Fill the story template on the frontend - no API call needed!
        const { fillStoryTemplate } = await import('../utils/storyFiller');
        const completedStory: Story = fillStoryTemplate(currentGame.storyTemplate, updatedSubmissions);

        // Generate the first image before showing the story
        setLoadingMessage('Generating your story images...');
        await generateFirstImageForStory(completedStory, currentGame.storyTemplate);

        // Update game state with story and show it
        setCurrentGame(prev => prev ? {
          ...prev,
          completedStory,
          gameState: GameState.DISPLAYING_STORY,
          updatedAt: new Date()
        } : null);

        // Generate remaining images in the background
        generateRemainingImagesForStory(completedStory, currentGame.storyTemplate);
      } catch (err) {
        setError('Failed to generate story. Please try again.');
        console.error('Story generation error:', err);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  }, [currentGame, currentPlayer, getCurrentWordPrompt]);

  const generateFirstImageForStory = useCallback(async (story: Story, template: StoryTemplate) => {
    try {
      console.log('🎨 Generating first image for story...');
      const { ImageGenerator } = await import('../services/ImageGenerator');
      const imageGenerator = ImageGenerator.getInstance();

      const firstParagraph = story.paragraphs[0];
      const firstTemplateParagraph = template.paragraphs[0];
      
      // Create image prompt directly from the paragraph text with emphasis on player words
      const contextualPrompt = createImagePromptFromText(firstParagraph.text, story, 0);
      
      const imageResult = await imageGenerator.generateImage(
        contextualPrompt,
        { style: 'cartoon', colorScheme: 'vibrant' }
      );

      if (imageResult?.url) {
        console.log('✅ First image generated:', imageResult.url);
        
        // Update the first paragraph with the image
        story.paragraphs[0].imageUrl = imageResult.url;
      } else {
        console.error('❌ No URL returned for first image');
      }
    } catch (error) {
      console.error('❌ Failed to generate first image:', error);
      // Continue without first image
    }
  }, []);

  const generateRemainingImagesForStory = useCallback(async (story: Story, template: StoryTemplate) => {
    try {
      console.log('🎨 Starting background image generation for remaining paragraphs...');
      const { ImageGenerator } = await import('../services/ImageGenerator');
      const imageGenerator = ImageGenerator.getInstance();

      // Generate images for paragraphs 2-N (skip first one), using previous image as reference
      for (let i = 1; i < story.paragraphs.length; i++) {
        try {
          const paragraph = story.paragraphs[i];
          
          console.log(`🎨 Generating background image for paragraph ${i + 1}...`);
          
          // Get the previous image URL for reference
          const previousImageUrl = story.paragraphs[i - 1].imageUrl;
          
          // Create image prompt directly from the paragraph text with emphasis on player words
          const contextualPrompt = createImagePromptFromText(paragraph.text, story, i);
          
          const imageResult = await imageGenerator.generateImage(
            contextualPrompt,
            { style: 'cartoon', colorScheme: 'vibrant' },
            previousImageUrl || undefined // Use previous image as reference
          );

          if (imageResult?.url) {
            console.log(`✅ Background image generated for paragraph ${i + 1}:`, imageResult.url);
            
            // Update the story with the new image URL
            setCurrentGame(prev => {
              if (!prev?.completedStory) return prev;
              
              const updatedStory = {
                ...prev.completedStory,
                paragraphs: prev.completedStory.paragraphs.map((p, index) => 
                  index === i ? { ...p, imageUrl: imageResult.url } : p
                )
              };
              
              return {
                ...prev,
                completedStory: updatedStory,
                updatedAt: new Date()
              };
            });
          } else {
            console.error(`❌ No URL returned for paragraph ${i + 1} image`);
          }
        } catch (error) {
          console.error(`❌ Failed to generate image for paragraph ${i + 1}:`, error);
          // Continue with next paragraph
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize background image generation:', error);
    }
  }, []);

  const createImagePromptFromText = (paragraphText: string, story: Story, paragraphIndex: number): string => {
    // Get the player-contributed words for this paragraph
    const paragraph = story.paragraphs[paragraphIndex];
    const playerWords = paragraph.wordHighlights?.map(h => h.word) || [];
    
    // Extract key elements from the filled paragraph text
    const words = paragraphText.toLowerCase().split(/\s+/);
    const keyWords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'but', 'for', 'are', 'with', 'they', 'have', 'this', 'that', 'from', 'were', 'been', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'many', 'some', 'what', 'only', 'when', 'here', 'how', 'its', 'our', 'out', 'day', 'get', 'use', 'man', 'new', 'now', 'way', 'may', 'say'].includes(word)
    ).slice(0, 8);

    // Create image prompt with emphasis on player words
    const cleanText = paragraphText.replace(/[{}]/g, ''); // Remove any leftover placeholders
    const playerWordsText = playerWords.length > 0 ? ` Pay special attention to and emphasize these player-contributed elements: ${playerWords.join(', ')}.` : '';
    
    return `Illustrate this scene: ${cleanText}. Key elements: ${keyWords.join(', ')}.${playerWordsText} Cartoon style, vibrant colors, family-friendly, suitable for children.`;
  };



  const resetGame = useCallback(() => {
    setCurrentGame(null);
    setCurrentPlayer(null);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setIsSelectingTheme(false);
  }, []);

  const createVideo = useCallback(async () => {
    if (!currentGame?.completedStory) return;

    setIsLoading(true);
    setLoadingMessage('Creating your story video...');
    setError(null);

    try {
      // Prepare story input for video generation
      const storyVideoInput = {
        images: currentGame.completedStory.paragraphs.map((paragraph, index) => ({
          url: paragraph.imageUrl || '', // Include all paragraphs, even without images
          text: paragraph.text,
          duration: 5 // 5 seconds per scene
        })), // Include all paragraphs for complete story
        title: currentGame.completedStory.title,
        overallNarrative: currentGame.completedStory.paragraphs.map(p => p.text).join(' ')
      };

      // Call video generation API
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyInput: storyVideoInput
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate video');
      }

      const data = await response.json();
      
      if (data.success && data.result?.url) {
        // Update the story with the video URL
        setCurrentGame(prev => prev ? {
          ...prev,
          completedStory: prev.completedStory ? {
            ...prev.completedStory,
            videoUrl: data.result.url
          } : prev.completedStory,
          updatedAt: new Date()
        } : null);
      } else {
        throw new Error('Video generation failed');
      }
    } catch (err) {
      setError('Failed to create video. Please try again.');
      console.error('Video creation error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentGame]);

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
    createVideo,
    resetGame,
    getCurrentWordPrompt,
  };

  return (
    <LocalGameContext.Provider value={value}>
      {children}
    </LocalGameContext.Provider>
  );
}