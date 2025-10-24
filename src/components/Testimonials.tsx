import React from 'react';

const testimonials = [
  {
    name: 'Fatima & Ahmed',
    location: 'New York, NY',
    text: 'We found each other through AM4M and got married 6 months later. The wali feature gave my family peace of mind throughout the process.',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554748703_7b9c3fd6.webp'
  },
  {
    name: 'Sarah & Omar',
    location: 'Los Angeles, CA',
    text: 'Finally, a platform that respects Islamic values! The chaperoned chat feature helped us get to know each other while maintaining adab.',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554750476_f2180b40.webp'
  },
  {
    name: 'Zainab & Yusuf',
    location: 'Chicago, IL',
    text: 'The verification process made us feel safe. We appreciated that everyone here has serious marriage intentions. Alhamdulillah!',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554752197_e2e689b8.webp'
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Success Stories</h2>
          <p className="mt-4 text-xl text-gray-600">Real couples, real marriages</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.text}"</p>
              <div className="mt-4 flex gap-1 text-amber-500">
                {'★'.repeat(5)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
