// src/components/DiscoverSection.tsx
import React, { useEffect, useState } from 'react';
import { ProfileCard } from './ProfileCard';
import { SwipeActions } from './SwipeActions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ---- Types --------------------------------------------------

// Shape returned by discover_profiles RPC
type DiscoverProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  city: string | null;
  state: string | null;
  practice_level: string | null;
  denomination: string | null;
  bio: string | null;
  nikah_timeline: string | null;
  verified_badge: boolean | null;
  wali_required: boolean | null;
  photo_url?: string | null;
};

// Shape expected by <ProfileCard />
type CardProfile = {
  id: string;
  firstName: string;
  age: number;
  city: string;
  state: string;
  practiceLevel: string;
  denomination?: string;
  bio: string;
  nikahTimeline: string;
  photos: string[];
  verified: boolean;
  waliRequired: boolean;
};

export const DiscoverSection: React.FC = () => {
  const { user, profile } = useAuth();

  const [profiles, setProfiles] = useState<CardProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLoggedIn = !!user && !!profile;

  // Fetch real profiles when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    void fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const fetchProfiles = async () => {
    if (!user) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const p_min_age = 18;
      const p_max_age = 60;
      const p_denomination = null;
      const p_practice_level = null;

      const {
        data,
        error,
      }: {
        data: DiscoverProfileRow[] | null;
        error: any;
      } = await supabase.rpc('discover_profiles', {
        p_user_id: user.id,
        p_min_age,
        p_max_age,
        p_country: null,
        p_denomination,
        p_practice_level,
      });

      if (error) {
        console.error('Error fetching discover_profiles (home section):', error);
        setErrorMsg('Could not load profiles right now.');
        setProfiles([]);
        setCurrentIndex(0);
        return;
      }

      const mapped: CardProfile[] =
        (data || []).map((p) => ({
          id: p.id,
          firstName: p.first_name || 'Member',
          age: p.age ?? 0,
          city: p.city || '—',
          state: p.state || '',
          practiceLevel: p.practice_level || 'practicing',
          denomination: p.denomination || undefined,
          bio: p.bio || '',
          nikahTimeline: p.nikah_timeline || '6-12mo',
          photos: [
            p.photo_url ||
              'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760559448736_5272b484.webp',
            'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760559450707_2b72f42f.webp',
          ],
          verified: !!p.verified_badge,
          waliRequired: !!p.wali_required,
        })) ?? [];

      setProfiles(mapped);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error in fetchProfiles (home section):', err);
      setErrorMsg('Something went wrong while loading profiles.');
      setProfiles([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, show a single static demo profile (no mock list / DB)
  const demoProfile: CardProfile = {
    id: 'demo',
    firstName: 'Aisha',
    age: 26,
    city: 'New York',
    state: 'NY',
    practiceLevel: 'practicing',
    denomination: 'sunni',
    bio: 'Seeking a practicing Muslim who values family and faith. Love reading, volunteering, and spending time with family.',
    nikahTimeline: '6-12mo',
    photos: [
      'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760559448736_5272b484.webp',
    ],
    verified: true,
    waliRequired: true,
  };

  const activeProfiles = isLoggedIn ? profiles : [demoProfile];
  const currentProfile = activeProfiles[currentIndex] || null;

  const goNext = () => {
    if (currentIndex < activeProfiles.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (isLoggedIn) {
      toast('No more profiles here. Visit the Discover page for more.');
    }
  };

  // ---- Swipe handlers ---------------------------------------

  // Logged-out: just nudge user to sign up / log in
  const handlePassGuest = () => {
    toast('Create a free account to start swiping.');
  };

  const handleLikeGuest = () => {
    toast.success("This is just a demo. Sign up to like real profiles ❤️");
  };

  const handleSuperIntroGuest = () => {
    toast('Super Intros are available once you create an account ✨');
  };

  // Real behaviour (logged-in users, using likes/matches)
  const handleSwipeReal = async (direction: 'left' | 'right' | 'up') => {
    if (!user || !currentProfile) {
      goNext();
      return;
    }

    const name = currentProfile.firstName || 'this user';

    const action =
      direction === 'left'
        ? 'pass'
        : direction === 'right'
        ? 'like'
        : 'super_intro';

    try {
      // optimistic toasts
      if (action === 'pass') {
        toast(`You skipped ${name}`);
      }
      if (action === 'like') {
        toast.success(`You liked ${name}`);
      }
      if (action === 'super_intro') {
        toast.success(`Super intro sent to ${name} ✨`);
      }

      // save like/pass
      const { error: likeError } = await supabase.from('likes').upsert(
        {
          from_user_id: user.id,
          to_user_id: currentProfile.id,
          type: action,
        },
        { onConflict: 'from_user_id,to_user_id' }
      );

      if (likeError) {
        console.error('Error saving like/pass from home DiscoverSection:', likeError);
        toast.error('Could not save your action. Please try again.');
      }

      if (action === 'like' || action === 'super_intro') {
        // check for mutual like
        const { data: mutual, error: mutualError } = await supabase
          .from('likes')
          .select('id')
          .eq('from_user_id', currentProfile.id)
          .eq('to_user_id', user.id)
          .in('type', ['like', 'super_intro'])
          .maybeSingle();

        if (!mutualError && mutual) {
          const [id1, id2] = [user.id, currentProfile.id].sort() as [
            string,
            string
          ];

          const { error: matchError } = await supabase
            .from('matches')
            .upsert(
              {
                user1_id: id1,
                user2_id: id2,
              },
              { onConflict: 'user1_id,user2_id' }
            );

          if (matchError) {
            console.error(
              'Error creating match from home DiscoverSection:',
              matchError
            );
            toast.error('Error creating match.');
          } else {
            toast.success(`🎉 It’s a match with ${name}!`);
          }
        }
      }
    } catch (err) {
      console.error('Error handling swipe from home DiscoverSection:', err);
      toast.error('Something went wrong.');
    } finally {
      goNext();
    }
  };

  const handlePass = () =>
    isLoggedIn ? handleSwipeReal('left') : handlePassGuest();
  const handleLike = () =>
    isLoggedIn ? handleSwipeReal('right') : handleLikeGuest();
  const handleSuperIntro = () =>
    isLoggedIn ? handleSwipeReal('up') : handleSuperIntroGuest();

  // ---- Render ------------------------------------------------

  if (loading && isLoggedIn && !activeProfiles.length) {
    return (
      <section
        id="discover"
        className="py-20 bg-gradient-to-br from-gray-50 to-teal-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">
              Discover Your Match
            </h2>
            <p className="mt-4 text-xl text-gray-600">Swipe with intention</p>
          </div>
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
          </div>
        </div>
      </section>
    );
  }

  if (!currentProfile) {
    return (
      <section
        id="discover"
        className="py-20 bg-gradient-to-br from-gray-50 to-teal-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">
              Discover Your Match
            </h2>
            <p className="mt-4 text-xl text-gray-600">Swipe with intention</p>
          </div>
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">
              No profiles to show right now.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="discover"
      className="py-20 bg-gradient-to-br from-gray-50 to-teal-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900">
            Discover Your Match
          </h2>
          <p className="mt-4 text-xl text-gray-600">Swipe with intention</p>
          {errorMsg && (
            <p className="mt-2 text-sm text-red-500">
              {errorMsg}
            </p>
          )}
          {isLoggedIn ? (
            <p className="mt-1 text-xs text-gray-500">
              Showing real profiles based on your preferences.
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              This is a demo preview. Create an account to see real matches.
            </p>
          )}
        </div>

        <div className="flex flex-col items-center">
          <ProfileCard
            profile={currentProfile}
            onLike={handleLike}
            onPass={handlePass}
            onSuperIntro={handleSuperIntro}
          />
          <SwipeActions
            onPass={handlePass}
            onLike={handleLike}
            onSuperIntro={handleSuperIntro}
          />
        </div>
      </div>
    </section>
  );
};




// import React, { useState } from 'react';
// import { ProfileCard } from './ProfileCard';
// import { SwipeActions } from './SwipeActions';
// import { mockProfiles } from '@/data/mockProfiles';

// export const DiscoverSection: React.FC = () => {
//   const [profiles] = useState(mockProfiles);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [matches, setMatches] = useState<string[]>([]);

//   const currentProfile = profiles[currentIndex];

//   const handlePass = () => {
//     if (currentIndex < profiles.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     } else {
//       alert('No more profiles! In production, this would load more.');
//     }
//   };

//   const handleLike = () => {
//     if (currentProfile.waliRequired) {
//       alert(`Intro request sent to ${currentProfile.firstName}! Waiting for wali approval.`);
//     } else {
//       setMatches([...matches, currentProfile.id]);
//       alert(`It's a match with ${currentProfile.firstName}! 🎉`);
//     }
//     handlePass();
//   };

//   const handleSuperIntro = () => {
//     alert(`Super Intro sent to ${currentProfile.firstName} with a personalized message!`);
//     handlePass();
//   };

//   if (!currentProfile) {
//     return (
//       <div className="text-center py-20">
//         <p className="text-xl text-gray-600">No more profiles to show</p>
//       </div>
//     );
//   }

//   return (
//     <section id="discover" className="py-20 bg-gradient-to-br from-gray-50 to-teal-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-12">
//           <h2 className="text-4xl font-bold text-gray-900">Discover Your Match</h2>
//           <p className="mt-4 text-xl text-gray-600">Swipe with intention</p>
//         </div>
//         <div className="flex flex-col items-center">
//           <ProfileCard
//             profile={currentProfile}
//             onLike={handleLike}
//             onPass={handlePass}
//             onSuperIntro={handleSuperIntro}
//           />
//           <SwipeActions
//             onPass={handlePass}
//             onLike={handleLike}
//             onSuperIntro={handleSuperIntro}
//           />
//           <p className="text-sm text-gray-500 mt-4">
//             {matches.length} matches • Profile {currentIndex + 1} of {profiles.length}
//           </p>
//         </div>
//       </div>
//     </section>
//   );
// };
