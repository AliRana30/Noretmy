'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'material-icons/iconfont/material-icons.css';
import Head from 'next/head';
import axios from 'axios';
import { showError, showSuccess } from '@/util/toast';
import PageTransitionWrapper from '@/util/transitionWrapper';
import { useTranslations } from '@/hooks/useTranslations';
import { useEffect, useState } from 'react';
import i18n from '@/i18n';

// New Sales-Focused Components
import Hero from '@/components/home/Hero';
import SocialProof from '@/components/home/SocialProof';
import ProblemSolution from '@/components/home/ProblemSolution';
import HowItWorks from '@/components/home/HowItWorks';
import FinalCTA from '@/components/home/FinalCTA';

// Existing Components
import CategoriesCarousel from '@/components/shared/CategoriesCarousel';
import SearchGigsRedirection from '@/components/shared/SearchGigRedirection';
import HomeGigs from '@/components/shared/GigsGrid';
import Testimonials from '@/components/shared/Testimonials';
import WhyChooseUs from '@/components/WhyChoosUs';

const Home = () => {
  const { t } = useTranslations();
  const [ready, setReady] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (i18n.isInitialized) {
      setReady(true);
    } else {
      const onInit = () => setReady(true);
      i18n.on('initialized', onInit);
      return () => i18n.off('initialized', onInit);
    }
  }, []);

  // Show skeleton loading state while i18n initializes
  if (!ready) {
    return (
      <main className="min-h-screen ">
        {/* Hero Skeleton */}
        <section className="relative min-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            {/* Badge skeleton */}
            <div className="flex justify-center mb-8">
              <div className="h-10 w-64 bg-white/10 rounded-full animate-pulse" />
            </div>

            <div className="text-center max-w-5xl mx-auto">
              {/* Headline skeleton */}
              <div className="space-y-4 mb-8">
                <div className="h-12 sm:h-16 bg-white/10 rounded-lg mx-auto w-3/4 animate-pulse" />
                <div className="h-12 sm:h-16 bg-orange-500/20 rounded-lg mx-auto w-2/3 animate-pulse" />
              </div>

              {/* Subheadline skeleton */}
              <div className="space-y-3 mb-10 max-w-3xl mx-auto">
                <div className="h-6 bg-white/10 rounded w-full animate-pulse" />
                <div className="h-6 bg-white/10 rounded w-4/5 mx-auto animate-pulse" />
              </div>

              {/* Trust indicators skeleton */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 w-32 bg-white/10 rounded animate-pulse" />
                ))}
              </div>

              {/* CTA buttons skeleton */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="h-14 w-48 bg-orange-500/30 rounded-xl animate-pulse" />
                <div className="h-14 w-48 bg-white/10 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Skeleton */}
        <section className="py-12 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center gap-8 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="h-10 w-20 bg-slate-200 rounded mx-auto animate-pulse" />
                  <div className="h-4 w-24 bg-slate-200 rounded mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Skeleton */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="h-8 w-64 bg-slate-200 rounded mx-auto mb-4 animate-pulse" />
              <div className="h-4 w-96 bg-slate-200 rounded mx-auto animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  const handleSubmit = async (email: string) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/newsletter`, { email }, { withCredentials: true });
      showSuccess(response.data.message || t('newsletter.success'));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || t('newsletter.error.default');
        showError(message);
      } else {
        showError(t('newsletter.error.unexpected'));
      }
    }
  };

  return (
    <>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
      </Head>

      <main className="overflow-x-hidden">
        <PageTransitionWrapper>
          {(navigateWithTransition) => (
            <>
              <ToastContainer />

              {/* === ATTENTION PHASE === */}
              {/* Hero: Strong value proposition with live activity, trust indicators, dual CTAs */}
              <Hero />

              {/* Social Proof: Logo bar and key stats to build immediate trust */}
              <SocialProof />

              {/* === INTEREST PHASE === */}
              {/* Problem/Solution: Address pain points and show how we solve them */}
              <ProblemSolution />

              {/* How It Works: Simple 4-step process to reduce friction */}
              <HowItWorks />

              {/* === DESIRE PHASE === */}
              {/* Categories: Let users browse what interests them */}
              <CategoriesCarousel />

              {/* Search Section */}
              <section className="py-16 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                      {t('What are you looking for?')}
                    </h2>
                    <p className="text-slate-600">
                      {t('Find the perfect freelancer for your project')}
                    </p>
                  </div>
                  <SearchGigsRedirection navigateWithTransition={navigateWithTransition} />
                </div>
              </section>

              {/* Featured Gigs: Show actual offerings */}
              <HomeGigs />

              {/* Testimonials: Real customer reviews */}
              <Testimonials id="testimonials" />

              {/* Why Choose Us: Key differentiators */}
              <WhyChooseUs />

              {/* === ACTION PHASE === */}
              {/* Final CTA: Strong closing with email capture and benefits */}
              <FinalCTA />
            </>
          )}
        </PageTransitionWrapper>
      </main>
    </>
  );
};

export default Home;
