'use client';
import React, { useState, useEffect } from 'react';
import IndusryTestCard from '@/components/ui/IndusryTestCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const IndustryTestimonial = () => {
  const slides = [
    {
      name: 'Jason Wong',
      role: 'CEO',
      company: 'Omnicharge',
      rating: 5,
      feedback:
        'The innovative solutions provided by Noretmyhave allowed us to scale rapidly and stay ahead in a competitive tech landscape. Their support has been instrumental in our success.',
      image: '/icons/maleicon.png',
    },
    {
      name: 'Audrey Wyrick',
      role: 'Senior Product Marketing Manager',
      company: 'Cengage Group',
      rating: 5,
      feedback:
        'The solutions provided by Noretmyhave revolutionized our approach to education. From advanced learning technologies to streamlined administration, they have been a critical partner in our success',
      image: '/images/testimonial4.png',
    },
    {
      name: 'Maria Banks',
      role: 'Global Campaign Manager',
      company: 'CompanyX',
      rating: 5,
      feedback:
        'The project management solutions from Noretmyhave been instrumental in completing our projects on time and within budget. Their expertise has also set us apart from the competition',
      image: '/images/testimonial2.jpg',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState(1);

  const cardsPerSlide = () => {
    if (window.innerWidth >= 1280) return 3;
    if (window.innerWidth >= 1024) return 2.5;
    if (window.innerWidth >= 768) return 2;
    if (window.innerWidth >= 640) return 2;
    return 1.7;
  };

  useEffect(() => {
    const handleResize = () => {
      setVisibleSlides(cardsPerSlide());
    };

    if (typeof window !== 'undefined') {
      setVisibleSlides(cardsPerSlide());
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const handlePrevClick = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + slides.length) % slides.length,
    );
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between p-5 md:p-10 mt-10">
        <p className="text-hh7 md:text-hh10 lg:text-hh11 font-bold max-w-[580px]">
          What our clients say about our services
        </p>
        <div className="flex justify-center md:justify-end">
          <div className="p-3">
            <button
              onClick={handlePrevClick}
              className="transform text-black w-8 h-8 md:w-14 md:h-14 items-center justify-center flex bg-light-cutomwhite rounded-[56px] hover:shadow-md"
            >
              <ChevronLeft />
            </button>
          </div>
          <div className="p-3">
            <button
              onClick={handleNextClick}
              className="transform text-black w-8 h-8 md:w-14 md:h-14 items-center justify-center flex bg-light-cutomwhite rounded-[56px] hover:shadow-md"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden w-full max-w-[90vw] md:max-w-[100vw] sm:mx-10 mx-5 mb-10">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${(currentIndex * 100) / visibleSlides}%)`,
            width: `${slides.length * (100 / visibleSlides)}%`,
          }}
        >
          {slides.map((testimonial, idx) => (
            <div
              key={idx}
              className="w-full flex-shrink-0 p-4"
              style={{ width: `${100 / visibleSlides}%` }}
            >
              <IndusryTestCard key={idx} {...testimonial} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default IndustryTestimonial;
