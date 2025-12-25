/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import type { DiscoverFilters } from '@/types';

import { FilterPanel } from '@/components/discover/FilterPanel';
import { ProfileCard } from '@/components/ProfileCard';
import { SwipeActions } from '@/components/SwipeActions';
import { toast } from 'sonner';
import PublicProfileModal from '@/components/profile/PublicProfileModal';

type SwipeDirection = 'left' | 'right' | 'up';

type DiscoverProfileRow = {
  id: string;
  email?: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  dob: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  denomination: string | null;
  practice_level: string | null;
  prayer_regular?: string | null;
  marital_status?: string | null;
  has_children?: boolean | null;
  education?: string | null;
  occupation?: string | null;
  ethnicity?: string | null;
  bio: string | null;
  nikah_timeline: string | null;
  wali_required: boolean | null;
  verified_badge: boolean | null;
  subscription_tier?: string | null;
  profile_boosted_until?: string | null;
  lifestyle_choices?: any;
  languages_spoken?: string[] | null;
  age: number | null;

  profile_photo_url?: string | null;
  intro_video_url?: string | null;

  // new fields
  last_seen_at?: string | null;
  madhab?: string | null;
  prayer_frequency?: string | null;
  mosque_attendance?: string | null;
  halal_strict?: string | null;
};

