'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { GameSession, Player, GameState } from '@/types'
import { useSocket } from '@/hooks/useSocket'
import { SOCKET_EVENTS } from '@/utils/constants'

interface GameContextState {
  currentGame: GameSession | null
  currentPlayer: Player | null
  isConnected: boolean
  error: string | null
  isLoading: boolean
}

type GameAction =
  | { type: 'SET_GAME'; payload: GameSession }
  | { type: 'SET_PLAYER'; payload: Player }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'UPDATE_PLAYER_STATUS'; payload: { playerId: string; isConnected: boolean } }
  | { type: 'CLEAR_GAME' }

const initialState: GameContextState = {
  currentGame: null,
  currentPlayer: null,
  isConnected: false,
  error: null,
  isLoading: false,
}

function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'SET_GAME':
      return { ...state, currentGame: action.payload, error: null }
    
    case 'SET_PLAYER':
      return { ...state, currentPlayer: action.payload }
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'UPDATE_GAME_STATE':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: { ...state.currentGame, gameState: action.payload }
      }
    
    case 'ADD_PLAYER':
      if (!state.currentGame) return state
      const existingPlayerIndex = state.currentGame.players.findIndex(p => p.id === action.payload.id)
      if (existingPlayerIndex >= 0) {
        // Update existing player
        const updatedPlayers = [...state.currentGame.players]
        updatedPlayers[existingPlayerIndex] = action.payload
        return {
          ...state,
          currentGame: { ...state.currentGame, players: updatedPlayers }
        }
      } else {
        // Add new player
        return {
          ...state,
          currentGame: {
            ...state.currentGame,
            players: [...state.currentGame.players, action.payload]
          }
        }
      }
    
    case 'REMOVE_PLAYER':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          players: state.currentGame.players.filter(p => p.id !== action.payload)
        }
      }
    
    case 'UPDATE_PLAYER_STATUS':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          players: state.currentGame.players.map(p =>
            p.id === action.payload.playerId
              ? { ...p, isConnected: action.payload.isConnected }
              : p
          )
        }
      }
    
    case 'CLEAR_GAME':
      return { ...initialState, isConnected: state.isConnected }
    
    default:
      return state
  }
}

interface GameContextValue extends GameContextState {
  createGame: () => Promise<void>
  joinGame: (roomCode: string, username: string) => Promise<void>
  startGame: () => Promise<void>
  submitWord: (word: string) => Promise<void>
  leaveGame: () => void
}

const GameContext = createContext<GameContextValue | undefined>(undefined)

interface GameProviderProps {
  children: ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const { socket, isConnected, createGame: socketCreateGame, joinGame: socketJoinGame, startGame: socketStartGame, submitWord: socketSubmitWord, leaveGame: socketLeaveGame } = useSocket()

  // Update connection status
  useEffect(() => {
    dispatch({ type: 'SET_CONNECTED', payload: isConnected })
  }, [isConnected])

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return

    // Game events
    socket.on(SOCKET_EVENTS.GAME_CREATED, (data) => {
      dispatch({ type: 'SET_GAME', payload: data.game })
    })

    socket.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
      dispatch({ type: 'SET_GAME', payload: data.game })
    })

    socket.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
      dispatch({ type: 'REMOVE_PLAYER', payload: data.playerId })
    })

    socket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, (data) => {
      dispatch({ type: 'UPDATE_PLAYER_STATUS', payload: { playerId: data.playerId, isConnected: false } })
    })

    socket.on(SOCKET_EVENTS.PLAYER_RECONNECTED, (data) => {
      dispatch({ type: 'UPDATE_PLAYER_STATUS', payload: { playerId: data.playerId, isConnected: true } })
    })

    socket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      dispatch({ type: 'SET_GAME', payload: data.game })
    })

    // Word collection events
    socket.on(SOCKET_EVENTS.WORD_SUBMITTED, (data) => {
      if (data.game) {
        dispatch({ type: 'SET_GAME', payload: data.game })
      }
    })

    socket.on(SOCKET_EVENTS.ALL_WORDS_COLLECTED, (data) => {
      if (data.game) {
        dispatch({ type: 'SET_GAME', payload: data.game })
      }
    })

    socket.on(SOCKET_EVENTS.STORY_GENERATING, (data) => {
      if (data.game) {
        dispatch({ type: 'SET_GAME', payload: data.game })
      }
    })

    socket.on(SOCKET_EVENTS.STORY_GENERATED, (data) => {
      if (data.game) {
        dispatch({ type: 'SET_GAME', payload: data.game })
      }
    })

    // Error handling
    socket.on(SOCKET_EVENTS.ERROR, (data) => {
      dispatch({ type: 'SET_ERROR', payload: data.message })
    })

    // Cleanup listeners
    return () => {
      socket.off(SOCKET_EVENTS.GAME_CREATED)
      socket.off(SOCKET_EVENTS.PLAYER_JOINED)
      socket.off(SOCKET_EVENTS.PLAYER_LEFT)
      socket.off(SOCKET_EVENTS.PLAYER_DISCONNECTED)
      socket.off(SOCKET_EVENTS.PLAYER_RECONNECTED)
      socket.off(SOCKET_EVENTS.GAME_STARTED)
      socket.off(SOCKET_EVENTS.WORD_SUBMITTED)
      socket.off(SOCKET_EVENTS.ALL_WORDS_COLLECTED)
      socket.off(SOCKET_EVENTS.STORY_GENERATING)
      socket.off(SOCKET_EVENTS.STORY_GENERATED)
      socket.off(SOCKET_EVENTS.ERROR)
    }
  }, [socket])

  const createGame = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await socketCreateGame()
      if (response.success && response.game) {
        dispatch({ type: 'SET_GAME', payload: response.game })
        // Set current player as the host
        const hostPlayer = response.game.players.find((p: any) => p.isHost)
        if (hostPlayer) {
          dispatch({ type: 'SET_PLAYER', payload: hostPlayer })
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to create game' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create game' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const joinGame = async (roomCode: string, username: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await socketJoinGame(roomCode, username)
      if (response.success && response.game) {
        dispatch({ type: 'SET_GAME', payload: response.game })
        // Find and set current player
        const currentPlayer = response.game.players.find((p: any) => p.username === username)
        if (currentPlayer) {
          dispatch({ type: 'SET_PLAYER', payload: currentPlayer })
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to join game' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to join game' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const startGame = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await socketStartGame()
      if (!response.success) {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to start game' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start game' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const submitWord = async (word: string): Promise<void> => {
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await socketSubmitWord(word)
      if (!response.success) {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to submit word' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to submit word' })
    }
  }

  const leaveGame = (): void => {
    socketLeaveGame()
    dispatch({ type: 'CLEAR_GAME' })
  }

  const contextValue: GameContextValue = {
    ...state,
    createGame,
    joinGame,
    startGame,
    submitWord,
    leaveGame,
  }

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}