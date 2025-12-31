'use client';
import React, { useState, useEffect } from 'react';
import Heading from '@/components/ui/Heading';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Paragraph from '@/components/ui/Paragraph';
import Image from 'next/image';
import ReadMoreIcon from '@/components/ui/ReadMoreIcon';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

interface CompaniesProps {
  id: string;
}

const CompaniesThrive: React.FC<CompaniesProps> = ({ id }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslations();

  const slides = t('home:companiesThrive.slides', { returnObjects: true }) as Array<{
    description: string;
    image: string;
  }>;

  const handlePrevClick = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + slides.length) % slides.length,
    );
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };
  const [translateValue, setTranslateValue] = useState(100);

  useEffect(() => {
    const getTranslateValue = () => {
      if (window.innerWidth >= 1200) {
        return 83;
      }
      if (window.innerWidth >= 1024) {
        return 68;
      }
      if (window.innerWidth >= 992) {
        return 48;
      }
      if (window.innerWidth >= 768) {
        return 48;
      }
      if (window.innerWidth < 768) {
        return 33;
      }
      return 83;
    };

    setTranslateValue(getTranslateValue());
    const handleResize = () => {
      setTranslateValue(getTranslateValue());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section id={id} className="container mx-auto px-4">
      <div className="mt-16 lg:mt-32">
        <div className="lg:ml-36 text-center lg:text-left">
          <Heading
            color={'black'}
            title={t('home:companiesThrive.header.title')}
          />
          <p className="text-p3 text-dark-ceoclr">
            {t('home:companiesThrive.header.subtitle')}
          </p>
        </div>
        <div className="mt-7 xl:ml-36">
          <div className="relative overflow-hidden mb-10">
            <div className="flex justify-center lg:justify-end lg:mr-40 mb-3">
              <div className="p-3">
                <button
                  onClick={handlePrevClick}
                  className="transform text-dark-arrow w-14 h-14 items-center justify-center flex bg-light-cutomwhite rounded-[56px] p-3 hover:shadow-md"
                  aria-label={t('home:companiesThrive.aria.prevSlide')}
                >
                  <ChevronLeft />
                </button>
              </div>
              <div className="p-3">
                <button
                  onClick={handleNextClick}
                  className="transform text-dark-arrow w-14 h-14 items-center justify-center flex bg-light-cutomwhite rounded-[56px] p-43 hover:shadow-md"
                  aria-label={t('home:companiesThrive.aria.nextSlide')}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
            <div className="flex overflow-hidden relative">
              <div
                className="flex transition-transform duration-500"
                style={{
                  transform: `translateX(-${currentIndex * translateValue}%)`,
                }}
              >
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 transition-transform duration-500 w-[30%] xl:w-[80%] lg:w-[65%] md:w-[45%] mr-10`}
                  >
                    <div className="w-full flex flex-col lg:flex-row items-center justify-center bg-light-white rounded-2xl mx-2">
                      <div className="lg:w-1/2 p-7">
                        <div>
                          <Image
                            src="/logo/openai.png"
                            alt={t('home:companiesThrive.aria.openAiLogo')}
                            width={87}
                            height={36}
                          />
                        </div>
                        <div className="hover:underline text-dark-ceoclr">
                          <p className="text-hh4 lg:text-hh6 text-dark-p4 font-semibold mt-3 w-full">
                            {slide.description}
                          </p>
                        </div>
                        <div className="flex gap-12 mt-3">
                          <div className="flex flex-col">
                            <p className="text-h2 text-orange-primary font-bold">
                              {t('home:companiesThrive.stats.clickThrough.value')}
                            </p>
                            <Paragraph
                              color={'dark-ceoclr'}
                              title={t('home:companiesThrive.stats.clickThrough.label')}
                            />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-h2 text-orange-primary font-bold">
                              {t('home:companiesThrive.stats.conversions.value')}
                            </p>
                            <Paragraph
                              color={'dark-ceoclr'}
                              title={t('home:companiesThrive.stats.conversions.label')}
                            />
                          </div>
                        </div>
                        <Link href={'/case-studies'}>
                          <div className="font-semibold flex items-center space-x-3 mt-3">
                            <ReadMoreIcon />
                            <Paragraph
                              color={'dark-secondary'}
                              title={t('home:companiesThrive.cta')}
                            />
                          </div>
                        </Link>
                      </div>
                      <div className="hidden lg:w-1/2 md:flex justify-end">
                        <Image
                          src={slide.image}
                          width={472}
                          height={429}
                          alt={t('home:companiesThrive.aria.caseStudyImage')}
                          className="w-[472px] h-[429px] border rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompaniesThrive;
