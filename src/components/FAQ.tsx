import React, { useState } from 'react';

const faqs = [
  {
    question: 'How does the wali feature work?',
    answer: 'Women can invite a wali (guardian) during signup. The wali receives intro requests for approval and can join chaperoned chats to ensure Islamic guidelines are followed.'
  },
  {
    question: 'Is AM4M really free?',
    answer: 'Yes! Our free plan lets you browse, like profiles, and send 1 Super-Intro per day. Premium plans unlock unlimited likes, advanced filters, and priority features.'
  },
  {
    question: 'How are profiles verified?',
    answer: 'We verify identity through ID upload and selfie matching. Photos and videos are moderated to ensure they meet Islamic modesty guidelines.'
  },
  {
    question: 'What if I match with someone whose wali is involved?',
    answer: 'If a woman has wali involvement enabled, your like becomes an "intro request" that her wali must approve before you can chat.'
  },
  {
    question: 'Can I report inappropriate behavior?',
    answer: 'Absolutely. We have robust reporting and blocking features. Our moderation team reviews all reports within 24 hours.'
  },
  {
    question: 'What makes AM4M different from other apps?',
    answer: 'We prioritize Islamic values: marriage intentions only, modest media rules, optional wali involvement, and chaperoned messaging. No casual dating.'
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <p className="mt-4 text-xl text-gray-600">Everything you need to know</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <span className="text-teal-600 text-2xl">{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
