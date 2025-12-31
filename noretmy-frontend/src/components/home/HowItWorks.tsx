'use client';
import React from 'react';
import { Search, MessageSquare, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

const HowItWorks: React.FC = () => {
  const { t } = useTranslations();

  const steps = [
    {
      number: '01',
      icon: Search,
      title: t('home:howItWorks.steps.search.title') || 'Search & Discover',
      description: t('home:howItWorks.steps.search.description') || 'Browse our curated marketplace of verified professionals. Filter by expertise, ratings, and budget.',
    },
    {
      number: '02',
      icon: MessageSquare,
      title: t('home:howItWorks.steps.connect.title') || 'Connect & Discuss',
      description: t('home:howItWorks.steps.connect.description') || 'Chat directly with sellers to discuss project requirements and receive tailored proposals.',
    },
    {
      number: '03',
      icon: CreditCard,
      title: t('home:howItWorks.steps.payment.title') || 'Secure Payment',
      description: t('home:howItWorks.steps.payment.description') || 'Pay safely through our escrow system. Funds are released only after you approve the work.',
    },
    {
      number: '04',
      icon: CheckCircle,
      title: t('home:howItWorks.steps.receive.title') || 'Receive & Review',
      description: t('home:howItWorks.steps.receive.description') || 'Get your project delivered on time. Request revisions if needed until fully satisfied.',
    },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-orange-500 font-semibold tracking-wide uppercase text-sm mb-4">
            {t('home:howItWorks.tagline') || 'Simple Process'}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            {t('home:howItWorks.headline') || 'How it works'}
          </h2>
          <p className="text-slate-600 text-lg">
            {t('home:howItWorks.description') || 'Get started in minutes. Our streamlined process makes finding and hiring talent effortless.'}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+50px)] w-[calc(100%-60px)] h-0.5 bg-gradient-to-r from-orange-200 to-slate-200" />
              )}

              <div className="relative text-center">
                {/* Step number with icon */}
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mx-auto group-hover:from-orange-500 group-hover:to-orange-600 transition-all duration-300 shadow-lg">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/search-gigs"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300"
          >
            {t('home:howItWorks.getStarted') || 'Get Started Free'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-slate-500 text-sm">
            {t('home:howItWorks.noCreditCard') || 'No credit card required • Free to browse'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
