import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type CommunityMember = {
  id: string;
  first_name: string | null;
  city: string | null;
  state: string | null;
  age: number | null;
  profile_photo_url: string | null;
};

const FALLBACK_MEMBERS: Array<{
  name: string;
  age: number;
  location: string;
  image: string;
}> = [
  // {
  //   name: 'Sarah',
  //   age: 27,
  //   location: 'Boston, MA',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554753893_f7922b8f.webp',
  // },
  // {
  //   name: 'Hassan',
  //   age: 30,
  //   location: 'Seattle, WA',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554759826_2fab4c97.webp',
  // },
  // {
  //   name: 'Layla',
  //   age: 25,
  //   location: 'Miami, FL',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554755631_e6bb4c3d.webp',
  // },
  // {
  //   name: 'Ibrahim',
  //   age: 28,
  //   location: 'Denver, CO',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554761573_a02a3d33.webp',
  // },
  // {
  //   name: 'Amina',
  //   age: 26,
  //   location: 'Atlanta, GA',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554752197_e2e689b8.webp',
  // },
  // {
  //   name: 'Khalid',
  //   age: 32,
  //   location: 'Phoenix, AZ',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554763291_520d5986.webp',
  // },
];

export const Community: React.FC = () => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_community_preview', {
          limit_count: 6,
        });

        console.log("error",error);
        console.log("data",data);

        if (error) {
          console.error('get_community_preview error:', error);
          if (!cancelled) setMembers([]);
          return;
        }

        if (!cancelled) setMembers((data as CommunityMember[]) || []);
      } catch (e) {
        console.error('Community load failed:', e);
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const uiMembers =
    members.length > 0
      ? members.map((m) => {
          const name = (m.first_name || 'Member').trim() || 'Member';
          const age = m.age ?? null;

          const loc = [m.city, m.state].filter(Boolean).join(', ') || 'USA';

          return {
            key: m.id,
            name,
            age: age ?? 0,
            showAge: age !== null,
            location: loc,
            image: m.profile_photo_url || 'https://placehold.co/600x800?text=AM4M',
          };
        })
      : FALLBACK_MEMBERS.map((m, idx) => ({
          key: `fallback-${idx}`,
          name: m.name,
          age: m.age,
          showAge: true,
          location: m.location,
          image: m.image,
        }));

  return (
    <section className="py-20 bg-gradient-to-br from-teal-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            Join Our Growing Community
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Thousands of American Muslims seeking meaningful connections
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-lg">
                <div className="h-48 bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {uiMembers.map((member) => (
            <div key={member.key} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-shadow duration-200">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <p className="font-semibold">
                      {member.name}
                      {member.showAge ? `, ${member.age}` : ''}
                    </p>
                    <p className="text-xs text-gray-200">{member.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* If DB is empty and we’re showing fallback */}
        {members.length === 0 && !loading && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Showing preview members. Add real profiles to populate this section.
          </p>
        )}
      </div>
    </section>
  );
};





// import React from 'react';

// const communityMembers = [
//   {
//     name: 'Sarah',
//     age: 27,
//     location: 'Boston, MA',
//     image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554753893_f7922b8f.webp'
//   },
//   {
//     name: 'Hassan',
//     age: 30,
//     location: 'Seattle, WA',
//     image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554759826_2fab4c97.webp'
//   },
//   {
//     name: 'Layla',
//     age: 25,
//     location: 'Miami, FL',
//     image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554755631_e6bb4c3d.webp'
//   },
//   {
//     name: 'Ibrahim',
//     age: 28,
//     location: 'Denver, CO',
//     image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554761573_a02a3d33.webp'
//   },
//   {
//     name: 'Amina',
//     age: 26,
//     location: 'Atlanta, GA',
//     image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554752197_e2e689b8.webp'
//   },
//   {
//     name: 'Khalid',
//     age: 32,
//     location: 'Phoenix, AZ',
//     image: 'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554763291_520d5986.webp'
//   }
// ];

// export const Community: React.FC = () => {
//   return (
//     <section className="py-20 bg-gradient-to-br from-teal-50 to-white">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-16">
//           <h2 className="text-4xl font-bold text-gray-900">Join Our Growing Community</h2>
//           <p className="mt-4 text-xl text-gray-600">
//             Thousands of American Muslims seeking meaningful connections
//           </p>
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
//           {communityMembers.map((member, index) => (
//             <div 
//               key={index}
//               className="group cursor-pointer"
//             >
//               <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-shadow duration-200">
//                 <img 
//                   src={member.image} 
//                   alt={member.name}
//                   className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
//                   <div className="text-white">
//                     <p className="font-semibold">{member.name}, {member.age}</p>
//                     <p className="text-xs text-gray-200">{member.location}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };
