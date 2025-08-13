'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { GameSession } from '@/types'
import { SOCKET_EVENTS } from '@/utils/constants'

interface SocketResponse {
  success: boolean
  error?: string
  game?: GameSession
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  createGame: () => Promise<SocketResponse>
  joinGame: (roomCode: string, username: string) => Promise<SocketResponse>
  startGame: () => Promise<SocketResponse>
  submitWord: (word: string) => Promise<SocketResponse>
  leaveGame: () => void
}

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket server first
    fetch('/api/socket').then(() => {
      // Initialize socket connection
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
        : 'http://localhost:3000'

      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      })

      const socket = socketRef.current

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        setIsConnected(false)
      })
    }).catch((error) => {
      console.log('Socket server not available:', error)
      setIsConnected(false)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const createGame = (): Promise<SocketResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Socket not connected' })
        return
      }

      socketRef.current.emit(SOCKET_EVENTS.CREATE_GAME, (response: SocketResponse) => {
        resolve(response)
      })
    })
  }

  const joinGame = (roomCode: string, username: string): Promise<SocketResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Socket not connected' })
        return
      }

      socketRef.current.emit(SOCKET_EVENTS.JOIN_GAME, { roomCode, username }, (response: SocketResponse) => {
        resolve(response)
      })
    })
  }

  const startGame = (): Promise<SocketResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Socket not connected' })
        return
      }

      socketRef.current.emit(SOCKET_EVENTS.START_GAME, (response: SocketResponse) => {
        resolve(response)
      })
    })
  }

  const submitWord = (word: string): Promise<SocketResponse> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: 'Socket not connected' })
        return
      }

      socketRef.current.emit(SOCKET_EVENTS.SUBMIT_WORD, { word }, (response: SocketResponse) => {
        resolve(response)
      })
    })
  }

  const leaveGame = (): void => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_GAME)
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    createGame,
    joinGame,
    startGame,
    submitWord,
    leaveGame,
  }
}