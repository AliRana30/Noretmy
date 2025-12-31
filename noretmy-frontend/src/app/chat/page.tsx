'use client';

import ChatScreen from '@/components/shared/Chat';
import { SkeletonChat } from '@/components/shared/Skeletons';
import { StoreProvider } from '@/store/StoreProvider';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const ChatContent = () => {
  const router = useRouter();
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info('Please sign in to access your messages', {
        position: 'top-center',
        autoClose: 3000,
      });
      router.push('/login');
      return;
    }
    setIsChecking(false);
  }, [isLoggedIn, router]);

  if (isChecking) {
    return (
      <div className="min-h-[calc(100vh-80px)] py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <SkeletonChat />
        </div>
      </div>
    );
  }


  return <ChatScreen />;
};

const Chat = () => {
  return (
    <StoreProvider>
      <main className="overflow-x-hidden">
        <ChatContent />
      </main>
    </StoreProvider>
  );
};

export default Chat;
