'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

interface Logo {
  src: string;
  alt: string;
}

const logos: Logo[] = [
  { src: '/logo/google.png', alt: 'googlelogo' },
  { src: '/logo/ailogo.png', alt: 'openailogo' },
  { src: '/logo/microsoft.png', alt: 'microsoftlogo' },
  { src: '/logo/linkedin.png', alt: 'linkedinlogo' },
  { src: '/logo/hubspot.png', alt: 'hubspotlogo' },
  { src: '/logo/meta.png', alt: 'metalogo' },
  { src: '/logo/webflow.png', alt: 'webflowlogo' },
  { src: '/logo/google.png', alt: 'googlelogo' },
  { src: '/logo/ailogo.png', alt: 'openailogo' },
  { src: '/logo/microsoft.png', alt: 'microsoftlogo' },
  { src: '/logo/linkedin.png', alt: 'linkedinlogo' },
  { src: '/logo/hubspot.png', alt: 'hubspotlogo' },
  { src: '/logo/meta.png', alt: 'metalogo' },
  { src: '/logo/webflow.png', alt: 'webflowlogo' },
];

const Certifications: React.FC = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      let scrollAmount = 0;
      const slideWidth = slider.scrollWidth / 2;
      const speed = 1;

      const moveSlider = () => {
        scrollAmount += speed;
        if (scrollAmount >= slideWidth) {
          scrollAmount = 0;
        }
        slider.scrollTo({
          left: scrollAmount,
          behavior: 'smooth',
        });
        requestAnimationFrame(moveSlider);
      };
      moveSlider();
    }
  }, []);

  return (
    <div className="mt-16 overflow-hidden">
      <p className="text-hh4 md:text-hh6 text-dark-secondary text-center">
        Our Clients
      </p>
      <div ref={sliderRef} className="mt-5 flex w-full">
        <div className="flex gap-20 items-center animate-logos">
          {logos.map((logo, index) => (
            <div key={index} className="flex-shrink-0">
              <Image
                src={logo.src}
                width={156}
                height={60}
                className="grayscale hover:grayscale-0 object-contain transition-all duration-300"
                alt={logo.alt}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Certifications;
