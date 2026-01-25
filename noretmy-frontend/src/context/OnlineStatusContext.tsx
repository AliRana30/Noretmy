'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io as createSocket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface OnlineStatusContextType {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  // Socket.io needs the root server URL, not the /api path
  const SOCKET_URL = BACKEND_URL?.replace(/\/api\/?$/, '') || '';
  const userId = useSelector((state: RootState) => state?.auth?.user?._id || state?.auth?.user?.id);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);

  useEffect(() => {
    if (!userId || !SOCKET_URL) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = createSocket(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],  // Polling first for reliability
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[OnlineStatus] ✅ Socket connected');
      socket.emit('userOnline', String(userId));
      // Request current online users list
      socket.emit('getOnlineUsers');
    });

    socket.on('connect_error', (error) => {
      console.error('[OnlineStatus] ❌ Socket error:', error.message);
    });

    socket.on('reconnect', () => {
      console.log('[OnlineStatus] ♻️ Reconnected');
      socket.emit('userOnline', String(userId));
      socket.emit('getOnlineUsers');
    });

    // Listen for online users list
    socket.on('onlineUsersList', (users: string[]) => {
      console.log('[OnlineStatus] Received online users:', users.length);
      setOnlineUsers(new Set(users));
    });

    // Listen for individual user going online
    socket.on('userOnline', (onlineUserId: string) => {
      console.log('[OnlineStatus] User came online:', onlineUserId);
      setOnlineUsers((prev) => new Set(prev).add(onlineUserId));
    });

    // Listen for individual user going offline
    socket.on('userOffline', (offlineUserId: string) => {
      console.log('[OnlineStatus] User went offline:', offlineUserId);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(offlineUserId);
        return newSet;
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[OnlineStatus] Socket disconnected:', reason);
    });

    return () => {
      socket.emit('userOffline', String(userId));
      socket.disconnect();
    };
  }, [SOCKET_URL, userId]);

  const isUserOnline = (checkUserId: string): boolean => {
    return onlineUsers.has(checkUserId);
  };

  return (
    <OnlineStatusContext.Provider value={{ onlineUsers, isUserOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (context === undefined) {
    // Return safe defaults instead of throwing to prevent crashes
    // This allows components to use the hook even outside the provider
    console.warn('[OnlineStatus] useOnlineStatus called outside OnlineStatusProvider - returning defaults');
    return {
      onlineUsers: new Set<string>(),
      isUserOnline: () => false,
    };
  }
  return context;
};
