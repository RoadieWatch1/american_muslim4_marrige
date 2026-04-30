import React from 'react';
import { UserCircle, Users, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '1',
    title: 'Create Your Profile',
    description: 'Sign up with email or phone, complete your profile with up to 6 photos and a short video. Verify your identity for a trusted badge.',
    icon: UserCircle
  },
  {
    number: '2',
    title: 'Invite Your Wali (Optional)',
    description: 'Women can invite a wali to approve intro requests and join chaperoned conversations, maintaining Islamic adab.',
    icon: Users
  },
  {
    number: '3',
    title: 'Discover & Swipe',
    description: 'Browse marriage-minded profiles filtered by your preferences. Pass, Like, or send a Super-Intro with a personalized note.',
    icon: Sparkles
  },
  {
    number: '4',
    title: 'Match & Connect',
    description: 'When both like each other (and wali approves if required), start a conversation. Chat 1-on-1 or with wali present.',
    icon: MessageCircle
  }
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-teal-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-4 text-xl text-gray-600">Four simple steps to find your life partner</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-teal-300/50 transition-all duration-300 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-sm font-bold flex-shrink-0">
                    {step.number}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-teal-300/60 to-transparent" />
                </div>
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-teal-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground text-center mb-3">{step.title}</h3>
                <p className="text-foreground/60 text-center text-sm leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-5 z-10 -translate-y-1/2 w-10 h-10 rounded-full bg-background border border-teal-200 shadow-sm items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-teal-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
