import { Button } from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Paragraph from '@/components/ui/Paragraph';
import Link from 'next/link';
import React, { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

interface BusinessProps {
  id?: string;
  onSubmit?: (email: string) => void;
}

const BusinessTransform: React.FC<BusinessProps> = ({ onSubmit, id }) => {
  const [email, setEmail] = useState('');
  const { t } = useTranslations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Call the parent component's submission handler
    if (onSubmit) {
      onSubmit(email);
    }
    // Clear input after submission
    setEmail('');
  };

  return (
    <section id={id}>
      <div className="relative w-full h-screen mt-20 shadow-globe">
        <video
          className="absolute inset-0 w-full h-full object-cover rotate-180"
          src="/videos/spacex.mp4"
          autoPlay
          loop
          muted
          aria-label={t('home:businessTransform.video.aria')}
        />

        <div className="z-10 flex flex-col w-full h-full text-white">
          <div className="mx-3 lg:w-2/6 md:w-1/2 md:mx-20 sm:mx-20 text-left lg:mx-48 relative top-36">
            <Heading
              title={t('home:businessTransform.header.title')}
              color={'light-white'}
            />
            <div className="mt-3">
              <Paragraph
                title={t('home:businessTransform.header.subtitle')}
                color="light-white"
              />
            </div>

            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('home:businessTransform.form.email.placeholder')}
                className="relative w-full h-16 py-2 pl-2 pr-32 bg-light-white text-black rounded-lg border border-gray-600 mt-6"
                required
                aria-label={t('home:businessTransform.form.email.aria')}
              />
              <div className="absolute inset-y-0 top-6 right-0 flex items-center pr-2">
                <button
                  type="submit"
                  className="text-blue-500 hover:text-blue-400 font-semibold cursor-pointer"
                  aria-label={t('home:businessTransform.form.submit.aria')}
                >
                  {t('home:businessTransform.form.submit.label')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessTransform;
