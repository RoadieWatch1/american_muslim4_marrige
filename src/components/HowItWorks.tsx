import React from 'react';

const steps = [
  {
    number: '1',
    title: 'Create Your Profile',
    description: 'Sign up with email or phone, complete your profile with up to 6 photos and a short video. Verify your identity for a trusted badge.',
    icon: '👤'
  },
  {
    number: '2',
    title: 'Invite Your Wali (Optional)',
    description: 'Women can invite a wali to approve intro requests and join chaperoned conversations, maintaining Islamic adab.',
    icon: '👨‍👩‍👧'
  },
  {
    number: '3',
    title: 'Discover & Swipe',
    description: 'Browse marriage-minded profiles filtered by your preferences. Pass, Like, or send a Super-Intro with a personalized note.',
    icon: '💫'
  },
  {
    number: '4',
    title: 'Match & Connect',
    description: 'When both like each other (and wali approves if required), start a conversation. Chat 1-on-1 or with wali present.',
    icon: '💬'
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
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full text-2xl font-bold mb-4 mx-auto">
                  {step.number}
                </div>
                <div className="text-4xl text-center mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">{step.title}</h3>
                <p className="text-gray-600 text-center text-sm">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-teal-300 text-3xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
