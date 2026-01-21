'use client';

import React from 'react';
import { Target, Eye, ShieldCheck, Users, TrendingUp, Award, Clock, Heart } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import Image from 'next/image';
import Link from 'next/link';

const AboutPage = () => {
    const { t } = useTranslations('about');

    const stats = [
        { label: t('stats.activeFreelancers'), value: '10,000+', icon: Users },
        { label: t('stats.projectsCompleted'), value: '50K+', icon: TrendingUp },
        { label: t('stats.customerSatisfaction'), value: '4.9/5', icon: Heart },
        { label: t('stats.averageResponse'), value: '< 24h', icon: Clock },
    ];

    const values = [
        {
            title: t('values.excellence.title'),
            description: t('values.excellence.description'),
            icon: Award,
            color: 'bg-orange-100 text-orange-600'
        },
        {
            title: t('values.security.title'),
            description: t('values.security.description'),
            icon: ShieldCheck,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: t('values.community.title'),
            description: t('values.community.description'),
            icon: Users,
            color: 'bg-green-100 text-green-600'
        }
    ];

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="py-16 md:py-20 bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-500 rounded text-xs font-medium mb-4 border border-orange-500/20">
                            {t('hero.badge')}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                            {t('hero.title', { opportunity: t('hero.opportunity') }).split(t('hero.opportunity'))[0]}
                            <span className="text-orange-500">{t('hero.opportunity')}</span>
                            {t('hero.title', { opportunity: t('hero.opportunity') }).split(t('hero.opportunity'))[1]}
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            {t('hero.description')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <stat.icon className="w-4 h-4 text-orange-600" />
                                    <div className="text-sm text-gray-600">{stat.label}</div>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="max-w-3xl mb-12">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-5 h-5 text-orange-600" />
                                <h2 className="text-xl font-bold text-gray-900">{t('mission.title')}</h2>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                                {t('mission.description')}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">{t('vision.title')}</h2>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                                {t('vision.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('values.title')}</h2>
                    <p className="text-gray-600 mb-8 max-w-2xl">{t('values.subtitle')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {values.map((value, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 ${value.color} rounded-lg flex items-center justify-center`}>
                                        <value.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{value.title}</h3>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="bg-orange-600 rounded-lg p-8 md:p-12">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t('cta.title')}</h2>
                            <p className="text-orange-100 mb-6">
                                {t('cta.description')}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/register"
                                    className="bg-white text-orange-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    {t('cta.joinAsFreelancer')}
                                </Link>
                                <Link
                                    href="/search-gigs"
                                    className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    {t('cta.hireTalent')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
