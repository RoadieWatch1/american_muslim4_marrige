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

type SwipeDirection = 'left' | 'right' | 'up';

// Must match RPC return shape
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

  // NEW FROM RPC
  profile_photo_url?: string | null;
  intro_video_url?: string | null;
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
    locationRadius: 50,
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

      const { data, error } = await supabase.rpc('discover_profiles', {
        p_user_id: user.id,
        p_min_age,
        p_max_age,
        p_country: null,
        p_denomination,
        p_practice_level,
      });

      if (error) {
        console.error('Error fetching profiles:', error);
        setErrorMessage('Could not load profiles. Try again later.');
        setProfiles([]);
        setCurrentIndex(0);
        return;
      }

      setProfiles(data || []);
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

  // ─────────────────────────────
  // Intro Request handler (used by star button)
  // ─────────────────────────────
  const handleIntroRequest = async (target: DiscoverProfileRow) => {
    if (!user) return;

    try {
      // 1) Check if an intro request already exists (pending or approved)
      const { data: existing, error: existingError } = await supabase
        .from('intro_requests')
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('to_user_id', target.id)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing intro request:', existingError);
      }

      if (existing) {
        toast.info(
          'You already have an active introduction request with this member.'
        );
        return;
      }

      // 2) Find active wali for the target (if any)
      let waliId: string | null = null;
      const { data: waliLink, error: waliError } = await supabase
        .from('wali_links')
        .select('wali_user_id')
        .eq('ward_user_id', target.id)
        .eq('status', 'active')
        .maybeSingle();

      if (waliError) {
        console.error('Error loading wali link:', waliError);
      } else if (waliLink?.wali_user_id) {
        waliId = waliLink.wali_user_id;
      }

      // 3) Insert intro request
      const { error: insertError } = await supabase.from('intro_requests').insert({
        from_user_id: user.id,
        to_user_id: target.id,
        wali_id: waliId,
        message: null, // later we can add a custom message
      });

      if (insertError) {
        console.error('Error creating intro request:', insertError);
        toast.error('Could not send introduction request. Please try again.');
        return;
      }

      const targetName = target.first_name || 'this member';

      if (target.wali_required) {
        toast.success(
          `Introduction request sent to ${targetName}. Their wali will review it in shaa Allah.`
        );
      } else {
        toast.success(
          `Introduction request sent to ${targetName}. They will be notified in shaa Allah.`
        );
      }
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

    // For the star button: send intro request instead of regular like
    if (direction === 'up') {
      await handleIntroRequest(currentProfile);
      setCurrentIndex((i) => i + 1);
      return;
    }

    const action = direction === 'left' ? 'pass' : 'like';

    try {
      if (action === 'pass') toast('You skipped ' + name);
      if (action === 'like') toast.success('You liked ' + name);

      // Save like/pass
      const { error: likeError } = await supabase.from('likes').upsert(
        {
          from_user_id: user.id,
          to_user_id: currentProfile.id,
          type: action,
        },
        { onConflict: 'from_user_id,to_user_id' }
      );

      if (likeError) {
        console.error('Error saving like:', likeError);
        toast.error('Something went wrong. Try again.');
      }

      // Check match for normal likes
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
            {
              user1_id: id1,
              user2_id: id2,
            },
            { onConflict: 'user1_id,user2_id' }
          );

          if (matchError) toast.error('Error creating match.');
          else toast.success(`🎉 It's a match with ${name}!`);
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
          currentProfile.profile_photo_url &&
          currentProfile.profile_photo_url !== ''
            ? [currentProfile.profile_photo_url]
            : ['https://placehold.co/600x800?text=No+Photo'],
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

          <div className="flex gap-2">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {errorMessage && (
          <p className="mb-4 text-sm text-red-600 text-center">
            {errorMessage}
          </p>
        )}

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
              Check later for new matches or adjust filters.
            </p>
            <Button onClick={fetchProfiles}>Refresh</Button>
          </div>
        )}
      </div>
    </div>
  );
}
