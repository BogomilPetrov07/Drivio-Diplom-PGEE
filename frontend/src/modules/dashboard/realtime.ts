import { io, type Socket } from 'socket.io-client'

let socketRef: Socket | null = null
let reconnectInFlight: Promise<void> | null = null
let socketGeneration = 0

async function tryRefreshSession() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`Refresh failed: ${response.status}`)
  }
}

export function disconnectRealtimeSocket() {
  socketGeneration += 1
  reconnectInFlight = null

  if (!socketRef) return

  socketRef.removeAllListeners()
  socketRef.disconnect()
  socketRef = null
}

export function getRealtimeSocket() {
  if (socketRef) return socketRef

  const currentGeneration = socketGeneration
  socketRef = io('/', {
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
  })

  socketRef.on('connect_error', (error) => {
    const message = typeof error?.message === 'string' ? error.message.toLowerCase() : ''
    if (!message.includes('unauthorized')) return
    if (reconnectInFlight) return

    reconnectInFlight = (async () => {
      try {
        await tryRefreshSession()
        if (socketRef && socketGeneration === currentGeneration) {
          socketRef.connect()
        }
      } catch {
        // Ignore; auth guards will handle redirect if session is gone.
      } finally {
        reconnectInFlight = null
      }
    })()
  })

  return socketRef
}
