import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
    <section className="py-20 bg-gradient-to-br from-slate-50/80 to-teal-50/40" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground">Frequently Asked Questions</h2>
          <p className="mt-4 text-xl text-foreground/60">Everything you need to know</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-background border border-border/50 rounded-xl overflow-hidden hover:border-teal-300/40 transition-colors duration-200">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-foreground">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-teal-600 transition-transform duration-200 flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-foreground/70">
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
