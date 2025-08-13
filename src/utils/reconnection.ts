export class ReconnectionManager {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second
  private maxReconnectDelay = 30000 // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(
    private onReconnect: () => void,
    private onReconnectFailed: () => void
  ) {}

  startReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onReconnectFailed()
      return
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )

    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.onReconnect()
    }, delay)
  }

  stopReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = 0
  }

  onConnectionRestored(): void {
    this.stopReconnection()
    console.log('Connection restored successfully')
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts
  }

  isReconnecting(): boolean {
    return this.reconnectTimer !== null
  }
}