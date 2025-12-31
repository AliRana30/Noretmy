'use client';
import React from 'react';
import { Star, Award, TrendingUp, Globe } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

const SocialProof: React.FC = () => {
  const { t } = useTranslations();

  const logos = [
    { name: 'TechCrunch', width: 'w-28' },
    { name: 'Forbes', width: 'w-20' },
    { name: 'Bloomberg', width: 'w-28' },
    { name: 'Reuters', width: 'w-24' },
    { name: 'Inc.', width: 'w-16' },
  ];

  const stats = [
    { icon: Star, value: '4.9/5', label: t('home:socialProof.averageRating') || 'Average Rating' },
    { icon: Award, value: '500+', label: t('home:socialProof.expertSellers') || 'Expert Sellers' },
    { icon: TrendingUp, value: '98%', label: t('home:socialProof.successRate') || 'Success Rate' },
    { icon: Globe, value: '50+', label: t('home:socialProof.countries') || 'Countries' },
  ];

  return (
    <section className="py-16 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Text */}
        <p className="text-center text-slate-500 text-sm font-medium uppercase tracking-wider mb-8">
          {t('home:socialProof.trustedBy') || 'Trusted by 10,000+ businesses worldwide'}
        </p>

        {/* Logo Bar */}
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 mb-16">
          {logos.map((logo, index) => (
            <div
              key={index}
              className={`${logo.width} h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-sm hover:bg-slate-200 hover:text-slate-600 transition-all duration-300`}
            >
              {logo.name}
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 group-hover:from-orange-500 group-hover:to-orange-600 shadow-lg mb-4 transition-all duration-300">
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">
                {stat.value}
              </div>
              <div className="text-slate-500 text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
