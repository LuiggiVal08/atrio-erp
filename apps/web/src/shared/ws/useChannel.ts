import { useEffect } from 'react';
import { useSocket } from './useSocket';

export function useChannel(event: string, handler: (data: any) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}