export default function Discover() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [profiles, setProfiles] = useState<DiscoverProfileRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<DiscoverFilters>({
    minAge: 22,
    maxAge: 35,
  });

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<DiscoverProfileRow | null>(null);

  const openProfile = (p: DiscoverProfileRow) => {
    setSelectedProfile(p);
    setProfileModalOpen(true);
  };

  const closeProfile = () => {
    setProfileModalOpen(false);
    setSelectedProfile(null);
  };

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

      const p_denomination = filters.denomination ? filters.denomination : null;

      // Your SQL function accepts a SINGLE practice_level value.
      const p_practice_level =
        Array.isArray(filters.practiceLevel) && filters.practiceLevel.length > 0
          ? filters.practiceLevel[0]
          : null;

      // ✅ NEW distance filters from FilterPanel (these exist in your UI already)
      // Example: maxDistanceMiles = 50, sortByDistance = true
      const p_max_distance_miles =
        typeof (filters as any).maxDistanceMiles === 'number'
          ? (filters as any).maxDistanceMiles
          : null;

      const p_sort_nearest = !!(filters as any).sortByDistance;

      const { data, error } = await supabase.rpc('discover_profiles', {
        p_user_id: user.id,
        p_min_age,
        p_max_age,
        p_country: null,
        p_denomination,
        p_practice_level,

        // Silver/Gold advanced flags
        p_verified_only: filters.verifiedOnly ?? null,
        p_has_photo: filters.hasPhoto ?? null,
        p_recently_active: filters.recentlyActive ?? null,

        // Gold islamic filters
        p_madhab: (filters as any).madhab ?? null,
        p_prayer_frequency: (filters as any).prayerFrequency ?? null,
        p_mosque_attendance: (filters as any).mosqueAttendance ?? null,
        p_halal_strict: (filters as any).halalStrict ?? null,

        // ✅ NEW: distance params handled server-side
        p_max_distance_miles,
        p_sort_nearest,
      });

      if (error) {
        console.error('Error fetching profiles:', error);
        setErrorMessage('Could not load profiles. Try again later.');
        setProfiles([]);
        setCurrentIndex(0);
        return;
      }

      let rawProfiles: DiscoverProfileRow[] = data || [];

      // filter out already-intro'd users
      type IntroRow = { to_user_id: string; status: string };
      const { data: intros, error: introError } = await supabase
        .from('intro_requests')
        .select('to_user_id, status')
        .eq('from_user_id', user.id)
        .in('status', ['pending', 'approved']);

      if (introError) {
        console.error('Error loading existing intros for filtering:', introError);
      }

      const blockedIds = new Set(
        (intros as IntroRow[] | null)?.map((r) => r.to_user_id) ?? []
      );

      const filteredProfiles = rawProfiles.filter((p) => !blockedIds.has(p.id));

      setProfiles(filteredProfiles);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error in fetchProfiles:', err);
      setErrorMessage('Something went wrong.');
      setProfiles([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  // Intro Request handler (unchanged)
  const handleIntroRequest = async (target: DiscoverProfileRow) => {
    if (!user) return;

    try {
      const { data: existing, error: existingError } = await supabase
        .from('intro_requests')
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('to_user_id', target.id)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (existingError) console.error('Error checking existing intro request:', existingError);

      if (existing) {
        toast.info('You already have an active introduction request with this member.');
        return;
      }

      const { data: canUse, error: rpcError } = await supabase.rpc(
        'can_use_daily_super_intro',
        { p_profile_id: user.id }
      );

      if (rpcError) {
        console.error('Error calling can_use_daily_super_intro:', rpcError);
        toast.error('Could not check your Super-Intro limit. Please try again.');
        return;
      }

      if (!canUse) {
        const tier = profile?.subscription_tier ?? 'free';

        if (!profile || (profile as any).subscription_status !== 'active' || tier === 'free') {
          toast.error(
            'You have used your daily Super-Intro. Upgrade to Silver or Gold for more Super-Intros.'
          );
        } else if (tier === 'silver') {
          toast.error(
            'You have used your 21 daily Super-Intros for today. Try again tomorrow in shaa Allah.'
          );
        } else {
          toast.error(
            'You have reached your Super-Intro limit for today. Please try again tomorrow.'
          );
        }
        return;
      }

      const { data: insertedRow, error: insertError } = await supabase
        .from('intro_requests')
        .insert({
          from_user_id: user.id,
          to_user_id: target.id,
          message: null,
        })
        .select('id, to_user_id, wali_id')
        .single();

      if (insertError) {
        console.error('Error creating intro request:', insertError);
        toast.error('Could not send introduction request. Please try again.');
        return;
      }

      const targetName = target.first_name || 'this member';
      const fromName =
        `${(profile as any)?.first_name ?? ''} ${(profile as any)?.last_name ?? ''}`.trim() ||
        'Someone';

      const appUrl = window.location.origin;

      try {
        if (target.wali_required && (insertedRow as any)?.wali_id) {
          const { data: waliProfile, error: waliErr } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .eq('id', (insertedRow as any).wali_id)
            .single();

          if (waliErr) console.error('Failed to load wali profile:', waliErr);

          if (waliProfile?.email) {
            const waliName =
              `${waliProfile.first_name ?? ''} ${waliProfile.last_name ?? ''}`.trim() ||
              'Guardian';

            await supabase.functions.invoke('send-notification-email', {
              body: {
                type: 'intro_request',
                to: waliProfile.email,
                recipientUserId: waliProfile.id,
                data: {
                  waliName,
                  requesterName: fromName,
                  recipientName: targetName,
                  loginUrl: `${appUrl}/intro-requests`,
                },
              },
            });
          }
        } else {
          if (target.email) {
            await supabase.functions.invoke('send-notification-email', {
              body: {
                type: 'intro_request',
                to: target.email,
                recipientUserId: target.id,
                data: {
                  requesterName: fromName,
                  recipientName: targetName,
                  loginUrl: `${appUrl}/intro-requests`,
                },
              },
            });
          }
        }
      } catch (emailErr) {
        console.error('Failed to send intro request email:', emailErr);
      }

      if (target.wali_required) {
        toast.success(
          `Introduction request sent to ${targetName}. Their wali will review it in shaa Allah.`
        );
      } else {
        toast.success(
          `Introduction request sent to ${targetName}. They will be notified in shaa Allah.`
        );
      }

      setCurrentIndex((i) => i + 1);
    } catch (err) {
      console.error('Intro request error:', err);
      toast.error('Something went wrong while sending your request.');
    }
  };

  const handleSwipe = async (direction: SwipeDirection) => {
    if (!user) return;

    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    const name = currentProfile.first_name || 'this user';

    if (direction === 'up') {
      await handleIntroRequest(currentProfile);
      return;
    }

    const action = direction === 'left' ? 'pass' : 'like';

    try {
      if (action === 'pass') toast('You skipped ' + name);

      if (action === 'like') {
        const { data: canLike, error: rpcError } = await supabase.rpc('can_use_daily_like', {
          p_profile_id: user.id,
        });

        if (rpcError) {
          console.error('Error calling can_use_daily_like:', rpcError);
          toast.error('Could not check your daily like limit. Please try again.');
          return;
        }

        if (!canLike) {
          const tier = (profile as any)?.subscription_tier ?? 'free';

          if (!profile || (profile as any).subscription_status !== 'active' || tier === 'free') {
            toast.error(
              'You have used your 10 daily likes on the Free plan. Upgrade to Silver or Gold for unlimited likes.'
            );
          } else {
            toast.error('You have reached your daily like limit. Please try again tomorrow.');
          }
          return;
        }

        toast.success('You liked ' + name);
      }

      const { error: likeError } = await supabase.from('likes').upsert(
        { from_user_id: user.id, to_user_id: currentProfile.id, type: action },
        { onConflict: 'from_user_id,to_user_id' }
      );

      if (likeError) {
        console.error('Error saving like:', likeError);
        toast.error('Something went wrong. Try again.');
      }

      if (action === 'like') {
        const { data: mutual } = await supabase
          .from('likes')
          .select('id')
          .eq('from_user_id', currentProfile.id)
          .eq('to_user_id', user.id)
          .in('type', ['like'])
          .maybeSingle();

        if (mutual) {
          const [id1, id2] = [user.id, currentProfile.id].sort();

          const { error: matchError } = await supabase.from('matches').upsert(
            { user1_id: id1, user2_id: id2 },
            { onConflict: 'user1_id,user2_id' }
          );

          if (matchError) {
            toast.error('Error creating match.');
          } else {
            toast.success(`🎉 It's a match with ${name}!`);
          }
        }
      }
    } catch (err) {
      console.error('Swipe error:', err);
      toast.error('Something went wrong.');
    } finally {
      setCurrentIndex((i) => i + 1);
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
        photos:
          currentProfile.profile_photo_url && currentProfile.profile_photo_url !== ''
            ? [currentProfile.profile_photo_url]
            : ['https://placehold.co/600x800?text=No+Photo'],
        verified: !!currentProfile.verified_badge,
        waliRequired: !!currentProfile.wali_required,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <h1 className="text-2xl font-bold text-gray-900">Discover</h1>

          <div className="flex gap-2">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {errorMessage && <p className="mb-4 text-sm text-red-600 text-center">{errorMessage}</p>}

        {cardProfile ? (
          <div className="flex flex-col items-center">
            <div
              className="cursor-pointer w-full flex justify-center"
              onClick={() => currentProfile && openProfile(currentProfile)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentProfile) openProfile(currentProfile);
              }}
            >
              <ProfileCard profile={cardProfile} />
            </div>

            <SwipeActions
              onPass={() => handleSwipe('left')}
              onLike={() => handleSwipe('right')}
              onSuperIntro={() => handleSwipe('up')}
            />

            <p className="text-sm text-gray-500 mt-2">
              Profile {currentIndex + 1} of {profiles.length}
            </p>

            <PublicProfileModal
              open={profileModalOpen}
              onClose={closeProfile}
              profile={selectedProfile}
              onSendIntro={
                selectedProfile
                  ? async () => {
                      await handleIntroRequest(selectedProfile);
                      closeProfile();
                    }
                  : undefined
              }
              onLike={
                selectedProfile
                  ? async () => {
                      await handleSwipe('right');
                      closeProfile();
                    }
                  : undefined
              }
              onPass={
                selectedProfile
                  ? async () => {
                      await handleSwipe('left');
                      closeProfile();
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤲</div>
            <h2 className="text-2xl font-bold mb-2">No More Profiles</h2>
            <p className="text-gray-600 mb-6">Check later for new matches or adjust filters.</p>
            <Button onClick={fetchProfiles}>Refresh</Button>
          </div>
        )}
      </div>
    </div>
  );
}
