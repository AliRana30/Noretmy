'use client';
import React, { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

const FinalCTA: React.FC = () => {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/register?email=${encodeURIComponent(email)}`;
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
          {t('home:finalCTA.headline') || 'Ready to get started?'}
        </h2>
        <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
          {t('home:finalCTA.description') || 'Join thousands of businesses finding top talent on our platform. Create your free account today.'}
        </p>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('home:finalCTA.emailPlaceholder') || 'Enter your email'}
              className="flex-1 px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-orange-500/25 transition-all whitespace-nowrap"
            >
              {t('home:finalCTA.getStarted') || 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Trust Points */}
        <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-400" />
            <span>{t('home:finalCTA.freeToJoin') || 'Free to join'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-400" />
            <span>{t('home:finalCTA.noCreditCard') || 'No credit card required'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-400" />
            <span>{t('home:finalCTA.cancelAnytime') || 'Cancel anytime'}</span>
          </div>
        </div>

        {/* Alternative CTA */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-slate-400 mb-4">{t('home:finalCTA.alreadyHaveAccount') || 'Already have an account?'}</p>
          <Link
            href="/login"
            className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
          >
            {t('home:finalCTA.signIn') || 'Sign in here →'}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
