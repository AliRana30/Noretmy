import { useState } from 'react';
import { TrendingUp, Users, BarChart4, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

export default function GigPromotionPage() {
  const { t } = useTranslations();
  const [isHovered, setIsHovered] = useState(false);

  const stats = [
    { icon: TrendingUp, value: t('home:gigPromotionCard.stats.0.value'), label: t('home:gigPromotionCard.stats.0.label') },
    { icon: Users, value: t('home:gigPromotionCard.stats.1.value'), label: t('home:gigPromotionCard.stats.1.label') },
    { icon: BarChart4, value: t('home:gigPromotionCard.stats.2.value'), label: t('home:gigPromotionCard.stats.2.label') }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-20">
            <span className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium inline-block mb-6">
              {t('home:gigPromotionCard.hero.badge')}
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              {t('home:gigPromotionCard.hero.title1')}
              <br />
              <span className="text-orange-500">{t('home:gigPromotionCard.hero.title2')}</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {t('home:gigPromotionCard.hero.description')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
                  <stat.icon className="h-10 w-10 text-orange-500" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-3">
                  {stat.value}
                </div>
                <p className="text-lg text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Main Promotion Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="text-center mb-12">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-400 to-red-500 mx-auto flex items-center justify-center mb-8">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {t('home:gigPromotionCard.promotion.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                {t('home:gigPromotionCard.promotion.description')}
              </p>
              
              <button
                className={`px-12 py-5 font-bold text-lg rounded-xl transition-all duration-300 flex items-center justify-center mx-auto
                ${isHovered ? 'bg-orange-600 shadow-xl scale-105' : 'bg-orange-500 shadow-lg'} 
                text-white`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => window.location.href = '/promote-gigs'}
              >
                {t('home:gigPromotionCard.promotion.button')}
                <ArrowRight className="ml-3 h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Benefits Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Increased Visibility</h3>
              <p className="text-gray-600 leading-relaxed">
                Get your gigs seen by more potential clients with our advanced promotion algorithms and targeted placement strategies.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quality Clients</h3>
              <p className="text-gray-600 leading-relaxed">
                Attract high-value clients who are actively looking for your specific skills and are ready to invest in quality work.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-6">
                <BarChart4 className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Higher Earnings</h3>
              <p className="text-gray-600 leading-relaxed">
                Boost your revenue with increased order volume and the ability to command premium rates for your promoted services.
              </p>
            </div>
          </div> */}
        </div>
      </div>

      {/* Bottom CTA Section
      <div className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Don't Let Your Gigs Get Lost
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            In a competitive marketplace, visibility is everything. Give your gigs the exposure they deserve 
            and watch your freelance business grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all duration-300 shadow-lg">
              Promote My Gigs Now
            </button>
            <button className="border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div> */}

    </div>
  );
}