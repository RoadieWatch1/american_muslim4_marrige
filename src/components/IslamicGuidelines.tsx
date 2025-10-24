import React from 'react';

const guidelines = [
  {
    title: 'Modest Media',
    description: 'Up to 6 photos and 1 video (≤60s). All content reviewed for Islamic modesty standards.',
    icon: '📸'
  },
  {
    title: 'Marriage Intentions',
    description: 'All members confirm nikah intentions during signup. No casual dating allowed.',
    icon: '💍'
  },
  {
    title: 'Respectful Communication',
    description: 'Auto-moderation filters inappropriate language. Adab reminders in all chats.',
    icon: '💬'
  },
  {
    title: 'Family Involvement',
    description: 'Optional wali approval system ensures family blessing and oversight.',
    icon: '👨‍👩‍👧'
  }
];

export const IslamicGuidelines: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Our Islamic Guidelines</h2>
          <p className="mt-4 text-xl text-gray-600">
            Upholding adab and Islamic values in every interaction
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guidelines.map((guideline, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200"
            >
              <div className="text-5xl mb-4 text-center">{guideline.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                {guideline.title}
              </h3>
              <p className="text-gray-600 text-sm text-center">
                {guideline.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
