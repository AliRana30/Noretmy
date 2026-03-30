'use client';

import AddJobScreen from '@/components/shared/CreateGig';
import { StoreProvider } from '@/store/StoreProvider';
import withAuth from '@/util/withAuth';

const AddJob = () => {
  return (
    <StoreProvider>
      <main className="overflow-x-hidden">
        <AddJobScreen />
      </main>
    </StoreProvider>
  );
};

export default withAuth(AddJob, ['seller']);
