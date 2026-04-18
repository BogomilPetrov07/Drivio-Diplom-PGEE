import { io, type Socket } from 'socket.io-client'

let socketRef: Socket | null = null
let reconnectInFlight: Promise<void> | null = null

async function tryRefreshSession() {
  await fetch('/api/auth/refresh', {
    method: 'GET',
    credentials: 'include',
  })
}

export function getRealtimeSocket() {
  if (socketRef) return socketRef

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
        socketRef?.connect()
      } catch {
        // Ignore; auth guards will handle redirect if session is gone.
      } finally {
        reconnectInFlight = null
      }
    })()
  })

  return socketRef
}
