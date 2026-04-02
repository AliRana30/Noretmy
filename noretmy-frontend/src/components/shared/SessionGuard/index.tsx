'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/store/authSlice';

const SessionGuard = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: any) => state?.auth?.user);
  const [deletedReason, setDeletedReason] = useState<string | null>(null);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!user?.id || checkingRef.current) return;

    let active = true;

    const handleInvalidSession = (reason?: string) => {
      dispatch(logoutUser());
      if (reason) {
        setDeletedReason(reason);
      }

      if (pathname !== '/login') {
        router.replace('/login');
      }
    };

    const checkSession = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session-status`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!active) return;

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          if (payload?.code === 'ACCOUNT_DELETED') {
            handleInvalidSession(payload?.reason || 'Deleted by admin');
            return;
          }

          if (response.status === 401 || response.status === 403) {
            handleInvalidSession();
          }
        }
      } catch (error) {
        // Silently ignore transient network errors; next interval/focus retry handles recovery.
      } finally {
        checkingRef.current = false;
      }
    };

    checkSession();

    const intervalId = setInterval(checkSession, 45000);
    const onFocus = () => checkSession();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkSession();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      checkingRef.current = false;
    };
  }, [dispatch, pathname, router, user?.id]);

  if (!deletedReason) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900">Account Deleted</h2>
        <p className="mt-3 text-slate-600">
          Your account has been deleted by an administrator.
        </p>
        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Reason:</span> {deletedReason}
          </p>
        </div>
        <button
          onClick={() => setDeletedReason(null)}
          className="mt-6 w-full rounded-lg bg-orange-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-orange-600"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SessionGuard;