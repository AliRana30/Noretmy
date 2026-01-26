'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import axios from 'axios';
import moment from 'moment';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  InboxArrowDownIcon,
} from '@heroicons/react/24/outline';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { Conversation, ChatUser } from '@/types/chat';
import { SkeletonChatListItem } from '@/components/shared/Skeletons';
import { io as createSocket } from 'socket.io-client';
import { useOnlineStatus } from '@/context/OnlineStatusContext';

// Session storage key for tracking read conversations
const READ_CONVERSATIONS_KEY = 'chat_read_conversations';

// Helper to get read conversations from session storage
const getSessionReadConversations = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = sessionStorage.getItem(READ_CONVERSATIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

// Helper to mark a conversation as read in session storage
const markSessionRead = (conversationId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getSessionReadConversations();
    current.add(conversationId);
    sessionStorage.setItem(READ_CONVERSATIONS_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // Ignore storage errors
  }
};

const ChatScreen: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslations();
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);
  const { isUserOnline } = useOnlineStatus();
  const sessionReadRef = useRef<Set<string>>(new Set());
  const [typingConversations, setTypingConversations] = useState<Record<string, boolean>>({});

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  // Socket.io needs the root server URL, not the /api path
  const SOCKET_URL = BACKEND_URL?.replace(/\/api\/?$/, '') || '';

  // Initialize session read set on mount
  useEffect(() => {
    sessionReadRef.current = getSessionReadConversations();
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      console.error(t('chat.errors.noUserData'));
      return;
    }

    try {
      const response = await axios.get<Conversation[]>(
        `${BACKEND_URL}/conversations`,
        { withCredentials: true }
      );

      // Apply session-based read status to prevent re-highlighting after reload
      const sessionRead = getSessionReadConversations();
      const conversationsWithSessionRead = response.data.map((conv) => {
        if (sessionRead.has(conv._id)) {
          return {
            ...conv,
            readByBuyer: user?.isSeller ? conv.readByBuyer : true,
            readBySeller: user?.isSeller ? true : conv.readBySeller,
          };
        }
        return conv;
      });

      setConversations(conversationsWithSessionRead);
    } catch (err) {
      setError(t('chat.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, t, user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!user?._id || !SOCKET_URL) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = createSocket(SOCKET_URL, {
      path: '/socket.io/',
      withCredentials: true,
      transports: ['polling', 'websocket'],  // Polling first for reliability
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Chat] Socket connected - user:', user._id);
      socket.emit('userOnline', String(user._id));
    });

    // Debounce real-time updates to prevent performance violations
    let updateTimer: NodeJS.Timeout | null = null;
    const handleRealtimeUpdate = (payload: any) => {
      console.log('[Chat] Real-time update received:', payload);

      // Clear existing timer
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      // Debounce: wait 300ms before fetching to batch rapid updates
      updateTimer = setTimeout(() => {
        fetchConversations();
        updateTimer = null;
      }, 300);
    };

    socket.on('newMessageNotification', handleRealtimeUpdate);
    socket.on('receiveMessage', handleRealtimeUpdate);

    socket.on('userTyping', (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.userId !== user?._id) {
        setTypingConversations(prev => ({
          ...prev,
          [payload.conversationId]: payload.isTyping
        }));
      }
    });

    return () => {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
      socket.off('newMessageNotification', handleRealtimeUpdate);
      socket.off('receiveMessage', handleRealtimeUpdate);
      socket.off('userTyping');
      socket.disconnect();
    };
  }, [SOCKET_URL, fetchConversations, user?._id]);

  const activeConversationId = useMemo(() => {
    if (!pathname?.startsWith('/message/')) return null;
    const parts = pathname.split('/message/');
    return parts[1] || null;
  }, [pathname]);

  const markAsRead = useCallback(async (conversationId: string) => {
    // Mark in session storage to prevent re-highlighting on reload
    markSessionRead(conversationId);

    try {
      await axios.put(
        `${BACKEND_URL}/conversations/${conversationId}`,
        {},
        { withCredentials: true }
      );

      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? {
              ...conv,
              readByBuyer: user?.isSeller ? conv.readByBuyer : true,
              readBySeller: user?.isSeller ? true : conv.readBySeller,
            }
            : conv
        )
      );
    } catch (err) {
      console.error(t('chat.errors.markReadFailed'));
    }
  }, [BACKEND_URL, t, user?.isSeller]);

  const handleSelectConversation = useCallback((
    conversationId: string,
    sellerId: string,
    buyerId: string
  ) => {
    router.push(`/message/${conversationId}?sellerId=${sellerId}&buyerId=${buyerId}`);
  }, [router]);

  const filteredConversations = conversations.filter((conv) =>
    conv.seller?.username?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    conv.buyer?.username?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  const renderConversationItem = (conversation: Conversation) => {
    const otherParty = user?.isSeller ? conversation.buyer : conversation.seller;
    const unread = user?.isSeller
      ? !conversation.readBySeller
      : !conversation.readByBuyer;
    const isActive = !!activeConversationId &&
      (conversation._id === activeConversationId || conversation.id === activeConversationId);

    // Use full username
    const displayName = otherParty.username || 'Unknown';

    return (
      <div
        key={conversation._id}
        className={`relative flex items-center gap-3 p-4 transition-colors cursor-pointer border-b border-gray-100 ${isActive
          ? 'bg-orange-50/70 border-orange-200'
          : 'bg-white hover:bg-gray-50'
          }`}
        onClick={() => {
          // Navigate first
          handleSelectConversation(
            conversation.id,
            conversation.sellerId,
            conversation.buyerId
          );

          // Only mark as read when user explicitly clicks (not on page load/reload)
          if (unread) {
            // Optimistically update UI immediately
            setConversations((prev) =>
              prev.map((conv) =>
                conv._id === conversation._id
                  ? {
                    ...conv,
                    readByBuyer: user?.isSeller ? conv.readByBuyer : true,
                    readBySeller: user?.isSeller ? true : conv.readBySeller,
                  }
                  : conv
              )
            );
            // Then persist to backend
            markAsRead(conversation._id);
          }
        }}
      >
        <div className="relative flex-shrink-0">
          <Image
            src={otherParty.profilePicture || '/api/placeholder/48/48'}
            alt={t('chat.conversation.aria.userAvatar', { username: displayName })}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
          {/* Single indicator: Orange for online, Gray for offline, Red dot for unread */}
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${unread ? 'bg-red-500' : isUserOnline(otherParty._id || otherParty.id) ? 'bg-orange-500' : 'bg-gray-400'
              }`}
            title={
              unread ? 'Unread messages' : isUserOnline(otherParty._id || otherParty.id) ? 'Online' : 'Offline'
            }
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
            <h3 className="font-medium truncate text-gray-900">
              {displayName}
            </h3>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {moment(conversation.updatedAt).fromNow()}
            </span>
          </div>
          <p className={`text-sm truncate ${unread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            {typingConversations[conversation._id] || typingConversations[conversation.id] ? (
              <span className="text-orange-600 font-bold animate-pulse">Typing...</span>
            ) : (
              conversation.lastMessage || t('chat.conversation.noMessages')
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white min-h-0">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {t('chat:header.title')}
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('chat:header.searchPlaceholder')}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('chat:conversation.aria.searchInput')}
          />
          <MagnifyingGlassIcon
            className="absolute right-3 top-3 h-4 w-4 text-gray-400"
            aria-label={t('chat:conversation.aria.searchButton')}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div
        className="flex-1 overflow-y-auto min-h-0 chat-scrollbar"
        style={{
          height: 'calc(100vh - 220px)',
          minHeight: '300px',
        }}
      >
        {loading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonChatListItem key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchConversations()}
              className="btn btn-secondary"
            >
              Try again
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <InboxArrowDownIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No conversations</h3>
            <p className="text-sm text-gray-500">{t('chat:empty.noConversations')}</p>
          </div>
        ) : (
          filteredConversations.map(renderConversationItem)
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
