import FAQScreen from '@/components/shared/FAQS';
// import DiveDeeper from '@/components/shared/DiveDeeper';
import { StoreProvider } from '@/store/StoreProvider';
const FAQS = () => {
  return (
    <StoreProvider>
      <main className="overflow-x-hidden">
       
        <FAQScreen />
      </main>
    </StoreProvider>
  );
};

export default FAQS;
