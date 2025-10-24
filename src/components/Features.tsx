import React from 'react';

const features = [
  {
    icon: '🤝',
    title: 'Wali Involvement',
    description: 'Optional wali approval for intro requests and chaperoned messaging for peace of mind.'
  },
  {
    icon: '✓',
    title: 'Verified Profiles',
    description: 'Identity verification and photo moderation ensure authentic, trustworthy connections.'
  },
  {
    icon: '💬',
    title: 'Chaperoned Chat',
    description: 'Invite your wali to join conversations, maintaining Islamic adab throughout.'
  },
  {
    icon: '🎯',
    title: 'Marriage-Focused',
    description: 'Every member confirms nikah intentions. No casual dating, only serious commitments.'
  },
  {
    icon: '🔒',
    title: 'Privacy & Safety',
    description: 'Robust reporting, blocking, and moderation keep the community safe and respectful.'
  },
  {
    icon: '🌙',
    title: 'Islamic Guidelines',
    description: 'Modest media rules, halal lifestyle preferences, and prayer-based matching.'
  }
];

export const Features: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Built on Islamic Values</h2>
          <p className="mt-4 text-xl text-gray-600">Everything you need for a halal marriage journey</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl bg-gradient-to-br from-teal-50 to-white border border-teal-100 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
