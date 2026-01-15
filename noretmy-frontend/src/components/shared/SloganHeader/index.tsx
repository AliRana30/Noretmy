import React from 'react';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import { Trans } from 'react-i18next';

const SloganHeader: React.FC = () => {
  const { t } = useTranslations();

  return (
    <section className="relative w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-50/20 to-blue-50/20 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            {/* <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-full px-4 py-2 shadow-sm">
              <Sparkles size={16} className="text-orange-500" />
              <span className="text-sm font-medium text-slate-700">
                {t('home:slogan.badge') || 'Premium Services Available'}
              </span>
            </div> */}

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[0.9]">
                <Trans 
                  i18nKey="home:slogan.title" 
                  components={{ 
                    highlight: <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent" /> 
                  }} 
                />
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-600 font-light leading-relaxed max-w-2xl">
                {t('home:slogan.subtitle')}
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange-500" />
                <span>{t('home:slogan.feature1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange-500" />
                <span>{t('home:slogan.feature2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange-500" />
                <span>{t('home:slogan.feature3')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/search-gigs" 
                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                {t('home:slogan.cta')}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>

            </div>
          </div>

          {/* Right Visual Element */}
          <div className="relative lg:order-2">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900">10K+</div>
                      <div className="text-sm text-slate-500">{t('home:slogan.stat1')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900">500+</div>
                      <div className="text-sm text-slate-500">{t('home:slogan.stat2')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900">99%</div>
                      <div className="text-sm text-slate-500">{t('home:slogan.stat3')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900">24/7</div>
                      <div className="text-sm text-slate-500">{t('home:slogan.stat4')}</div>
                    </div>
                  </div>
                  
                  {/* Progress Bars */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{t('home:slogan.quality')}</span>
                        <span className="text-slate-900 font-medium">98%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full w-[98%] animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{t('home:slogan.customerSatisfaction')}</span>
                        <span className="text-slate-900 font-medium">96%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full w-[96%]" style={{ animationDelay: '0.5s', animation: 'pulse 2s infinite' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-3 rounded-full shadow-lg animate-bounce">
                <Sparkles size={20} />
              </div>
              
              {/* <div className="absolute -bottom-6 -left-6 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
                <span role="img" aria-label="rocket">🚀</span> {t('home:slogan.floating_text') || 'Top Rated'}
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SloganHeader;