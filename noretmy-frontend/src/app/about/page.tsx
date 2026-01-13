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
            <section className="relative py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <span className="inline-block px-4 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold mb-6 border border-orange-500/20">
                        {t('hero.badge')}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        {t('hero.title', { opportunity: t('hero.opportunity') }).split(t('hero.opportunity'))[0]}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{t('hero.opportunity')}</span>
                        {t('hero.title', { opportunity: t('hero.opportunity') }).split(t('hero.opportunity'))[1]}
                    </h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        {t('hero.description')}
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 -mt-12 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center transform hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                                    <stat.icon className="w-6 h-6 text-orange-600" />
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-orange-100 rounded-2xl -z-10"></div>
                            <Image
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                                alt="Our Team"
                                width={600}
                                height={400}
                                className="rounded-2xl shadow-2xl object-cover"
                            />
                            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-[200px]">
                                <p className="text-sm font-bold text-slate-900 mb-1">{t('mission.label')}</p>
                                <p className="text-xs text-slate-500 text-pretty">{t('mission.sublabel')}</p>
                            </div>
                        </div>
                        <div className="space-y-10">
                            <div className="flex gap-6">
                                <div className="shrink-0 w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                    <Target className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{t('mission.title')}</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">
                                        {t('mission.description')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="shrink-0 w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                    <Eye className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{t('vision.title')}</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">
                                        {t('vision.description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('values.title')}</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">{t('values.subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {values.map((value, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
                                <div className={`w-14 h-14 ${value.color} rounded-2xl flex items-center justify-center mb-6`}>
                                    <value.icon className="w-7 h-7" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h4>
                                <p className="text-slate-600 leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-orange-500/30 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

                        <h2 className="text-3xl md:text-4xl font-extrabold mb-6 relative z-10">{t('cta.title')}</h2>
                        <p className="text-orange-100 mb-10 text-lg max-w-2xl mx-auto relative z-10">
                            {t('cta.description')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 relative z-10">
                            <Link
                                href="/register"
                                className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105"
                            >
                                {t('cta.joinAsFreelancer')}
                            </Link>
                            <Link
                                href="/search-gigs"
                                className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105"
                            >
                                {t('cta.hireTalent')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
