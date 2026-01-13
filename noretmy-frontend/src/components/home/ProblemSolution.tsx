'use client';
import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

const ProblemSolution: React.FC = () => {
  const { t } = useTranslations();

  const benefits = [
    {
      stat: '10x',
      label: t('home:problemSolution.benefits.fasterHiring.label'),
      description: t('home:problemSolution.benefits.fasterHiring.description')
    },
    {
      stat: '98%',
      label: t('home:problemSolution.benefits.successRate.label'),
      description: t('home:problemSolution.benefits.successRate.description')
    },
    {
      stat: '100%',
      label: t('home:problemSolution.benefits.securePayments.label'),
      description: t('home:problemSolution.benefits.securePayments.description')
    },
    {
      stat: '24/7',
      label: t('home:problemSolution.benefits.support.label'),
      description: t('home:problemSolution.benefits.support.description')
    }
  ];

  const features = [
    t('home:problemSolution.features.verified'),
    t('home:problemSolution.features.escrow'),
    t('home:problemSolution.features.directCommunication'),
    t('home:problemSolution.features.unlimitedRevisions')
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Elements - matching Hero */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-orange-400 font-semibold tracking-wide uppercase text-sm mb-4">
            {t('home:problemSolution.tagline')}
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            {t('home:problemSolution.headline')}
            <span className="block mt-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              {t('home:problemSolution.headlineHighlight')}
            </span>
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            {t('home:problemSolution.description')}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300"
            >
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent mb-2">
                {benefit.stat}
              </div>
              <div className="text-white font-semibold mb-2">
                {benefit.label}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Features List */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-12">
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/search-gigs"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-300"
          >
            {t('home:problemSolution.exploreServices')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold py-4 px-8 rounded-xl transition-all"
          >
            {t('home:problemSolution.becomeSeller')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
