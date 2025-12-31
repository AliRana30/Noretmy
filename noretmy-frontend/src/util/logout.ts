import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/store/authSlice';
import axios from 'axios';

export const useLogout = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;


  const handleLogout = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/logout`);

      if (response.status === 200) {
        dispatch(logoutUser()); // Clear Redux state
        router.push('/login'); // Redirect to login page
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return handleLogout;
};
