'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import axios from 'axios';
import moment from 'moment';
import { useRouter } from 'next/navigation';
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

const ChatScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslations();

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

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
      setConversations(response.data);
    } catch (err) {
      setError(t('chat.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, t, user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const markAsRead = useCallback(async (conversationId: string) => {
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

    return (
      <div
        key={conversation._id}
        className={`relative flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${unread ? 'bg-orange-50/50' : 'bg-white'
          }`}
        onClick={() => {
          handleSelectConversation(
            conversation.id,
            conversation.sellerId,
            conversation.buyerId
          );
          if (unread) {
            markAsRead(conversation._id);
          }
        }}
      >
        <div className="relative flex-shrink-0">
          <Image
            src={otherParty.profilePicture || '/api/placeholder/48/48'}
            alt={t('chat.conversation.aria.userAvatar', { username: otherParty.username })}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
          {unread && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-orange-500 ring-2 ring-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
            <h3 className={`font-medium truncate ${unread ? 'text-gray-900' : 'text-gray-700'}`}>
              {otherParty.username}
            </h3>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {moment(conversation.updatedAt).fromNow()}
            </span>
          </div>
          <p className={`text-sm truncate ${unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
            {conversation.lastMessage || t('chat.conversation.noMessages')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
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
      <div className="flex-1 overflow-y-scroll">
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
