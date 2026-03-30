import GigDetailsSection from '@/components/shared/SingleGig';

const GigDetailsPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;

  return (
    <main className="overflow-x-hidden">
      <GigDetailsSection id={id} />
    </main>
  );
  
};

export default GigDetailsPage;
