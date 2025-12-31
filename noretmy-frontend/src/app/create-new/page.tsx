'use client';

import AddJobScreen from '@/components/shared/CreateGig';
import { StoreProvider } from '@/store/StoreProvider';
import withAuth from '@/util/withAuth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddJob = () => {
  return (
    <StoreProvider>
      <main className="overflow-x-hidden">
        <AddJobScreen />
        <ToastContainer />
      </main>
    </StoreProvider>
  );
};

export default withAuth(AddJob, ['seller']);
