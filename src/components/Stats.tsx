import React from 'react';

const stats = [
  { number: '10,000+', label: 'Active Members' },
  { number: '500+', label: 'Successful Marriages' },
  { number: '95%', label: 'Verified Profiles' },
  { number: '24/7', label: 'Moderation Support' }
];

export const Stats: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-teal-600 to-teal-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-teal-100 text-sm md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
