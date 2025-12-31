import React from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
interface CardProps {
  description: string;
  buttoncontent: string;
  image: string;
}

const CardInclusive: React.FC<CardProps> = (props) => {
  return (
    <div className="bg-light-white p-4 rounded-2xl max-w-md mx-auto flex flex-col items-center">
      <div className="w-full h-[358px] rounded-2xl overflow-hidden">
    <Image
  className="w-full h-full object-cover rounded-2xl"
  src={props.image}
  alt="Service image"
  fill
  sizes="100vw"
/>
      </div>
      <p className="text-p1 mt-6 text-black text-left">{props.description}</p>
      <Link href={'/industry'}>
        <div className="mt-6">
          <Button title={props.buttoncontent} />
        </div>
      </Link>
    </div>
  );
};

export default CardInclusive;
