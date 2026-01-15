import FAQScreen from '@/components/shared/FAQS';
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
