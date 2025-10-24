import React from 'react';

const safetyFeatures = [
  {
    icon: '🛡️',
    title: 'Identity Verification',
    description: 'Multi-step verification including ID upload and selfie matching ensures authentic profiles.'
  },
  {
    icon: '👁️',
    title: 'Human Moderation',
    description: 'Dedicated team reviews all photos, videos, and reported content within 24 hours.'
  },
  {
    icon: '🚫',
    title: 'Block & Report',
    description: 'Easy-to-use tools to block users and report inappropriate behavior instantly.'
  },
  {
    icon: '🔐',
    title: 'Privacy Controls',
    description: 'Control who sees your profile, photos, and personal information with granular settings.'
  },
  {
    icon: '⚠️',
    title: 'AI Content Filtering',
    description: 'Advanced AI automatically detects and blurs inappropriate content before human review.'
  },
  {
    icon: '📱',
    title: 'Safe Messaging',
    description: 'Profanity filters, rate limits, and optional wali oversight keep conversations respectful.'
  }
];

export const TrustSafety: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Your Safety is Our Priority</h2>
          <p className="mt-4 text-xl text-gray-600">
            Multiple layers of protection for a secure matchmaking experience
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {safetyFeatures.map((feature, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
