'use client';
import React from 'react';
import { Percent, CalendarCheck, UserCheck, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import Link from 'next/link';

interface WhyChooseUsProps {
  id?: string;
}

const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ id }) => {
  const { t } = useTranslations();

  const features = [
    {
      id: '01',
      title: t('home:whyChooseUs.features.0.title'),
      description: t('home:whyChooseUs.features.0.description'),
      icon: Percent,
    },
    {
      id: '02',
      title: t('home:whyChooseUs.features.1.title'),
      description: t('home:whyChooseUs.features.1.description'),
      icon: CalendarCheck,
      featured: true,
    },
    {
      id: '03',
      title: t('home:whyChooseUs.features.2.title'),
      description: t('home:whyChooseUs.features.2.description'),
      icon: UserCheck,
    },
  ];

  return (
    <section id={id} className="py-24 bg-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-orange-500 font-semibold tracking-wide uppercase text-sm mb-4">
            {t('home:whyChooseUs.header.badge')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            {t('home:whyChooseUs.header.title1')}
            <span className="block mt-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              {t('home:whyChooseUs.header.title2')}
            </span>
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`group relative rounded-2xl p-8 transition-all duration-300 hover:shadow-xl ${feature.featured
                ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                : 'bg-slate-50 hover:bg-white border border-slate-100'
                }`}
            >
              {/* Feature Number */}
              <div className={`text-xs font-mono mb-6 ${feature.featured ? 'text-orange-400' : 'text-slate-400'
                }`}>
                [{feature.id}]
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.featured
                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                : 'bg-slate-900 group-hover:bg-orange-500'
                } transition-colors duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold mb-4 ${feature.featured ? 'text-white' : 'text-slate-900'
                }`}>
                {feature.title}
              </h3>

              {/* Description */}
              <p className={`leading-relaxed ${feature.featured ? 'text-slate-300' : 'text-slate-600'
                }`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-slate-50 px-8 py-6 rounded-2xl border border-slate-100">
            <span className="text-slate-700 font-medium text-lg">
              {t('home:whyChooseUs.cta.text')}
            </span>
            <Link
              href="/search-gigs"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all"
            >
              {t('home:whyChooseUs.cta.button')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;