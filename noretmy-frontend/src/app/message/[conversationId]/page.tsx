'use client';

import React, { useState, useEffect, Suspense } from 'react';
import MessageScreen from '@/components/shared/Message';
import ChatScreen from '@/components/shared/Chat';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { SkeletonChat } from '@/components/shared/Skeletons';

const MessageContent = ({ conversationId }: { conversationId: string }) => {
  const router = useRouter();
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error('Please sign in to access messages');
      router.push('/login');
      return;
    }
    setIsChecking(false);
  }, [isLoggedIn, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <SkeletonChat />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-160px)]">
          <div className="flex h-full">
            {/* Chat List - Smaller width */}
            <div className="hidden md:block md:w-64 lg:w-72 flex-shrink-0 border-r border-gray-200">
              <ChatScreen />
            </div>
            {/* Message Area - Larger space */}
            <div className="flex-1 min-w-0">
              <MessageScreen />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Message = ({ params }: { params: { conversationId: string } }) => {
  const { conversationId } = params;
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <SkeletonChat />
        </div>
      </div>
    }>
      <MessageContent conversationId={conversationId} />
    </Suspense>
  );
};

export default Message;
