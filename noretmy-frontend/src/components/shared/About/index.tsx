import React from 'react';
import Image from 'next/image';
import Paragraph from '@/components/ui/Paragraph';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

interface AboutProps {
  id: string;
}

const About: React.FC<AboutProps> = ({ id }) => {
  const { t } = useTranslations();

  return (
    <section id={id}>
      <div className="bg-light-white w-full shadow-md h-auto max-h-max">
        <div className="flex mx-10 lg:flex-row lg:justify-center flex-col gap-12 xl:gap-24 xl:mx-28 lg:mx-20 justify-start mb-4">
          <div className="w-72 lg:mt-24">
            <Image
              src="/logo/tagslogo.png"
              alt={t('home:about.images.logo')}
              width={116}
              height={88}
            />
            <Paragraph
              title={t('home:about.description')}
              color="dark-secondary"
            />
          </div>
          <div className="w-98 h-[200px] flex flex-col justify-between lg:mt-28 text-dark-secondary">
            <p className="text-p1 font-h-bold">{t('home:about.navigation.company.title')}</p>
            <Link href={'/#industries'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.company.links.industries')}
              </p>
            </Link>
            <Link href={'/#services'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.company.links.services')}
              </p>
            </Link>
            <Link href={'/#why-tags'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.company.links.testimonials')}
              </p>
            </Link>
            <Link href={'/#case-studies'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.company.links.caseStudies')}
              </p>
            </Link>
          </div>
          <div className="w-98 h-[200px] flex flex-col justify-between lg:mt-28">
            <p className="text-p1 font-h-bold text-dark-secondary">
              {t('home:about.navigation.help.title')}
            </p>
            <Link href={'/contact-us'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.help.links.customerSupport')}
              </p>
            </Link>
            <Link href={'/faqs'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.help.links.faqs')}
              </p>
            </Link>
            <Link href={'/privacy-policy'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.help.links.privacyPolicy')}
              </p>
            </Link>
            <Link href={'/terms-condition'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.help.links.termsConditions')}
              </p>
            </Link>
            <Link href={'/cookie-policy'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('Cookie Policy')}
              </p>
            </Link>
            <Link href={'/legal-notice'}>
              <p className="text-hh4 hover:text-orange-primary">
                {t('home:about.navigation.help.links.legalNotice')}
              </p>
            </Link>
          </div>
          <div className="w-72 h-full flex flex-col justify-between lg:mt-28 text-dark-secondary">
            <p className="text-p1 font-h-bold">{t('home:about.contact.address.title')}</p>
            <ul className="list-disc pl-7 mt-2">
              <li>{t('home:about.contact.address.value')}</li>
            </ul>

            <Link href={'/#about-us'}>
              <p className="text-p1 font-h-bold mt-4">{t('home:about.contact.contact.title')}</p>
            </Link>
            <ul className="list-disc pl-7 mt-2">
              <li>{t('home:about.contact.contact.email')}</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-center mx-auto gap-10 mt-7 mb-4">
          <Link
            href="https://www.linkedin.com/in/noretmy-%E2%98%85-057504274/"
            target="_blank"
            rel="noopener noreferrer"
            className="grayscale hover:grayscale-0"
            aria-label={t('home:about.social.linkedin')}
          >
            <Image
              src="/icons/linkedin.png"
              alt={t('home:about.images.linkedin')}
              width={30}
              height={30}
            />
          </Link>
          <Link
            href="https://www.instagram.com/Noretmy"
            target="_blank"
            rel="noopener noreferrer"
            className="grayscale hover:grayscale-0"
            aria-label={t('home:about.social.instagram')}
          >
            <Image
              src="/icons/instagram.png"
              alt={t('home:about.images.instagram')}
              width={33}
              height={33}
            />
          </Link>
          <Link
            href="https://www.facebook.com/profile.php?id=100091924013151"
            target="_blank"
            rel="noopener noreferrer"
            className="grayscale hover:grayscale-0"
            aria-label={t('home:about.social.facebook')}
          >
            <Image
              src="/icons/facebook.png"
              alt={t('home:about.images.facebook')}
              width={30}
              height={30}
            />
          </Link>
        </div>
        {/* Copyright */}
        <div className="py-6 border-t border-slate-200">
          <p className="text-center text-sm text-slate-600">
            © {new Date().getFullYear()} Noretmy LLC. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
