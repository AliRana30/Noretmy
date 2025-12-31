'use client';
import React, { useState, useRef } from 'react';
import Heading from '@/components/ui/Heading';
import CardInclusive from '@/components/shared/CardInclusive';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { useTranslations } from '@/hooks/useTranslations';

interface ServicesProps {
  id: string;
}

const Services: React.FC<ServicesProps> = ({ id }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<any>(null);
  const { t } = useTranslations();

  const services = t('home:services.items', { returnObjects: true }) as Array<{
    title: string;
    description: string;
    image: string;
  }>;

  const handleHeadingClick = (index: number) => {
    setActiveIndex(index);
    if (swiperRef.current) {
      swiperRef.current.slideToLoop(index);
    }
  };

  return (
    <section id={id} className="bg-black text-white mt-20">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <Heading 
            title={t('home:services.header.title')} 
            color="orange-primary" 
          />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center">
          <div className="lg:w-1/2 mb-10 lg:mb-0 lg:pr-4 flex flex-col justify-start xl:px-24 lg:px-16 sm:px-20">
            {services.map((service, index) => (
              <div
                key={index}
                className="flex items-center mb-4 cursor-pointer"
                onClick={() => handleHeadingClick(index)}
                role="button"
                aria-label={t('home:services.aria.selectService', { service: service.title })}
                aria-pressed={activeIndex === index}
              >
                <p
                  className={`text-orange-primary mr-3 font-extrabold ${activeIndex === index ? 'block' : 'hidden'}`}
                  aria-hidden="true"
                >
                  ______
                </p>
                <p
                  className={`text-black mr-3 font-extrabold ${activeIndex !== index ? 'block' : 'hidden'}`}
                  aria-hidden="true"
                >
                  ______
                </p>
                <div className="flex items-center">
                  <Heading
                    title={service.title}
                    color={activeIndex === index ? 'orange-primary' : 'white'}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:w-1/2 flex justify-center items-center">
            <Swiper
              modules={[Autoplay]}
              autoplay={{ delay: 3000 }}
              loop={true}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              className="mySwiper"
            >
              {services.map((service, index) => (
                <SwiperSlide key={index}>
                  <CardInclusive
                    description={service.description}
                    buttoncontent={t('home:services.cta')}
                    image={service.image}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
