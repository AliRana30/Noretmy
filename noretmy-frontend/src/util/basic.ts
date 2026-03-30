import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

export const useUserRole = () => {
  const auth = useSelector((state: RootState) => state.auth);

  if (!auth?.user) return false; // Return false instead of null for consistent boolean checks

  const role = String((auth.user as any)?.role || '').toLowerCase();
  const isSeller = (auth.user as any)?.isSeller;
  
  // Handle both boolean and string isSeller values
  const hasSellerFlag = isSeller === true || isSeller === 'true' || isSeller === '1';
  const hasSellerRole = role === 'freelancer' || role === 'seller' || role === 'admin';
  
  return hasSellerFlag || hasSellerRole;
};
