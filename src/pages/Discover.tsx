import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import type { DiscoverFilters } from '@/types';

import { FilterPanel } from '@/components/discover/FilterPanel';

// 🔹 Re-use the nice marketing components
import { ProfileCard } from '@/components/ProfileCard';
import { SwipeActions } from '@/components/SwipeActions';
import { toast } from 'sonner';

type SwipeDirection = 'left' | 'right' | 'up';

// Shape of what discover_profiles RPC returns (partial)
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
  profile_boosted_until?: string | null;
  // you can add more fields here if RPC returns them
};

export default function Discover() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [profiles, setProfiles] = useState<DiscoverProfileRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Basic filters (age range; others come from FilterPanel)
  const [filters, setFilters] = useState<DiscoverFilters>({
    minAge: 22,
    maxAge: 35,
    locationRadius: 50, // still unused, but kept so FilterPanel works
  });

  useEffect(() => {
    if (!user || !profile) {
      navigate('/');
      return;
    }
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, filters]);

  const fetchProfiles = async () => {
    if (!user) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const p_min_age = filters.minAge ?? 18;
      const p_max_age = filters.maxAge ?? 60;

      const p_denomination =
        (filters as any).denomination && (filters as any).denomination !== ''
          ? (filters as any).denomination
          : null;

      let p_practice_level: string | null = null;
      const practiceLevel = (filters as any).practiceLevel;
      if (Array.isArray(practiceLevel) && practiceLevel.length > 0) {
        p_practice_level = practiceLevel[0];
      } else if (typeof practiceLevel === 'string' && practiceLevel !== '') {
        p_practice_level = practiceLevel;
      }

      const { data, error }: {
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
        console.error('Error fetching discover profiles:', error);
        setErrorMessage('Could not load profiles. Please try again later.');
        setProfiles([]);
        setCurrentIndex(0);
        return;
      }

      setProfiles(data || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error in fetchProfiles:', err);
      setErrorMessage('Something went wrong while loading profiles.');
      setProfiles([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: SwipeDirection) => {
  if (!user) return;

  const currentProfile = profiles[currentIndex];
  if (!currentProfile) return;

  const name = currentProfile.first_name || 'this user';

  const action =
    direction === 'left'
      ? 'pass'
      : direction === 'right'
      ? 'like'
      : 'super_intro';

  try {
    // Show instant toast for user feedback (optimistic UI)
    if (action === 'pass') {
      toast('You skipped ' + name);
    }
    if (action === 'like') {
      toast.success('You liked ' + name);
    }
    if (action === 'super_intro') {
      toast.success('Super intro sent to ' + name + ' ✨');
    }

    // Save action
    const { error: likeError } = await supabase.from('likes').upsert(
      {
        from_user_id: user.id,
        to_user_id: currentProfile.id,
        type: action,
      },
      { onConflict: 'from_user_id,to_user_id' }
    );

    if (likeError) {
      console.error('Error saving like/pass:', likeError);
      toast.error('Something went wrong. Try again.');
    }

    // Check match (for like or super_intro)
    if (action === 'like' || action === 'super_intro') {
      const { data: mutual, error: mutualError } = await supabase
        .from('likes')
        .select('id')
        .eq('from_user_id', currentProfile.id)
        .eq('to_user_id', user.id)
        .in('type', ['like', 'super_intro'])
        .maybeSingle();

      if (!mutualError && mutual) {
        // Create match
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
          console.error('Error creating match:', matchError);
          toast.error('Error creating match.');
        } else {
          toast.success(`🎉 It's a match with ${name}!`);
        }
      }
    }
  } catch (err) {
    console.error('Error handling swipe:', err);
    toast.error('Something went wrong.');
  } finally {
    setCurrentIndex((prev) => prev + 1);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Finding matches...</p>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex] || null;

  // Map DB row → ProfileCard props
  const cardProfile = currentProfile
    ? {
        firstName: currentProfile.first_name || '—',
        age: currentProfile.age ?? 0,
        city: currentProfile.city || '',
        state: currentProfile.state || '',
        practiceLevel: currentProfile.practice_level || 'practicing',
        denomination: currentProfile.denomination || undefined,
        bio: currentProfile.bio || '',
        nikahTimeline: currentProfile.nikah_timeline || '6-12mo',
        photos: [
          // TODO: replace with real photo URL from media table
          'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760559448736_5272b484.webp',
          'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760559450707_2b72f42f.webp'
        ],
        verified: !!currentProfile.verified_badge,
        waliRequired: !!currentProfile.wali_required,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Discover</h1>

          {/* Filter trigger */}
          <div className="flex gap-2">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {errorMessage && (
          <p className="mb-4 text-sm text-red-600 text-center">
            {errorMessage}
          </p>
        )}

        {/* Card + actions */}
        {cardProfile ? (
          <div className="flex flex-col items-center">
            <ProfileCard profile={cardProfile} />
            <SwipeActions
              onPass={() => handleSwipe('left')}
              onLike={() => handleSwipe('right')}
              onSuperIntro={() => handleSwipe('up')}
            />
            <p className="text-sm text-gray-500 mt-2">
              Profile {currentIndex + 1} of {profiles.length}
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤲</div>
            <h2 className="text-2xl font-bold mb-2">No More Profiles</h2>
            <p className="text-gray-600 mb-6">
              Check back later for new matches, or adjust your filters.
            </p>
            <Button onClick={fetchProfiles}>Refresh</Button>
          </div>
        )}
      </div>
    </div>
  );
}



// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '@/lib/supabase';
// import { useAuth } from '@/contexts/AuthContext';
// import { SwipeCard } from '@/components/discover/SwipeCard';
// import { FilterPanel } from '@/components/discover/FilterPanel';
// import { Button } from '@/components/ui/Button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Heart, X, Sparkles, ArrowLeft, Crown, AlertCircle, Search, Bookmark } from 'lucide-react';
// import type { DiscoverFilters } from '@/types';
// import { notifyNewMatch, notifyIntroRequest } from '@/lib/notifications';
// import { notifyMatchSMS } from '@/lib/smsNotifications';
// import AdvancedSearchFilters from '@/components/search/AdvancedSearchFilters';
// import SavedSearches from '@/components/search/SavedSearches';
// import { AdvancedSearchFilters as SearchFiltersType } from '@/types/search';
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from '@/components/ui/sheet';

// export default function Discover() {
//   const navigate = useNavigate();
//   const { user, profile } = useAuth();
//   const [profiles, setProfiles] = useState<any[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [todaysMatches, setTodaysMatches] = useState(0);
//   const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
//   const [advancedFilters, setAdvancedFilters] = useState<SearchFiltersType>({});
//   const [filters, setFilters] = useState<DiscoverFilters>({
//     minAge: 22,
//     maxAge: 35,
//     locationRadius: 50,
//   });

//   const DAILY_MATCH_LIMIT = 3;
//   const isBasicTier = !profile?.subscription_tier || profile.subscription_tier === 'basic';
//   const isPremiumOrElite = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'elite';
//   const isElite = profile?.subscription_tier === 'elite';

//   useEffect(() => {
//     if (!user || !profile) {
//       navigate('/');
//       return;
//     }
//     fetchProfiles();
//     if (isBasicTier) {
//       fetchTodaysMatchCount();
//     }
//   }, [user, profile, filters, advancedFilters]);

//   const fetchTodaysMatchCount = async () => {
//     try {
//       const { data, error } = await supabase
//         .rpc('get_todays_match_count', { user_uuid: user!.id });
      
//       if (!error && data !== null) {
//         setTodaysMatches(data);
//       }
//     } catch (error) {
//       console.error('Error fetching match count:', error);
//     }
//   };

//   const fetchProfiles = async () => {
//     setLoading(true);
//     try {
//       const { data: likedUsers } = await supabase
//         .from('likes')
//         .select('to_user_id')
//         .eq('from_user_id', user!.id);

//       const excludeIds = [user!.id, ...(likedUsers?.map(l => l.to_user_id) || [])];

//       let query = supabase
//         .from('profiles')
//         .select('*')
//         .neq('gender', profile!.gender)
//         .not('id', 'in', `(${excludeIds.join(',')})`);

//       // Apply basic filters
//       if (advancedFilters.minAge || filters.minAge) {
//         query = query.gte('age', advancedFilters.minAge || filters.minAge);
//       }
//       if (advancedFilters.maxAge || filters.maxAge) {
//         query = query.lte('age', advancedFilters.maxAge || filters.maxAge);
//       }

//       // Apply advanced filters
//       if (advancedFilters.city) {
//         query = query.ilike('city', `%${advancedFilters.city}%`);
//       }
//       if (advancedFilters.country) {
//         query = query.ilike('country', `%${advancedFilters.country}%`);
//       }
//       if (advancedFilters.educationLevel?.length) {
//         query = query.in('education_level', advancedFilters.educationLevel);
//       }
//       if (advancedFilters.careerField?.length) {
//         query = query.in('career_field', advancedFilters.careerField);
//       }
//       if (advancedFilters.prayerFrequency?.length) {
//         query = query.in('prayer_frequency', advancedFilters.prayerFrequency);
//       }
//       if (advancedFilters.wantsChildren !== undefined) {
//         query = query.eq('wants_children', advancedFilters.wantsChildren);
//       }
//       if (advancedFilters.hasChildren !== undefined) {
//         query = query.eq('has_children', advancedFilters.hasChildren);
//       }
//       if (advancedFilters.isVerified) {
//         query = query.eq('is_verified', true);
//       }

//       // Priority visibility for Premium and Elite users
//       if (isPremiumOrElite) {
//         query = query.order('subscription_tier', { ascending: false });
//       }

//       // Elite users with active boosts appear first
//       if (isElite) {
//         query = query.order('profile_boosted_until', { ascending: false, nullsFirst: false });
//       }

//       if (filters.denomination) {
//         query = query.eq('denomination', filters.denomination);
//       }

//       if (filters.practiceLevel?.length) {
//         query = query.in('practice_level', filters.practiceLevel);
//       }

//       const { data, error } = await query.limit(20);
      
//       if (error) throw error;
//       setProfiles(data || []);
//     } catch (error) {
//       console.error('Error fetching profiles:', error);
//     } finally {
//       setLoading(false);
//     }
//   };


//   const canSwipeRight = () => {
//     if (!isBasicTier) return true;
//     return todaysMatches < DAILY_MATCH_LIMIT;
//   };

//   const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
//     const currentProfile = profiles[currentIndex];
//     if (!currentProfile) return;

//     // Check daily limit for Basic users
//     if (isBasicTier && (direction === 'right' || direction === 'up')) {
//       if (todaysMatches >= DAILY_MATCH_LIMIT) {
//         return;
//       }
//     }

//     const action = direction === 'left' ? 'pass' : direction === 'right' ? 'like' : 'super_intro';

//     try {
//       await supabase.from('likes').insert({
//         from_user_id: user!.id,
//         to_user_id: currentProfile.id,
//         type: action,
//       });

//       if (action === 'like' || action === 'super_intro') {
//         // Track match for Basic users
//         if (isBasicTier) {
//           await supabase.from('daily_matches').insert({
//             user_id: user!.id,
//             matched_user_id: currentProfile.id,
//           });
//           setTodaysMatches(todaysMatches + 1);
//         }

//         const { data: mutualLike } = await supabase
//           .from('likes')
//           .select('*')
//           .eq('from_user_id', currentProfile.id)
//           .eq('to_user_id', user!.id)
//           .eq('type', 'like')
//           .single();

//         if (mutualLike) {
//           if (currentProfile.require_wali_approval) {
//             await supabase.from('intro_requests').insert({
//               requester_id: user!.id,
//               recipient_id: currentProfile.id,
//               status: 'pending',
//             });

//             try {
//               const { data: waliLink } = await supabase
//                 .from('wali_links')
//                 .select('wali_email, wali_name')
//                 .eq('woman_id', currentProfile.id)
//                 .eq('status', 'approved')
//                 .single();

//               if (waliLink) {
//                 await supabase.functions.invoke('send-notification-email', {
//                   body: {
//                     type: 'intro_request',
//                     to: waliLink.wali_email,
//                     data: {
//                       waliName: waliLink.wali_name || 'Guardian',
//                       requesterName: `${profile?.first_name} ${profile?.last_name}`,
//                       recipientName: `${currentProfile.first_name} ${currentProfile.last_name}`,
//                       loginUrl: `${window.location.origin}/wali-console`
//                     }
//                   }
//                 });
//               }
//             } catch (emailError) {
//               console.error('Failed to send wali notification:', emailError);
//             }
//           } else {
//             const [id1, id2] = [user!.id, currentProfile.id].sort();
//             await supabase.from('matches').insert({
//               user1_id: id1,
//               user2_id: id2,
//             });

//             await notifyNewMatch(
//               currentProfile.id, 
//               `${profile?.first_name} ${profile?.last_name}`
//             );
//             await notifyNewMatch(
//               user!.id,
//               `${currentProfile.first_name} ${currentProfile.last_name}`
//             );
//             await notifyMatchSMS(
//               currentProfile.id,
//               `${profile?.first_name} ${profile?.last_name}`
//             );
//             await notifyMatchSMS(
//               user!.id,
//               `${currentProfile.first_name} ${currentProfile.last_name}`
//             );
//           }
//         }
//       }

//       setCurrentIndex(currentIndex + 1);
//     } catch (error) {
//       console.error('Error handling swipe:', error);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Finding matches...</p>
//         </div>
//       </div>
//     );
//   }

//   const currentProfile = profiles[currentIndex];
//   const remainingMatches = isBasicTier ? Math.max(0, DAILY_MATCH_LIMIT - todaysMatches) : null;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
//       <div className="max-w-md mx-auto">
//         <div className="flex items-center justify-between mb-6">
//           <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
//             <ArrowLeft className="h-5 w-5" />
//           </Button>
//           <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={() => setShowAdvancedSearch(true)}
//             >
//               <Search className="h-5 w-5" />
//             </Button>
//             <Sheet>
//               <SheetTrigger asChild>
//                 <Button variant="outline" size="icon">
//                   <Bookmark className="h-5 w-5" />
//                 </Button>
//               </SheetTrigger>
//               <SheetContent>
//                 <SheetHeader>
//                   <SheetTitle>Saved Searches</SheetTitle>
//                   <SheetDescription>
//                     Apply your saved search filters or create new ones
//                   </SheetDescription>
//                 </SheetHeader>
//                 <div className="mt-6">
//                   <SavedSearches
//                     onApplySearch={(filters) => {
//                       setAdvancedFilters(filters);
//                       setCurrentIndex(0);
//                     }}
//                     currentFilters={advancedFilters}
//                   />
//                 </div>
//               </SheetContent>
//             </Sheet>
//             <FilterPanel filters={filters} onFiltersChange={setFilters} />
//           </div>
//         </div>

//         {isBasicTier && (
//           <Alert className="mb-4">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>
//               {remainingMatches === 0 ? (
//                 <>Daily limit reached. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/pricing')}>Upgrade to Premium</Button> for unlimited matches!</>
//               ) : (
//                 `${remainingMatches} match${remainingMatches === 1 ? '' : 'es'} remaining today`
//               )}
//             </AlertDescription>
//           </Alert>
//         )}

//         {isPremiumOrElite && (
//           <div className="mb-4 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
//             <div className="flex items-center gap-2">
//               <Crown className="h-5 w-5" />
//               <span className="font-semibold">
//                 {isElite ? 'Elite Member' : 'Premium Member'}
//               </span>
//             </div>
//             <p className="text-sm mt-1">
//               {isElite ? 'Profile boosted • Priority visibility • VIP support' : 'Unlimited matches • Priority visibility'}
//             </p>
//           </div>
//         )}

//         {currentProfile ? (
//           <>
//             <div className="relative h-[600px] mb-6">
//               <SwipeCard profile={currentProfile} onSwipe={handleSwipe} />
//               {currentProfile.profile_boosted_until && new Date(currentProfile.profile_boosted_until) > new Date() && (
//                 <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
//                   <Sparkles className="h-4 w-4" />
//                   Boosted
//                 </div>
//               )}
//             </div>

//             <div className="flex justify-center gap-4">
//               <Button
//                 size="lg"
//                 variant="outline"
//                 className="rounded-full w-16 h-16"
//                 onClick={() => handleSwipe('left')}
//               >
//                 <X className="h-8 w-8 text-red-500" />
//               </Button>
//               <Button
//                 size="lg"
//                 className="rounded-full w-16 h-16 bg-emerald-500 hover:bg-emerald-600"
//                 onClick={() => handleSwipe('right')}
//                 disabled={!canSwipeRight()}
//               >
//                 <Heart className="h-8 w-8" />
//               </Button>
//               <Button
//                 size="lg"
//                 variant="outline"
//                 className="rounded-full w-16 h-16"
//                 onClick={() => handleSwipe('up')}
//                 disabled={!canSwipeRight()}
//               >
//                 <Sparkles className="h-8 w-8 text-purple-500" />
//               </Button>
//             </div>
//           </>
//         ) : (
//           <div className="text-center py-20">
//             <div className="text-6xl mb-4">🤲</div>
//             <h2 className="text-2xl font-bold mb-2">No More Profiles</h2>
//             <p className="text-gray-600 mb-6">Check back later for new matches</p>
//             <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
//           </div>
//         )}
//       </div>

//       {showAdvancedSearch && (
//         <AdvancedSearchFilters
//           filters={advancedFilters}
//           onFiltersChange={(newFilters) => {
//             setAdvancedFilters(newFilters);
//             setCurrentIndex(0);
//           }}
//           onClose={() => setShowAdvancedSearch(false)}
//           onSaveSearch={() => {
//             // This will be handled by SavedSearches component
//             setShowAdvancedSearch(false);
//           }}
//         />
//       )}
//     </div>
//   );
// }