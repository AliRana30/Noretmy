'use client';

import ProfileSection from '@/components/shared/Profile';
import { SkeletonProfileHeader } from '@/components/shared/Skeletons';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const Profile = () => {
  const router = useRouter();
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info('Please sign in to view your profile', {
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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <SkeletonProfileHeader />
          <div className="mt-6 grid gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="skeleton h-6 w-32 mb-4" />
              <div className="space-y-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="skeleton h-6 w-40 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton h-20" />
                <div className="skeleton h-20" />
                <div className="skeleton h-20" />
                <div className="skeleton h-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <ProfileSection />
      </div>
    </main>
  );
};

export default Profile;
