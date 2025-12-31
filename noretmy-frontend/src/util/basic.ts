import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

export const useUserRole = () => {
  const auth = useSelector((state: RootState) => state.auth);

  if (!auth?.user) return null; // No user is logged in
  return auth.user.isSeller ? true  : false;
};
