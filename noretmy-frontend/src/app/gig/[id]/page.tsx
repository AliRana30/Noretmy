import GigDetailsSection from '@/components/shared/SingleGig';
import { ToastContainer } from 'react-toastify';

const GigDetailsPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;

  return (
    <main className="overflow-x-hidden">
      <ToastContainer />
      <GigDetailsSection id={id} />
    </main>
  );
  
};

export default GigDetailsPage;
