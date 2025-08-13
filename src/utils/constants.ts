export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  ROOM_CODE_LENGTH: 6,
  WORD_MAX_LENGTH: 50,
  RECONNECTION_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  STORY_GENERATION_TIMEOUT: 30 * 1000, // 30 seconds
  IMAGE_GENERATION_TIMEOUT: 60 * 1000, // 60 seconds
  VIDEO_GENERATION_TIMEOUT: 120 * 1000, // 2 minutes
}

export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Game lifecycle events
  CREATE_GAME: 'create_game',
  GAME_CREATED: 'game_created',
  JOIN_GAME: 'join_game',
  LEAVE_GAME: 'leave_game',
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  
  // Player events
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  
  // Word collection events
  WORD_PROMPT: 'word_prompt',
  SUBMIT_WORD: 'submit_word',
  WORD_SUBMITTED: 'word_submitted',
  ALL_WORDS_COLLECTED: 'all_words_collected',
  
  // Story events
  STORY_GENERATING: 'story_generating',
  STORY_GENERATED: 'story_generated',
  IMAGE_GENERATING: 'image_generating',
  IMAGE_GENERATED: 'image_generated',
  VIDEO_CREATING: 'video_creating',
  VIDEO_CREATED: 'video_created',
  
  // Error events
  ERROR: 'error',
  GAME_ERROR: 'game_error',
}

export const ERROR_MESSAGES = {
  GAME_NOT_FOUND: 'Game room not found',
  GAME_FULL: 'Game room is full',
  INVALID_ROOM_CODE: 'Invalid room code',
  PLAYER_NOT_FOUND: 'Player not found',
  INVALID_WORD: 'Invalid word submission',
  AI_SERVICE_ERROR: 'AI service temporarily unavailable',
  NETWORK_ERROR: 'Network connection error',
}