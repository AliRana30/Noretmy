import { StaticImport } from 'next/dist/shared/lib/get-img-props';
import Image from 'next/image';
import Paragraph from '@/components/ui/Paragraph';

interface TestimonialCardProps {
  description: string;
  image: string | StaticImport;
  name: string;
  attribute: string;
  blur?: boolean;
}

const TestimonialCard = (props: TestimonialCardProps) => {
  return (
    <div className={`bg-light-white w-[303px] h-[400px] max-w-xs rounded-2xl flex flex-col items-center p-6 shadow-md mb-1 transition-all duration-300 ${props.blur ? 'filter blur-sm opacity-60' : ''}`}>
      <div className="flex-grow">
        <Paragraph title={props.description} color="black"></Paragraph>
      </div>
      <div className="flex flex-col items-center text-center mt-10">
        <Image
          className="w-[87px] h-[87px] rounded-full mix-blend-luminosity"
          src={props.image}
          width={87}
          height={87}
          alt="Logo"
        />
        <div className="mt-2">
          <Paragraph title={props.name} color="dark-nameclr"></Paragraph>
          <p className="text-dark-ceoclr text-p2">{props.attribute}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
