'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { RootState } from '../store/store';

interface User {
  id: string;
  name: string;
  isSeller: boolean;
}

const withAuth = <P extends object>(
  Component: ComponentType<P>,
  allowedRoles: ('seller' | 'buyer')[],
) => {
  return function ProtectedRoute(props: P) {
    const user = useSelector(
      (state: RootState) => state.auth.user as unknown as User | null,
    );

    const router = useRouter();

    useEffect(() => {
      if (!user) {
        router.push('/login'); // Redirect if not logged in
      } else if (
        !allowedRoles.includes(user.isSeller ? 'seller' : 'buyer') // Check if role is allowed
      ) {
        router.push('/unauthorized');
      }
    }, [user, router]);

    if (!user || !allowedRoles.includes(user.isSeller ? 'seller' : 'buyer')) {
      return null; // Prevent rendering before redirect
    }

    return <Component {...props} />;
  };
};

export default withAuth;
