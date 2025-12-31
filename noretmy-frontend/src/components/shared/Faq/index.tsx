'use client';
import React, { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

const FaqComponent: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FAQ[] = [
    {
      question: 'What is the delivery time?',
      answer: 'The delivery time is within 7 days.',
    },
    {
      question: 'Do you offer revisions?',
      answer: 'Yes, we offer up to 3 revisions.',
    },
    {
      question: 'Can I request a custom design?',
      answer: 'Absolutely, please contact us for custom requests.',
    },
    {
      question: 'How do I contact you for support?',
      answer: 'You can reach out via our support email or contact form.',
    },
    {
      question: 'Are there any additional fees?',
      answer: 'No hidden fees. The price you see is the price you pay.',
    },
  ];

  const toggleFaq = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null); // Close if already open
    } else {
      setActiveIndex(index); // Open the clicked FAQ
    }
  };

  return (
    <div className="bg-light-background py-12 px-6 flex flex-col lg:flex-row justify-between">
      {/* Reviews Component on the Left Side */}
      <div className="w-full lg:w-1/2 max-w-md lg:max-w-md mb-6 lg:mb-0"></div>

      {/* FAQ Section on the Right Side */}
      <div className="w-full lg:w-1/2 max-w-md">
        <h2 className="text-center text-2xl font-bold text-orange-600 mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div
                onClick={() => toggleFaq(index)}
                className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {faq.question}
                </h3>
                <span className="text-xl text-gray-500">
                  {activeIndex === index ? '-' : '+'}
                </span>
              </div>

              {activeIndex === index && (
                <div className="p-5 text-gray-700 bg-gray-50">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaqComponent;
