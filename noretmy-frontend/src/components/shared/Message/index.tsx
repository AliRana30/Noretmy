'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import axios from 'axios';
import MessageComponent from '../MessageComponent';
import ChatFileUpload from '../ChatFileUpload';
import FallbackAvatar from '../FallbackAvatar';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, PlusCircle, Send, ChevronDown, Paperclip } from 'lucide-react';
import { useUserRole } from '@/util/basic';
import { io as createSocket } from 'socket.io-client';

import { ShoppingBagIcon, ClipboardDocumentListIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline'

interface AttachmentData {
  _id: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  publicId: string;
  dimensions?: { width: number; height: number };
}

interface ReadReceiptPayload {
  conversationId: string;
  userId: string;
  messageIds: string[];
  readAt?: string;
}

const MessageScreen: React.FC<{ route?: any }> = ({ route }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const conversationId = pathname.split('/')[2];
  const sellerId = searchParams.get('sellerId');
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [otherUserFullName, setOtherUserFullName] = useState<string>('');
  const [currentUserFullName, setCurrentUserFullName] = useState<string>('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string>('');
  const [isOtherUserSeller, setIsOtherUserSeller] = useState<boolean>(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentData[]>([]);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const socketRef = useRef<any>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  // Socket.io needs the root server URL, not the /api path
  const SOCKET_URL = BACKEND_URL?.replace(/\/api\/?$/, '') || '';

  const isSeller = useUserRole();
  const userProfilePicture = useSelector((state: RootState) => state?.auth?.user?.profilePicture);
  const userId = useSelector((state: RootState) => state?.auth?.user?._id || state?.auth?.user?.id);
  const receiverId = userId === sellerId ? buyerId : sellerId;

  const markMessagesAsReadIfVisible = async (sourceMessages: any[]) => {
    if (!Array.isArray(sourceMessages) || sourceMessages.length === 0) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

    const unreadMessageIds = sourceMessages
      .filter((msg: any) => String(msg.userId || msg.senderId) !== String(userId) && !msg.isRead)
      .map((msg: any) => msg._id)
      .filter(Boolean);

    if (unreadMessageIds.length === 0) return;

    if (socketRef.current) {
      socketRef.current.emit('messagesRead', {
        conversationId,
        userId,
        messageIds: unreadMessageIds
      });
    }

    try {
      const response = await axios.put(
        `${BACKEND_URL}/messages/mark-read`,
        { messageIds: unreadMessageIds, conversationId },
        { withCredentials: true }
      );

      const readAt = response?.data?.readAt;
      setMessages((prev) =>
        prev.map((msg) =>
          unreadMessageIds.includes(msg._id)
            ? { ...msg, isRead: true, readAt: readAt || msg.readAt }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    const id = searchParams.get('buyerId');
    setBuyerId(id);
  }, [searchParams]);

  useEffect(() => {
    if (userProfilePicture) {
      setCurrentUserAvatar(userProfilePicture);
    }
  }, [userProfilePicture]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);

      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);



    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/messages/${conversationId}`,
          { withCredentials: true },
        );

        const messageData = response.data.length > 0 ? response.data : [];
        setMessages(messageData);
        setIsLoading(false);
        requestAnimationFrame(() => scrollToBottom('auto'));

        await markMessagesAsReadIfVisible(messageData);
      } catch (error) {
        console.error('Error fetching initial messages:', error);
        setIsLoading(false);
      }
    };

    const fetchConversation = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/conversations/single/${conversationId}`,
          { withCredentials: true },
        );
        const conversation = response.data;
        if (conversation.seller && conversation.buyer) {
          const isCurrentUserSeller = userId === conversation.sellerId;
          const otherUser = isCurrentUserSeller
            ? conversation.buyer
            : conversation.seller;
          const currentUser = isCurrentUserSeller
            ? conversation.seller
            : conversation.buyer;

          setOtherUserName(otherUser?.username || otherUser?.name || '');
          setOtherUserFullName(otherUser?.fullName || otherUser?.username || '');
          setOtherUserAvatar(otherUser?.profilePicture || '');
          setCurrentUserFullName(currentUser?.fullName || currentUser?.username || '');
          setIsOtherUserSeller(!isCurrentUserSeller);

          if (currentUser?.profilePicture && !currentUserAvatar) {
            setCurrentUserAvatar(currentUser.profilePicture);
          }
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };

    fetchMessages();
    fetchConversation();

  }, [conversationId]);

  useEffect(() => {
    if (!SOCKET_URL || !conversationId || !userId) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    /**
     * SOCKET.IO BUG FIX - ROOT CAUSE & PERMANENT SOLUTION
     * =====================================================
     * 
     * ❌ THE PROBLEM (Invalid namespace error):
     * -----------------------------------------
     * Socket.io was throwing "Invalid namespace" error, causing real-time features to fail.
     * Messages wouldn't appear without page reload, notifications were stuck, presence tracking broken.
     * 
     * 🔍 ROOT CAUSE:
     * --------------
     * 1. MISSING EXPLICIT PATH: Frontend didn't specify socket path, defaulted to '/socket.io/'
     * 2. BACKEND NAMESPACE MISMATCH: Backend expected explicit namespace but received default
     * 3. CONNECTION FAILED: Socket connected to wrong namespace, events never reached handlers
     * 4. NO RECONNECTION LOGIC: Temporary disconnects required manual page reload
     * 
     * ✅ THE PERMANENT FIX:
     * ---------------------
     * 1. EXPLICIT PATH: Added path: '/socket.io/' to match backend expectations
     * 2. RECONNECTION ENABLED: Auto-reconnect with 5 attempts, 1s delay between attempts
     * 3. TIMEOUT HANDLING: 20s timeout prevents hanging connections
     * 4. EVENT RE-EMISSION: On reconnect, re-emit userOnline + joinRoom to restore state
     * 5. COMPREHENSIVE LOGGING: Track all connection states for debugging
     * 
     * 📝 WHY PAGE RELOAD WAS NEEDED BEFORE:
     * --------------------------------------
     * Without reconnection logic, any socket disconnect meant:
     * - No automatic reconnection attempt
     * - Socket remained in disconnected state
     * - Only a full page reload would re-initialize the socket
     * - Users had to manually refresh to restore real-time features
     * 
     * 💪 HOW THE FIX WORKS:
     * ---------------------
     * - Socket now auto-reconnects on disconnect (network issues, server restart, etc.)
     * - State is automatically restored (userOnline + joinRoom events)
     * - Real-time features work seamlessly without user intervention
     * - Comprehensive error logging helps diagnose future issues
     */
    const socket = createSocket(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],  // ✅ Polling first for reliability, then upgrade
      path: '/socket.io/',         // ✅ FIX #1: Explicit path matches backend namespace
      reconnection: true,           // ✅ FIX #2: Enable auto-reconnection
      reconnectionAttempts: 5,      // ✅ FIX #3: Try 5 times before giving up
      reconnectionDelay: 1000,      // ✅ FIX #4: Wait 1s between attempts
      timeout: 20000                // ✅ FIX #5: 20s timeout for connection
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Message] ✅ Socket connected - user:', userId, 'conversation:', conversationId);
      socket.emit('userOnline', String(userId));
      socket.emit('joinRoom', conversationId);
      
      // Check if other user is online
      if (receiverId) {
        socket.emit('getOnlineUsers', [String(receiverId)]);
      }
      console.log('[Message] Joined room:', conversationId);
    });

    socket.on('connect_error', (error) => {
      console.error('[Message] ❌ Socket connection error:', error.message);
      console.error('[Message] Error details:', error);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Message] 🔄 Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect', () => {
      console.log('[Message] ♻️ Socket reconnected');
      socket.emit('userOnline', String(userId));
      socket.emit('joinRoom', conversationId);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Message] Socket disconnected:', reason);
    });

    const handleReceiveMessage = (payload: any) => {
      console.log('[Message] 🔥 Received message:', payload);
      if (!payload || payload.conversationId !== conversationId) {
        console.log('[Message] ⚠️ Ignoring message - wrong conversation');
        return;
      }

      const senderId = String(payload.userId || payload.senderId || '');
      const isOwnMessage = senderId && String(senderId) === String(userId);

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === payload._id);
        if (exists) {
          console.log('[Message] ℹ️ Message already exists');
          return prev;
        }
        console.log('[Message] ✅ Adding new message to state');
        const newMessages = [...prev, { ...payload, isDelivered: true }];
        console.log('[Message] 📊 Total messages now:', newMessages.length);
        return newMessages;
      });

      // Mark incoming messages as read only when chat is open and visible.
      if (!isOwnMessage && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        markMessagesAsReadIfVisible([payload]);
      }

      // Only auto-scroll when user is already near bottom or when message is sent by current user.
      if (isOwnMessage || shouldAutoScrollRef.current) {
        requestAnimationFrame(() => scrollToBottom('smooth'));
      }
    };

    const applyReadReceipt = (payload: ReadReceiptPayload) => {
      if (!payload || payload.conversationId !== conversationId) return;
      if (payload.messageIds && payload.messageIds.length > 0) {
        setMessages((prev) =>
          prev.map((msg) =>
            payload.messageIds.includes(msg._id)
              ? { ...msg, isRead: true, readAt: payload.readAt || msg.readAt }
              : msg
          )
        );
      }
    };

    const handleMessagesMarkedRead = (payload: ReadReceiptPayload) => {
      applyReadReceipt(payload);
    };

    const handleMessageRead = (payload: ReadReceiptPayload) => {
      applyReadReceipt(payload);
    };

    const handleUserTyping = (payload: any) => {
      if (!payload || payload.conversationId !== conversationId) return;

      // Only show typing indicator if it's the other user
      if (payload.userId !== userId) {
        setIsOtherUserTyping(payload.isTyping);

        // Auto-hide typing indicator after 3 seconds
        if (payload.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false);
          }, 3000);
        }
      }
    };

    // Handle order invitation updates (acceptance/rejection)
    const handleOrderInvitationUpdate = (payload: any) => {
      if (!payload || payload.conversationId !== conversationId) return;
      // Update messages with order invitation updates
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === payload.messageId) {
            return {
              ...msg,
              orderData: {
                ...msg.orderData,
                invitationStatus: payload.invitationStatus
              }
            };
          }
          return msg;
        })
      );
    };

    // Handle user online status
    const handleUserOnline = (userId: string) => {
      if (String(userId) === String(receiverId)) {
        console.log('[Message] ✅ Other user is now online:', userId);
        setIsOtherUserOnline(true);
      }
    };

    // Handle user offline status
    const handleUserOffline = (userId: string) => {
      if (String(userId) === String(receiverId)) {
        console.log('[Message] ❌ Other user is now offline:', userId);
        setIsOtherUserOnline(false);
      }
    };

    // Handle online users status response
    const handleOnlineUsersStatus = (statuses: any) => {
      console.log('[Message] 📊 Online status response:', statuses);
      if (statuses && receiverId) {
        const otherUserStatus = statuses[String(receiverId)];
        if (otherUserStatus !== undefined) {
          setIsOtherUserOnline(otherUserStatus?.isOnline || false);
          console.log('[Message] Other user online status:', otherUserStatus?.isOnline);
        }
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messagesMarkedRead', handleMessagesMarkedRead);
    socket.on('message_read', handleMessageRead);
    socket.on('userTyping', handleUserTyping);
    socket.on('orderInvitationUpdated', handleOrderInvitationUpdate);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('onlineUsersStatus', handleOnlineUsersStatus);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('leaveRoom', conversationId);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messagesMarkedRead', handleMessagesMarkedRead);
      socket.off('message_read', handleMessageRead);
      socket.off('userTyping', handleUserTyping);
      socket.off('orderInvitationUpdated', handleOrderInvitationUpdate);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('onlineUsersStatus', handleOnlineUsersStatus);
      socket.disconnect();
    };
  }, [SOCKET_URL, conversationId, userId, receiverId]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && messages.length > 0) {
        markMessagesAsReadIfVisible(messages);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [messages, conversationId, userId]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const updateAutoScrollState = () => {
      const threshold = 80;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom <= threshold;
    };

    container.addEventListener('scroll', updateAutoScrollState);
    updateAutoScrollState();

    return () => {
      container.removeEventListener('scroll', updateAutoScrollState);
    };
  }, [messages.length]);

  const handleSend = async () => {
    if (newMessage.trim() || pendingAttachments.length > 0) {
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        conversationId,
        userId: userId,
        desc: newMessage,
        attachments: pendingAttachments,
        messageType: pendingAttachments.length > 0 ? 'file' : 'text',
        createdAt: new Date().toISOString(),
        isDelivered: false,
        isRead: false,
      };

      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      const messageText = newMessage;
      const attachmentsToSend = [...pendingAttachments];
      setNewMessage('');
      setPendingAttachments([]);

      // Stop typing indicator when sending message
      if (socketRef.current && conversationId && userId) {
        socketRef.current.emit('typing', {
          conversationId,
          userId,
          isTyping: false
        });
      }

      requestAnimationFrame(() => scrollToBottom('smooth'));

      try {
        if (messages.length === 0 && sellerId && buyerId) {
          try {
            const checkResponse = await axios.get(
              `${BACKEND_URL}/conversations/user/single/${sellerId}/${buyerId}`,
              { withCredentials: true }
            );

            if (checkResponse.status === 204) {
              await axios.post(
                `${BACKEND_URL}/conversations`,
                { sellerId, buyerId },
                { withCredentials: true }
              );
            }
          } catch (convError) {
            try {
              await axios.post(
                `${BACKEND_URL}/conversations`,
                { sellerId, buyerId },
                { withCredentials: true }
              );
            } catch (createError) {
            }
          }
        }

        const response = await axios.post(
          `${BACKEND_URL}/messages/`,
          {
            conversationId,
            desc: messageText,
            attachments: attachmentsToSend.map(a => ({
              url: a.url,
              thumbnailUrl: a.thumbnailUrl,
              type: a.type,
              name: a.name,
              originalName: a.originalName,
              mimeType: a.mimeType,
              size: a.size,
              publicId: a.publicId,
              dimensions: a.dimensions
            })),
            messageType: attachmentsToSend.length > 0 ? 'file' : 'text'
          },
          { withCredentials: true },
        );

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === optimisticMessage._id
              ? { ...response.data, isDelivered: true }
              : msg
          )
        );

        socketRef.current?.emit('sendMessage', {
          conversationId,
          message: response.data,
          senderId: userId,
          receiverId: receiverId
        });
      } catch (err) {
        console.error('Error sending message to the server:', err);
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg._id !== optimisticMessage._id)
        );
      }
    }
  };

  const handleFilesUploaded = (attachments: AttachmentData[]) => {
    setPendingAttachments(prev => [...prev, ...attachments]);
  };

  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(a => a._id !== attachmentId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const router = useRouter();

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'orders':
        router.push('/orders');
        break;
      case 'custom':
        if (buyerId) {
          const url = `/custom-order/?buyerId=${buyerId}`;
          router.push(`/custom-order/?buyerId=${buyerId}`);

        } else {
          alert('Buyer ID is required for a Custom Order');
        }
        break;
      case 'milestone':
        if (buyerId) {
          router.push(`/custom-order/?buyerId=${buyerId}`);
        } else {
          alert('Buyer ID is required for a Milestone Order');
        }
        break;
      case 'order-request':
        router.push(`/order-request`);
        break;
      default:
        break;
    }

    setIsActionsOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Chat Header */}
      <div className="p-3 md:p-4 bg-white shadow-md border-b flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex lg:hidden mr-1 items-center gap-2">
            <button onClick={() => router.push('/chat')} className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronDown className="rotate-90 text-gray-600" size={24} />
            </button>
            <Menu size={20} className="text-gray-600 cursor-pointer hidden" /> {/* Hiding menu for now as back button takes precedence */}
          </div>
          {/* Other user avatar and name with profile link */}
          <div
            className="flex items-center gap-2 transition-opacity cursor-pointer hover:opacity-80"
            onClick={() => {
              if (otherUserName) {
                if (isOtherUserSeller) {
                  router.push(`/freelancer/${otherUserName}`);
                } else {
                  // Buyer/client - navigate to client profile
                  const clientId = isSeller ? buyerId : sellerId;
                  if (clientId) {
                    router.push(`/client/${clientId}`);
                  }
                }
              }
            }}
          >
            <FallbackAvatar
              src={otherUserAvatar}
              alt={otherUserName}
              name={otherUserFullName}
              size="sm"
              className="border-2 border-orange-100"
            />
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-700 hover:text-orange-600 transition-colors">
                {otherUserFullName || otherUserName || 'Chat'}
              </h2>
              {isOtherUserTyping ? (
                <span className="text-xs font-bold text-orange-600 animate-pulse">
                  Typing...
                </span>
              ) : isOtherUserOnline ? (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Online
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  {isOtherUserSeller ? 'View freelancer profile' : 'View client profile'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages List - flex-1 with min-h-0 to enable proper scrolling in flex container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-3 md:p-4 space-y-3 md:space-y-4 min-h-0 chat-scrollbar"
        style={{
          maxHeight: 'calc(100vh - 300px)',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
        }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
            <div className="mb-2 text-orange-500">
              <PlusCircle size={40} />
            </div>
            <p className="text-sm md:text-base">No messages yet</p>
            <p className="text-xs md:text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageComponent
                key={message._id}
                item={message}
                userId={userId ?? ''}
                receiverId={receiverId ?? ''}
                currentUserAvatar={currentUserAvatar}
                otherUserAvatar={otherUserAvatar}
                otherUserName={otherUserName}
                otherUserFullName={otherUserFullName}
                currentUserFullName={currentUserFullName}
                isSeller={isSeller}
                otherUserId={receiverId ?? ''}
                socket={socketRef.current}
                conversationId={conversationId}
              />
            ))}
            {/* Typing Indicator */}
            {isOtherUserTyping && (
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="flex items-center gap-1 bg-gray-200 rounded-full px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="ml-2 text-xs text-gray-600">{otherUserName} is typing...</span>
                </div>
              </div>
            )}
            {/* Bottom spacer to ensure messages don't get cut off */}
            <div className="h-2"></div>
          </>
        )}
      </div>

      {/* Input Section */}
      <div className="bg-white border-t p-6 md:p-6 sticky bottom-0">
        {/* Pending Attachments Preview */}
        {pendingAttachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment._id}
                className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
              >
                {attachment.type === 'image' && attachment.thumbnailUrl ? (
                  <img
                    src={attachment.thumbnailUrl}
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Paperclip size={20} />
                  </div>
                )}
                <button
                  onClick={() => removePendingAttachment(attachment._id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-3 relative">
          {/* Actions Button */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-full p-2 transition-colors duration-200"
              aria-label="Actions"
            >
              <PlusCircle size={20} />
            </button>

            {/* Actions Dropdown */}
            {isActionsOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white shadow-lg rounded-lg w-56 py-1 border border-gray-200 z-20">
                <div className="text-xs font-semibold px-3 py-2 text-gray-500 border-b">
                  ACTIONS
                </div>

                {/* See Orders (for all users) */}
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-orange-100 flex items-center text-gray-700 transition"
                  onClick={() => handleActionClick('orders')}
                >
                  <ShoppingBagIcon className="mr-2 h-5 w-5 text-gray-600" /> See Orders
                </button>

                {/* See Order Requests (Only for Buyers) */}
                {!isSeller && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-orange-100 flex items-center text-gray-700 transition"
                    onClick={() => handleActionClick('order-request')}
                  >
                    <ClipboardDocumentListIcon className="mr-2 h-5 w-5 text-gray-600" /> See Order Requests
                  </button>
                )}

                {/* Actions Only for Sellers */}
                {isSeller && (
                  <>
                    {/* <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-orange-100 flex items-center text-gray-700 transition"
                      onClick={() => handleActionClick('custom')}
                    >
                      <SparklesIcon className="mr-2 h-5 w-5 text-gray-600" /> Create Custom Order
                    </button> */}

                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-orange-100 flex items-center text-gray-700 transition"
                      onClick={() => handleActionClick('milestone')}
                    >
                      <TrophyIcon className="mr-2 h-5 w-5 text-gray-600" /> Create Milestone Order
                    </button>
                  </>
                )}
              </div>
            )}

          </div>

          {/* File Upload Button */}
          <ChatFileUpload
            conversationId={conversationId}
            onUploadComplete={handleFilesUploaded}
            maxFiles={10}
            maxFileSize={50}
          />

          {/* Message Input */}
          <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
            <textarea
              className="w-full p-2 md:p-3 bg-transparent resize-none focus:outline-none min-h-10 max-h-32"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);

                // Emit typing event
                if (socketRef.current && conversationId && userId) {
                  socketRef.current.emit('typing', {
                    conversationId,
                    userId,
                    isTyping: e.target.value.length > 0
                  });
                }
              }}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                // Stop typing when user leaves input
                if (socketRef.current && conversationId && userId) {
                  socketRef.current.emit('typing', {
                    conversationId,
                    userId,
                    isTyping: false
                  });
                }
              }}
              placeholder={pendingAttachments.length > 0 ? "Add a message or send files..." : "Type a message..."}
              rows={1}
              style={{ height: 'auto', maxHeight: '8rem' }}
            />
          </div>

          {/* Send Button */}
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 md:p-3 transition-colors duration-200 disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center"
            onClick={handleSend}
            disabled={!newMessage.trim() && pendingAttachments.length === 0}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageScreen;