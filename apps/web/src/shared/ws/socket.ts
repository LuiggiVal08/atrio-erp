import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string, tenantId: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000/ws', {
    auth: { token: `Bearer ${token}`, tenantId },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect_error', (error) => {
    console.error('WS connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
