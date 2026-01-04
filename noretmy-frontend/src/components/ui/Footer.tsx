'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Instagram, Facebook, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const [year, setYear] = useState(2025);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/#about-us' },
      { label: 'Services', href: '/#services' },
      { label: 'Industries', href: '/#industries' },
      { label: 'Case Studies', href: '/#case-studies' },
    ],
    support: [
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'FAQs', href: '/faqs' },
      { label: 'Trust & Safety', href: '/#why-tags' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-condition' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Legal Notice', href: '/legal-notice' },
    ],
  };

  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/in/noretmy-%E2%98%85-057504274/',
      icon: Linkedin,
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/Noretmy',
      icon: Instagram,
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=100091924013151',
      icon: Facebook,
    },
  ];

  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <Image
                src="/logo/tagslogo.png"
                alt="Noretmy Logo"
                width={120}
                height={40}
                className="brightness-0 invert h-auto w-auto"
              />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Noretmy is the leading global marketplace connecting businesses with top-tier freelance talent to drive innovation and growth.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>2093 Philadelphia Pike #7584, Claymont, DE 19703</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="w-4 h-4 text-orange-500" />
                <a href="mailto:info@noretmy.com" className="hover:text-white transition-colors">info@noretmy.com</a>
              </div>
            </div>
            {/* Social Links */}
            <div className="flex items-center gap-4 pt-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-orange-600 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-orange-500 rounded-full"></span>
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center group">
                    <span className="w-0 group-hover:w-2 h-px bg-orange-400 mr-0 group-hover:mr-2 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-orange-500 rounded-full"></span>
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center group">
                    <span className="w-0 group-hover:w-2 h-px bg-orange-400 mr-0 group-hover:mr-2 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-orange-500 rounded-full"></span>
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-400 hover:text-orange-400 text-sm transition-colors flex items-center group">
                    <span className="w-0 group-hover:w-2 h-px bg-orange-400 mr-0 group-hover:mr-2 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            © {year} Noretmy LLC. Built with passion for the creator economy.
          </p>
          <div className="flex items-center gap-8">
            <Link href="/privacy-policy" className="text-xs text-slate-500 hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms-condition" className="text-xs text-slate-500 hover:text-white transition-colors">Terms</Link>
            <Link href="/cookie-policy" className="text-xs text-slate-500 hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
