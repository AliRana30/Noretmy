'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Code, Palette, Megaphone, PenTool, Camera, Zap, Globe, Headphones, ArrowUpRight } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  slug: string;
}

interface CategoriesCarouselProps {
  id?: string;
}

const CategoriesCarousel: React.FC<CategoriesCarouselProps> = ({ id }) => {
  const { t } = useTranslations();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  const categories: Category[] = [
    {
      id: '1',
      name: t('home:categories.webDevelopment.name') || 'Web Development',
      description: t('home:categories.webDevelopment.description') || 'Custom websites & web apps',
      icon: <Code className="w-6 h-6" />,
      count: 2840,
      slug: 'web-development'
    },
    {
      id: '2',
      name: t('home:categories.uiux.name') || 'UI/UX Design',
      description: t('home:categories.uiux.description') || 'User interfaces & experiences',
      icon: <Palette className="w-6 h-6" />,
      count: 1650,
      slug: 'ui-ux-design'
    },
    {
      id: '3',
      name: t('home:categories.digitalMarketing.name') || 'Digital Marketing',
      description: t('home:categories.digitalMarketing.description') || 'SEO, ads & growth strategies',
      icon: <Megaphone className="w-6 h-6" />,
      count: 2100,
      slug: 'digital-marketing'
    },
    {
      id: '4',
      name: t('home:categories.graphicDesign.name') || 'Graphic Design',
      description: t('home:categories.graphicDesign.description') || 'Logos, branding & visuals',
      icon: <PenTool className="w-6 h-6" />,
      count: 3200,
      slug: 'graphic-design'
    },
    {
      id: '5',
      name: t('home:categories.photography.name') || 'Photography',
      description: t('home:categories.photography.description') || 'Professional photo services',
      icon: <Camera className="w-6 h-6" />,
      count: 980,
      slug: 'photography'
    },
    {
      id: '6',
      name: t('home:categories.motionGraphics.name') || 'Video & Animation',
      description: t('home:categories.motionGraphics.description') || 'Motion graphics & editing',
      icon: <Zap className="w-6 h-6" />,
      count: 1450,
      slug: 'video-animation'
    },
    {
      id: '7',
      name: t('home:categories.seoAnalytics.name') || 'SEO & Analytics',
      description: t('home:categories.seoAnalytics.description') || 'Search optimization',
      icon: <Globe className="w-6 h-6" />,
      count: 890,
      slug: 'seo-analytics'
    },
    {
      id: '8',
      name: t('home:categories.audioProduction.name') || 'Audio Production',
      description: t('home:categories.audioProduction.description') || 'Music, voiceover & sound',
      icon: <Headphones className="w-6 h-6" />,
      count: 720,
      slug: 'audio-production'
    },
  ];

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 768) setItemsPerView(2);
      else if (window.innerWidth < 1024) setItemsPerView(3);
      else setItemsPerView(4);
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const totalSlides = Math.max(0, Math.ceil(categories.length / itemsPerView));
  const canNavigate = totalSlides > 1;

  const nextSlide = useCallback(() => {
    if (!canNavigate) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides, canNavigate]);

  const prevSlide = useCallback(() => {
    if (!canNavigate) return;
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides, canNavigate]);

  if (categories.length === 0) return null;

  return (
    <section id={id} className="py-20 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-40"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <p className="text-orange-500 font-semibold tracking-wide uppercase text-sm mb-3">
              Browse Categories
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Find the right service
            </h2>
          </div>

          {/* Navigation */}
          {canNavigate && (
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-11 h-11 rounded-full bg-slate-900 hover:bg-orange-500 flex items-center justify-center text-white transition-all"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-11 h-11 rounded-full bg-slate-900 hover:bg-orange-500 flex items-center justify-center text-white transition-all"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        <div className="overflow-hidden w-full max-w-full relative px-1">
          <div
            className="flex transition-transform duration-500 ease-out w-full"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
              width: '100%',
              maxWidth: '100%'
            }}
          >
            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
              <div
                key={slideIndex}
                className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {categories
                  .slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView)
                  .map((category) => (
                    <Link
                      key={category.id}
                      href={`/search-gigs?category=${category.slug}`}
                      className="group block p-6 bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300"
                    >
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white group-hover:from-orange-500 group-hover:to-orange-600 transition-all duration-300 mb-4">
                        {category.icon}
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-slate-500 text-sm mb-4">
                        {category.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          {category.count.toLocaleString()} services
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {canNavigate && totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                  ? 'bg-orange-500 w-8'
                  : 'bg-slate-300 w-2 hover:bg-slate-400'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesCarousel;