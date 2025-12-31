'use client';
import React, { useState, useEffect } from 'react';
import { Clock, Zap, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

const UrgencyCTA: React.FC = () => {
  const { t } = useTranslations();

  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="py-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Content */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-orange-400 font-semibold text-sm uppercase tracking-wide">{t('home:urgencyCTA.limitedTime') || 'Limited Time Offer'}</p>
                <p className="text-white font-bold text-lg sm:text-xl">{t('home:urgencyCTA.discount') || 'Get 20% Off Your First Order'}</p>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-orange-400" />
            <div className="flex items-center gap-2">
              {[
                { value: timeLeft.hours, label: t('home:urgencyCTA.hours') || 'HRS' },
                { value: timeLeft.minutes, label: t('home:urgencyCTA.minutes') || 'MIN' },
                { value: timeLeft.seconds, label: t('home:urgencyCTA.seconds') || 'SEC' },
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[60px]">
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                      {formatTime(item.value)}
                    </div>
                    <div className="text-xs text-slate-400">{item.label}</div>
                  </div>
                  {index < 2 && <span className="text-white text-xl font-bold">:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/search-gigs"
            className="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
          >
            <Zap className="w-5 h-5" />
            {t('home:urgencyCTA.claimOffer') || 'Claim Offer'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UrgencyCTA;
