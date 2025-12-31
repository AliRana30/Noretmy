'use client';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

interface SliderProps {
  id: string;
}

const Slider: React.FC<SliderProps> = ({ id }) => {
  const { t } = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoplayInterval = 5000;

  const slides = [
    {
      text: t('home:slider.slides.0.title'),
      description: t('home:slider.slides.0.description'),
      image: '/images/sliderpic.jpg',
    },
    {
      text: t('home:slider.slides.1.title'),
      description: t('home:slider.slides.1.description'),
      image: '/images/slider2.jpg',
    },
    {
      text: t('home:slider.slides.2.title'),
      description: t('home:slider.slides.2.description'),
      image: '/images/slider3.jpg',
    },
  ];

  const handlePrevClick = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + slides.length) % slides.length,
    );
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section id={id} className="relative w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-32 left-32 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-blue-50/20 to-orange-50/20 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="min-w-full relative z-10"
            >
              <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  
                  {/* Content */}
                  <div className="text-center lg:text-left space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-full px-4 py-2 shadow-sm">
                      <Sparkles size={16} className="text-blue-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Featured Solution
                      </span>
                    </div>

                    {/* Main Heading */}
                    <div className="space-y-6">
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[0.95]">
                        {slide.text}
                      </h1>
                      
                      <p className="text-xl lg:text-2xl text-slate-600 font-light leading-relaxed max-w-2xl">
                        {slide.description}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-4">
                      {/* <Link 
                        href="/industry" 
                        className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                      >
                        {t('home:slider.cta')}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                      </Link> */}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative lg:order-2">
                    <div className="relative">
                      {/* Main Image Container */}
                      <div className="relative w-full h-[500px] lg:h-[600px] bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
                        <Image
                          src={slide.image}
                          alt={slide.text}
                          fill
                          className="object-cover"
                          priority={index === 0}
                        />
                        
                        {/* Image Overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                      </div>

                      {/* Floating Badge */}
                      <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white p-3 rounded-full shadow-lg animate-pulse">
                        <Sparkles size={20} />
                      </div>
                      
                      {/* Bottom Badge */}
                      <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium backdrop-blur-sm">
                        <span role="img" aria-label="star">⭐</span> Premium Quality
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Navigation Buttons */}
        <button
          onClick={handlePrevClick}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm border border-white/50 rounded-full flex items-center justify-center hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 z-20"
          aria-label={t('home:slider.aria.prevSlide')}
        >
          <ChevronLeft size={20} className="text-slate-700" />
        </button>

        <button
          onClick={handleNextClick}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm border border-white/50 rounded-full flex items-center justify-center hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 z-20"
          aria-label={t('home:slider.aria.nextSlide')}
        >
          <ChevronRight size={20} className="text-slate-700" />
        </button>

        {/* Enhanced Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === index 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-400 w-8 h-3 shadow-lg' 
                  : 'bg-white/60 backdrop-blur-sm w-3 h-3 hover:bg-white/80'
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={t('home:slider.aria.goToSlide', { number: index + 1 })}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm border border-white/50 rounded-full px-4 py-2 text-sm font-medium text-slate-700 shadow-sm z-20">
          {currentIndex + 1} / {slides.length}
        </div>
      </div>
    </section>
  );
};

export default Slider;