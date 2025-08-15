import React, { createContext, useContext } from 'react';
import { Player } from '@/types/game';

interface LocalGameContextValue {
  startThemeSelection: (players: Player[]) => void;
  completeThemeSelection: (theme: string, players: Player[], template?: any) => Promise<void>;
  isLoading: boolean;
  loadingMessage: string;
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
  const value: LocalGameContextValue = {
    startThemeSelection: () => {},
    completeThemeSelection: async () => {},
    isLoading: false,
    loadingMessage: '',
  };

  return (
    <LocalGameContext.Provider value={value}>
      {children}
    </LocalGameContext.Provider>
  );
}