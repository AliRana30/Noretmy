import React from 'react';
import DiscoverMore from '@/components/svg/Discovermore';
import Like from '@/components/svg/Like';

const DiveDeeper = () => {
  return (
    <>
      <div className="mt-20 p-20">
        <p className="font-bold text-black text-3xl">
          Dive deeper and see how we deliver
        </p>
        <div className="bg-light-white mt-10 gap-6 p-8 rounded-3xl">
          <Like></Like>
          <div className="justify-between mt-3">
            <p className="text-dark-nameclr font-semibold text-lg">
              Our Approach
            </p>
            <p className="text-dark-p4 font-normal text-sm">
              Who are we? What drives us? Why Noretmy?
            </p>
            <p className="text-dark-p4 font-normal text-sm">
              Find answers to these and more.
            </p>
          </div>
          <div className="flex text-center mt-3">
            <p className="text-orange-primary text-[16px] font-medium">
              Discover
            </p>
            <DiscoverMore></DiscoverMore>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiveDeeper;
