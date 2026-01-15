'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import axios from 'axios';
import MessageComponent from '../MessageComponent';
import ChatFileUpload from '../ChatFileUpload';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, PlusCircle, Send, ChevronDown, Paperclip } from 'lucide-react';
import { useUserRole } from '@/util/basic';

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

const MessageScreen: React.FC<{ route?: any }> = ({ route }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const conversationId = pathname.split('/')[2];
  const sellerId = searchParams.get('sellerId');
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string>('');
  const [isOtherUserSeller, setIsOtherUserSeller] = useState<boolean>(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentData[]>([]);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const isSeller = useUserRole();
  const userProfilePicture = useSelector((state: RootState) => state?.auth?.user?.profilePicture);
  const userId = useSelector((state: RootState) => state?.auth?.user?._id || state?.auth?.user?.id);
  const receiverId = userId === sellerId ? buyerId : sellerId;

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

        setMessages(response.data.length > 0 ? response.data : []);
        setIsLoading(false);
        setTimeout(scrollToBottom, 100); // Scroll after render
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
          setOtherUserAvatar(otherUser?.profilePicture || '');
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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

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
      };

      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      const messageText = newMessage;
      const attachmentsToSend = [...pendingAttachments];
      setNewMessage('');
      setPendingAttachments([]);
      setTimeout(scrollToBottom, 50);

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
            msg._id === optimisticMessage._id ? response.data : msg
          )
        );
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
    <div className="flex flex-col h-full w-full lg:w-3/4 md:w-5/6 bg-gray-50">
      {/* Chat Header */}
      <div className="p-3 md:p-4 bg-white shadow-md border-b flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="block lg:hidden mr-1 flex items-center gap-2">
            <button onClick={() => router.push('/chat')} className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronDown className="rotate-90 text-gray-600" size={24} />
            </button>
            <Menu size={20} className="text-gray-600 cursor-pointer hidden" /> {/* Hiding menu for now as back button takes precedence */}
          </div>
          {/* Other user avatar and name with profile link */}
          <div
            className={`flex items-center gap-2 transition-opacity ${isOtherUserSeller ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={() => {
              if (otherUserName && isOtherUserSeller) {
                router.push(`/freelancer/${otherUserName}`);
              }
            }}
          >
            {otherUserAvatar && (
              <img
                src={otherUserAvatar}
                alt={otherUserName}
                className="w-9 h-9 rounded-full object-cover border-2 border-orange-100"
              />
            )}
            <div>
              <h2 className={`text-base md:text-lg font-bold text-gray-700 ${isOtherUserSeller ? 'hover:text-orange-600 transition-colors' : ''}`}>
                {otherUserName || 'Chat'}
              </h2>
              {isOtherUserSeller && (
                <span className="text-xs text-gray-400">View freelancer profile</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages List - flex-1 with min-h-0 to enable proper scrolling in flex container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0"
        style={{ scrollBehavior: 'smooth' }}
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
                isSeller={isSeller}
                otherUserId={receiverId ?? ''}
              />
            ))}
            {/* Bottom spacer to ensure messages don't get cut off */}
            <div className="h-2"></div>
          </>
        )}
      </div>

      {/* Input Section */}
      <div className="bg-white border-t p-3 md:p-4 sticky bottom-0">
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
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
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