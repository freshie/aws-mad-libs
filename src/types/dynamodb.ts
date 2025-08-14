// DynamoDB data models for single-table design

/**
 * Base DynamoDB record structure for single-table design
 */
export interface DynamoDBRecord {
  PK: string;           // Partition Key
  SK: string;           // Sort Key
  GSI1PK?: string;      // Global Secondary Index 1 Partition Key
  GSI1SK?: string;      // Global Secondary Index 1 Sort Key
  RoomCode?: string;    // Room code for GSI lookup
  CreatedAt?: string;   // ISO timestamp for sorting
  UpdatedAt?: string;   // ISO timestamp for last update
  TTL?: number;         // Time to Live (Unix timestamp)
  EntityType: string;   // Type of entity (GAME, PLAYER, STORY, etc.)
}

/**
 * Game Session record in DynamoDB
 * PK: GAME#{gameId}
 * SK: METADATA
 */
export interface GameSessionRecord extends DynamoDBRecord {
  EntityType: 'GAME_SESSION';
  GameId: string;
  RoomCode: string;
  HostId: string;
  GameState: 'WAITING_FOR_PLAYERS' | 'COLLECTING_WORDS' | 'GENERATING_STORY' | 'DISPLAYING_STORY' | 'COMPLETED';
  PlayerCount: number;
  MaxPlayers: number;
  Theme?: string;
  StoryTemplateId?: string;
  CompletedStoryId?: string;
  CreatedAt: string;
  UpdatedAt: string;
  TTL: number; // Auto-cleanup after 24 hours
}

/**
 * Player record in DynamoDB
 * PK: GAME#{gameId}
 * SK: PLAYER#{playerId}
 */
export interface PlayerRecord extends DynamoDBRecord {
  EntityType: 'PLAYER';
  GameId: string;
  PlayerId: string;
  Username: string;
  IsHost: boolean;
  IsConnected: boolean;
  WordsContributed: number;
  JoinedAt: string;
  LastActiveAt: string;
}

/**
 * Story Template record in DynamoDB
 * PK: TEMPLATE#{theme}
 * SK: TEMPLATE#{templateId}
 */
export interface StoryTemplateRecord extends DynamoDBRecord {
  EntityType: 'STORY_TEMPLATE';
  TemplateId: string;
  Theme: string;
  Title: string;
  Paragraphs: TemplateParagraph[];
  TotalWordBlanks: number;
  Difficulty: 'easy' | 'medium' | 'hard';
  CreatedAt: string;
  IsActive: boolean;
}

/**
 * Word Submission record in DynamoDB
 * PK: GAME#{gameId}
 * SK: WORD#{wordId}
 */
export interface WordSubmissionRecord extends DynamoDBRecord {
  EntityType: 'WORD_SUBMISSION';
  GameId: string;
  WordId: string;
  WordBlankId: string;
  PlayerId: string;
  PlayerUsername: string;
  Word: string;
  WordType: string;
  Position: number;
  SubmittedAt: string;
}

/**
 * Completed Story record in DynamoDB
 * PK: GAME#{gameId}
 * SK: STORY#{storyId}
 */
export interface CompletedStoryRecord extends DynamoDBRecord {
  EntityType: 'COMPLETED_STORY';
  GameId: string;
  StoryId: string;
  Title: string;
  Paragraphs: CompletedParagraph[];
  PlayerContributions: PlayerContribution[];
  ImageUrls: string[];
  CreatedAt: string;
  GenerationTimeMs: number;
}

/**
 * Supporting interfaces for nested data
 */
export interface TemplateParagraph {
  id: string;
  text: string;
  wordBlanks: WordBlank[];
  imagePrompt: string;
}

export interface WordBlank {
  id: string;
  type: string;
  position: number;
  placeholder: string;
}

export interface CompletedParagraph {
  id: string;
  text: string;
  imageUrl?: string;
  wordHighlights: WordHighlight[];
}

export interface WordHighlight {
  word: string;
  playerUsername: string;
  startIndex: number;
  endIndex: number;
  playerId: string;
}

export interface PlayerContribution {
  playerId: string;
  playerUsername: string;
  wordsContributed: number;
  wordsList: string[];
}

/**
 * Access patterns for DynamoDB queries
 */
export const AccessPatterns = {
  // Game Session patterns
  GET_GAME_SESSION: (gameId: string) => ({
    PK: `GAME#${gameId}`,
    SK: 'METADATA'
  }),
  
  GET_GAME_BY_ROOM_CODE: (roomCode: string) => ({
    IndexName: 'RoomCodeIndex',
    KeyConditionExpression: 'RoomCode = :roomCode',
    ExpressionAttributeValues: { ':roomCode': roomCode }
  }),
  
  // Player patterns
  GET_PLAYERS_IN_GAME: (gameId: string) => ({
    PK: `GAME#${gameId}`,
    SK: { beginsWith: 'PLAYER#' }
  }),
  
  GET_PLAYER: (gameId: string, playerId: string) => ({
    PK: `GAME#${gameId}`,
    SK: `PLAYER#${playerId}`
  }),
  
  // Story Template patterns
  GET_TEMPLATES_BY_THEME: (theme: string) => ({
    PK: `TEMPLATE#${theme}`,
    SK: { beginsWith: 'TEMPLATE#' }
  }),
  
  GET_TEMPLATE: (theme: string, templateId: string) => ({
    PK: `TEMPLATE#${theme}`,
    SK: `TEMPLATE#${templateId}`
  }),
  
  // Word Submission patterns
  GET_WORD_SUBMISSIONS: (gameId: string) => ({
    PK: `GAME#${gameId}`,
    SK: { beginsWith: 'WORD#' }
  }),
  
  // Story patterns
  GET_COMPLETED_STORY: (gameId: string, storyId: string) => ({
    PK: `GAME#${gameId}`,
    SK: `STORY#${storyId}`
  })
} as const;

/**
 * TTL calculation helpers
 */
export const TTLHelpers = {
  // Game sessions expire after 24 hours
  GAME_SESSION_TTL: () => Math.floor(Date.now() / 1000) + (24 * 60 * 60),
  
  // Story templates don't expire
  NO_TTL: undefined,
  
  // Completed stories expire after 24 hours (same as game sessions)
  COMPLETED_STORY_TTL: () => Math.floor(Date.now() / 1000) + (24 * 60 * 60),
  
  // Word submissions expire with the game session
  WORD_SUBMISSION_TTL: () => Math.floor(Date.now() / 1000) + (24 * 60 * 60)
} as const;