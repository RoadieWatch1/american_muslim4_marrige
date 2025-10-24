import React from 'react';

const communityMembers = [
  {
    name: 'Sarah',
    age: 27,
    location: 'Boston, MA',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554753893_f7922b8f.webp'
  },
  {
    name: 'Hassan',
    age: 30,
    location: 'Seattle, WA',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554759826_2fab4c97.webp'
  },
  {
    name: 'Layla',
    age: 25,
    location: 'Miami, FL',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554755631_e6bb4c3d.webp'
  },
  {
    name: 'Ibrahim',
    age: 28,
    location: 'Denver, CO',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554761573_a02a3d33.webp'
  },
  {
    name: 'Amina',
    age: 26,
    location: 'Atlanta, GA',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554752197_e2e689b8.webp'
  },
  {
    name: 'Khalid',
    age: 32,
    location: 'Phoenix, AZ',
    image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554763291_520d5986.webp'
  }
];

export const Community: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-teal-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Join Our Growing Community</h2>
          <p className="mt-4 text-xl text-gray-600">
            Thousands of American Muslims seeking meaningful connections
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {communityMembers.map((member, index) => (
            <div 
              key={index}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-shadow duration-200">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <p className="font-semibold">{member.name}, {member.age}</p>
                    <p className="text-xs text-gray-200">{member.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
