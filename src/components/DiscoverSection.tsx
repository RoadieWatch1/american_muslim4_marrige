/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { ProfileCard } from './ProfileCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import { useAuthModal } from '@/contexts/AuthModalContext';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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
  profile_photo_url?: string | null;
  intro_video_url?: string | null;
};

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

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const DiscoverSection: React.FC = () => {
  const { user, profile } = useAuth();
  const isLoggedIn = !!user && !!profile;
  const { openAuthModal } = useAuthModal();

  const [profiles, setProfiles] = useState<CardProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Public profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<CardProfile | null>(null);

  const openProfile = (p: CardProfile) => {
    setSelectedProfile(p);
    setProfileModalOpen(true);
  };

  const closeProfile = () => {
    setProfileModalOpen(false);
    setSelectedProfile(null);
  };

  // ─────────────────────────────────────────────────────────────
  // Fetch real profiles (logged-in users only)
  // ─────────────────────────────────────────────────────────────

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
      const { data, error } = await supabase.rpc('discover_profiles', {
        p_user_id: user.id,
        p_min_age: 18,
        p_max_age: 60,
        p_country: null,
        p_denomination: null,
        p_practice_level: null,
      });

      if (error) {
        console.error('Home DiscoverSection RPC error:', error);
        setErrorMsg('Could not load profiles right now.');
        setProfiles([]);
        setCurrentIndex(0);
        return;
      }

      const mapped: CardProfile[] =
        (data || []).map((p: DiscoverProfileRow) => ({
          id: p.id,
          firstName: p.first_name || 'Member',
          age: p.age ?? 0,
          city: p.city || '—',
          state: p.state || '',
          practiceLevel: p.practice_level || 'practicing',
          denomination: p.denomination || undefined,
          bio: p.bio || '',
          nikahTimeline: p.nikah_timeline || '6-12mo',
          photos:
            p.profile_photo_url && p.profile_photo_url !== ''
              ? [p.profile_photo_url]
              : ['https://placehold.co/600x800?text=No+Photo'],
          verified: !!p.verified_badge,
          waliRequired: !!p.wali_required,
        })) ?? [];

      setProfiles(mapped);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Home DiscoverSection fetch error:', err);
      setErrorMsg('Something went wrong.');
      setProfiles([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Demo profile (logged-out users)
  // ─────────────────────────────────────────────────────────────

  const demoProfile: CardProfile = {
    id: 'demo',
    firstName: 'Aisha',
    age: 26,
    city: 'New York',
    state: 'NY',
    practiceLevel: 'practicing',
    denomination: 'sunni',
    bio:
      'Seeking a practicing Muslim who values family and faith. ' +
      'Love reading, volunteering, and spending time with family.',
    nikahTimeline: '6-12mo',
    photos: ['https://placehold.co/600x800?text=Demo+Profile'],
    verified: true,
    waliRequired: true,
  };

  const activeProfiles = isLoggedIn ? profiles : [demoProfile];
  const currentProfile = activeProfiles[currentIndex] || null;

  // ─────────────────────────────────────────────────────────────
  // Render guards
  // ─────────────────────────────────────────────────────────────

  if (loading && isLoggedIn && !activeProfiles.length) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
        </div>
      </section>
    );
  }

  if (!currentProfile) {
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <section
      id="discover"
      className="py-20 bg-gradient-to-br from-gray-50 to-teal-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900">
            Discover Your Match
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Swipe with intention
          </p>

          {errorMsg && (
            <p className="mt-2 text-sm text-red-500">{errorMsg}</p>
          )}

          {!isLoggedIn && (
            <p className="mt-2 text-xs text-gray-500">
              Demo preview — create an account to see real matches.
            </p>
          )}
        </div>

        {/* Card */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-md flex justify-center">
            <ProfileCard profile={currentProfile} />

            {/* View Profile */}
            <div className="absolute top-4 right-4 sm:right-12 z-10">
              <button
                type="button"
                onClick={() => openProfile(currentProfile)}
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 shadow border hover:bg-white"
              >
                View Profile
              </button>
            </div>
          </div>

          {/* CTA */}
          {isLoggedIn ? (
            <div className="mt-6 text-sm text-gray-500">
              Visit <span className="font-semibold">Discover</span> to like or send introductions.
            </div>
          ) : (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Create a free account to start discovering real matches.
              </p>
              <button
                onClick={openAuthModal}
                className="rounded-full bg-emerald-600 text-white px-6 py-2 font-semibold hover:bg-emerald-700"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Public Profile Modal */}
      <PublicProfileModal
        open={profileModalOpen}
        onClose={closeProfile}
        profile={
          selectedProfile
            ? {
              id: selectedProfile.id,
              first_name: selectedProfile.firstName,
              last_name: null,
              age: selectedProfile.age,
              city: selectedProfile.city,
              state: selectedProfile.state,
              country: null,
              practice_level: selectedProfile.practiceLevel,
              denomination: selectedProfile.denomination ?? null,
              bio: selectedProfile.bio,
              nikah_timeline: selectedProfile.nikahTimeline,
              verified_badge: selectedProfile.verified,
              wali_required: selectedProfile.waliRequired,              
              profile_photo_url: selectedProfile.photos?.[0] ?? null,
            }
            : null
        }
      />

    </section>
  );
};
