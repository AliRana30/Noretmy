'use client';
import React from 'react';
import { ArrowRight, Star, CheckCircle, Zap, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

const Hero: React.FC = () => {
  const { t } = useTranslations();

  return (
    <section className="relative min-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">

        <div className="text-center max-w-5xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            {t('home:heroSection.headline') || 'Find Expert Talent'}
            <span className="block mt-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              {t('home:heroSection.headlineHighlight') || 'In Minutes, Not Months'}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            {t('home:heroSection.subheadline') || 'Connect with verified professionals who deliver exceptional results.'}
            <span className="text-white font-semibold"> {t('home:heroSection.trustCount') || '10,000+ businesses'}</span> {t('home:heroSection.trustMessage') || 'trust us to get their projects done right.'}
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="w-5 h-5 text-orange-400" />
              <span className="text-sm">{t('home:heroSection.verifiedExperts') || 'Verified Experts'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-sm">{t('home:heroSection.securePayments') || 'Secure Payments'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="text-sm">{t('home:heroSection.responseTime') || '24h Response Time'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-5 h-5 text-orange-300" />
              <span className="text-sm">{t('home:heroSection.moneyBack') || 'Money-Back Guarantee'}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/search-gigs"
              className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
            >
              <span className="text-lg">{t('home:heroSection.findExpert') || 'Find Your Expert Now'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute -top-2 -right-2 bg-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {t('home:heroSection.freeBadge') || 'FREE'}
              </div>
            </Link>

            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300"
            >
              <span className="text-lg">{t('home:heroSection.becomeSeller') || 'Become a Seller'}</span>
              <span className="text-orange-400">{t('home:heroSection.earnAmount') || 'Earn $5K+/mo'}</span>
            </Link>
          </div>

          {/* Social Proof Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 border-t border-white/10">
            {/* Avatar Stack */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-slate-800 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
                  +9K
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-white font-bold ml-1">4.9</span>
                </div>
                <p className="text-slate-400 text-sm">{t('home:heroSection.fromReviews') || 'from 10,000+ reviews'}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-12 bg-white/20"></div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">$2M+</div>
                <div className="text-slate-400 text-xs sm:text-sm">{t('home:heroSection.paidToSellers') || 'Paid to Sellers'}</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">50K+</div>
                <div className="text-slate-400 text-xs sm:text-sm">{t('home:heroSection.projectsDone') || 'Projects Done'}</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">99%</div>
                <div className="text-slate-400 text-xs sm:text-sm">{t('home:heroSection.satisfaction') || 'Satisfaction'}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
