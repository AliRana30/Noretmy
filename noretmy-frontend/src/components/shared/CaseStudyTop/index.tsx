import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { Next } from '@/components/svg/Next';

const CaseStudyTop = () => {
  return (
    <>
      <div className="bg-light-background min-w-full flex flex-col lg:flex-row items-center justify-center px-14 lg:px-20 lg:py-16 gap-8">
        {/* Text Section */}
        <div className="lg:w-1/2 w-full text-left flex flex-col justify-between space-y-8">
          {/* Seller Avatar and Name */}
          <div className="flex items-center gap-4">
            <Image
              src="/images/casestudymain.jpg" // Replace with actual seller avatar URL
              alt="Seller Avatar"
              width={50}
              height={50}
              className="rounded-full"
            />
            <p className="text-orange-case text-lg font-semibold">
              Waleed Ahmad
            </p>
          </div>

          {/* Gig Title */}
          <p className="text-2xl lg:text-3xl font-bold text-black">
            I will be your tutor for the rest of your life
          </p>

          {/* Gig Description */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Gig Description
            </h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              Discover how this gig delivers innovative solutions to help
              businesses achieve their goals. Whether you're starting out or
              scaling up, we've got you covered.
            </p>
          </div>

          {/* Contact Button */}
          <Link href={'/#about-us'}>
            <div>
              <button className="bg-orange-button text-white px-6 gap-3 py-3 rounded-xl hover:bg-orange-600 flex items-center">
                Contact Us
                <Next />
              </button>
            </div>
          </Link>
        </div>

        {/* Image Section */}
        <div className="lg:w-1/2 w-full flex justify-center">
          <div className="bg-white p-3 pb-7 text-justify rounded-2xl shadow-md">
            <Image
              src="/images/casestudymain.jpg"
              alt="Gig Success Story"
              width={600}
              height={300}
              className="rounded-lg"
            />
            <Link href="/industry">
              <p className="text-dark-p4 mt-7 ml-5 underline text-base font-semibold">
                Learn More
              </p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CaseStudyTop;
