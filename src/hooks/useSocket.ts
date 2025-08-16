// Stub implementation for useSocket hook
// This is used by the GameContext for online multiplayer mode
// Since online mode is disabled, this provides empty implementations

export interface SocketResponse {
  success: boolean;
  error?: string;
  game?: any;
}

// Mock socket object with event methods
const mockSocket = {
  on: (event: string, callback: (data: any) => void) => {
    // No-op for stub implementation
  },
  off: (event: string) => {
    // No-op for stub implementation
  },
  emit: (event: string, data?: any) => {
    // No-op for stub implementation
  }
};

export function useSocket() {
  return {
    socket: mockSocket,
    isConnected: false,
    createGame: async (): Promise<SocketResponse> => {
      return { success: false, error: 'Online mode not available' };
    },
    joinGame: async (roomCode: string, username: string): Promise<SocketResponse> => {
      return { success: false, error: 'Online mode not available' };
    },
    startGame: async (): Promise<SocketResponse> => {
      return { success: false, error: 'Online mode not available' };
    },
    submitWord: async (word: string): Promise<SocketResponse> => {
      return { success: false, error: 'Online mode not available' };
    },
    leaveGame: () => {
      // No-op
    },
  };
}