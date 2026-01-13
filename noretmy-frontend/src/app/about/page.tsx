'use client';

import React from 'react';
import { Target, Eye, ShieldCheck, Users, TrendingUp, Award, Clock, Heart } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import Image from 'next/image';
import Link from 'next/link';

const AboutPage = () => {
    const { t } = useTranslations();

    const stats = [
        { label: 'Active Freelancers', value: '10,000+', icon: Users },
        { label: 'Projects Completed', value: '50K+', icon: TrendingUp },
        { label: 'Customer Satisfaction', value: '4.9/5', icon: Heart },
        { label: 'Average Response', value: '< 24h', icon: Clock },
    ];

    const values = [
        {
            title: 'Excellence',
            description: 'We strive for the highest quality in every service offered on our platform.',
            icon: Award,
            color: 'bg-orange-100 text-orange-600'
        },
        {
            title: 'Security',
            description: 'Your transactions and data are protected by industry-leading security standards.',
            icon: ShieldCheck,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: 'Community',
            description: 'We build lasting relationships between talented freelancers and visionary businesses.',
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
                        About Noretmy
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        Connecting Talent with <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Opportunity</span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        Noretmy is more than a marketplace; it&apos;s a global community where creativity meets demand, and where the best digital services are just a click away.
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
                                <p className="text-sm font-bold text-slate-900 mb-1">Trusted globally</p>
                                <p className="text-xs text-slate-500 text-pretty">Serving clients and freelancers in over 80 countries.</p>
                            </div>
                        </div>
                        <div className="space-y-10">
                            <div className="flex gap-6">
                                <div className="shrink-0 w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                    <Target className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Our Mission</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">
                                        To provide a seamless, secure, and rewarding environment where businesses can find the expertise they need to thrive, and freelancers can build fulfilling careers doing what they love.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="shrink-0 w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                    <Eye className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Our Vision</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">
                                        To be the world&apos;s most trusted destination for digital services, known for our commitment to quality, transparency, and the success of our global community.
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
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Core Values</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">The principles that guide everything we do at Noretmy.</p>
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

                        <h2 className="text-3xl md:text-4xl font-extrabold mb-6 relative z-10">Ready to join our community?</h2>
                        <p className="text-orange-100 mb-10 text-lg max-w-2xl mx-auto relative z-10">
                            Whether you&apos;re looking to hire or want to offer your services, Noretmy is the place to be.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 relative z-10">
                            <Link
                                href="/register"
                                className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105"
                            >
                                Join as Freelancer
                            </Link>
                            <Link
                                href="/search-gigs"
                                className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105"
                            >
                                Hire Talent
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
