import React from 'react';
// import Linkedinicon from '../svg/Linkedinicon';
// import Link from 'next/link';
import Image from 'next/image';

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  rating: number;
  feedback: string;
  image: string;
}

const IndusryTestCard = (props: TestimonialCardProps) => {
  return (
    <>
      <div className="w-full rounded-3xl p-10 border-[1px] bg-white min-h-[300px] h-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src={props.image}
              alt={props.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-[80px] grayscale"
            />
            <div>
              <h3 className="text-lg font-semibold text-dark-nameclr">
                {props.name}
              </h3>
              <p className="text-sm text-dark-ceoclr">
                {props.role} at {props.company}
              </p>
            </div>
          </div>
          {/* <Link href="#" className="ml-auto">
            <Linkedinicon />
          </Link> */}
        </div>

        <div className="flex items-center my-4">
          {[...Array(props.rating)].map((_, i) => (
            <svg
              key={i}
              className="w-5 h-5 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 .587l3.668 7.568L24 9.753l-6 5.822 1.416 8.411L12 18.812l-7.416 4.174L6 15.575 0 9.753l8.332-1.598L12 .587z" />
            </svg>
          ))}
          <p className="ml-2 text-gray-600">{props.rating}.0</p>
        </div>
        <p className="text-hh4 text-black">{props.feedback}</p>
      </div>
    </>
  );
};

export default IndusryTestCard;
