'use client';
import React, { useState, useEffect } from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import Image from 'next/image';

interface TestimonialProps {
  id: string;
}

const Testimonials: React.FC<TestimonialProps> = ({ id }) => {
  const { t } = useTranslations();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0,
  );

  const testimonials = t('home:testimonials.items', { returnObjects: true }) as Array<{
    name: string;
    description: string;
    attribute: string;
    image: string;
  }>;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getColumnsClass = () => {
    if (windowWidth >= 1200) return 'lg:grid-cols-3';
    if (windowWidth >= 768) return 'md:grid-cols-2';
    return 'grid-cols-1';
  };

  return (
    <section id={id} className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-orange-500 font-semibold tracking-wide uppercase text-sm mb-4">
            {t('home:testimonials.header.badge')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {t('home:testimonials.header.title')}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('home:testimonials.header.subtitle')}
          </p>

          {/* Overall Rating */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="font-semibold text-slate-900">{t('home:testimonials.header.rating')}</span>
            <span className="text-slate-500 text-sm">• {t('home:testimonials.header.reviews')}</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className={`grid ${getColumnsClass()} gap-6`}>
          {testimonials && testimonials.length > 0 && testimonials?.slice(0, 5)?.map((testimonial, index) => (
            <div
              key={index}
              className="group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={`bg-white rounded-2xl p-6 border border-slate-200 transition-all duration-300 h-full flex flex-col ${hoveredIndex === index ? 'shadow-xl border-orange-200 -translate-y-1' : 'shadow-sm'
                }`}>
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-orange-500" />
                </div>

                {/* Testimonial Content */}
                <div className="flex-1 mb-6">
                  <p className="text-slate-700 leading-relaxed">
                    &quot;{testimonial.description}&quot;
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-slate-500 ml-2">5.0</span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0">
                    {testimonial.image ? (
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {testimonial.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500 truncate">{testimonial.attribute}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex-shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    <span>{t('home:testimonials.header.verified')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
