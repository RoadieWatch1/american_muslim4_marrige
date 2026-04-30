import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RotateCcw, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import type { PublicProfile } from '@/components/profile/PublicProfileView';

type PassedProfile = {
  likeId: string;
  userId: string;
  passedAt: string;
  firstName: string | null;
  city: string | null;
  state: string | null;
  age: number | null;
  photoUrl: string | null;
};

export default function LookBack() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [passed, setPassed] = useState<PassedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [pendingLike, setPendingLike] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.id]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: passes, error: passErr } = await supabase
        .from('likes')
        .select('id, to_user_id, created_at')
        .eq('from_user_id', user.id)
        .eq('type', 'pass')
        .order('created_at', { ascending: false });

      if (passErr) throw passErr;
      if (!passes || passes.length === 0) {
        setPassed([]);
        return;
      }

      const userIds = passes.map((p) => p.to_user_id);

      const { data: profiles, error: profilesErr } = await supabase.rpc(
        'get_basic_profiles',
        { p_user_ids: userIds }
      );

      if (profilesErr) throw profilesErr;

      const profileMap = Object.fromEntries(
        (profiles ?? []).map((p: any) => [p.id, p])
      );
      const now = new Date();

      const merged: PassedProfile[] = passes.map((pass) => {
        const p = profileMap[pass.to_user_id];
        const age = p?.dob
          ? Math.floor(
              (now.getTime() - new Date(p.dob).getTime()) /
                (365.25 * 24 * 3600 * 1000)
            )
          : null;
        return {
          likeId: pass.id,
          userId: pass.to_user_id,
          passedAt: pass.created_at,
          firstName: p?.first_name ?? null,
          city: p?.city ?? null,
          state: p?.state ?? null,
          age,
          photoUrl: p?.profile_photo_url ?? null,
        };
      });

      setPassed(merged);
    } catch (err) {
      console.error('Failed to load passed profiles:', err);
      toast.error('Could not load your passed profiles.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (targetUserId: string, targetName: string) => {
    if (!user || pendingLike) return;

    setPendingLike(targetUserId);
    try {
      const { data: canLike, error: rpcErr } = await supabase.rpc('can_use_daily_like', {
        p_profile_id: user.id,
      });

      if (rpcErr) {
        toast.error('Could not check your daily like limit.');
        return;
      }

      if (!canLike) {
        toast.error(
          'You have used your daily like limit. Upgrade to Silver or Gold for unlimited likes.'
        );
        return;
      }

      // Update the existing pass row to a like
      const { error: updateErr } = await supabase
        .from('likes')
        .update({ type: 'like' })
        .eq('from_user_id', user.id)
        .eq('to_user_id', targetUserId);

      if (updateErr) {
        toast.error('Could not send like. Try again.');
        return;
      }

      setLiked((prev) => new Set([...prev, targetUserId]));
      toast.success(`You liked ${targetName}!`);

      // Check for mutual like — if they already liked you, create a match
      const { data: mutual } = await supabase
        .from('likes')
        .select('id')
        .eq('from_user_id', targetUserId)
        .eq('to_user_id', user.id)
        .in('type', ['like', 'super_intro'])
        .maybeSingle();

      if (mutual) {
        const [id1, id2] = [user.id, targetUserId].sort();
        const { error: matchErr } = await supabase.from('matches').upsert(
          { user1_id: id1, user2_id: id2 },
          { onConflict: 'user1_id,user2_id' }
        );
        if (matchErr) {
          console.error('Match creation failed:', matchErr);
          toast.error('Liked, but could not create match. Please try again.');
        } else {
          toast.success(`🎉 It's a match with ${targetName}!`);
        }
      }
    } finally {
      setPendingLike(null);
    }
  };

  const openProfile = async (userId: string) => {
    if (loadingProfile) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .rpc('get_public_profile', { p_user_id: userId })
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Profile not found.');
        return;
      }

      setSelectedProfile(data as PublicProfile);
      setProfileModalOpen(true);
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error('Could not load profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const closeProfile = () => {
    setProfileModalOpen(false);
    setSelectedProfile(null);
  };

  const displayList = passed.filter((p) => !liked.has(p.userId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <RotateCcw className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-900">Look Back</h1>
          {displayList.length > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {displayList.length} passed profile{displayList.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-6 -mt-4">
          Profiles you previously passed — change your mind any time.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-20">
            <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-1">
              {passed.length === 0 ? "No passed profiles yet" : "All caught up!"}
            </h2>
            <p className="text-gray-500">
              {passed.length === 0
                ? "Profiles you skip in Discover will appear here."
                : "You've liked everyone you passed. Check Messages for any matches."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((profile) => (
              <div
                key={profile.likeId}
                className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-4"
              >
                <button
                  type="button"
                  onClick={() => openProfile(profile.userId)}
                  className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 hover:ring-2 hover:ring-teal-300 transition-all"
                  title="View full profile"
                >
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.firstName ?? 'Member'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <RotateCcw className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openProfile(profile.userId)}
                  className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                  title="View full profile"
                >
                  <p className="font-semibold text-gray-900 hover:text-teal-700 underline-offset-2 hover:underline">
                    {profile.firstName ?? 'Member'}
                    {profile.age ? (
                      <span className="font-normal text-gray-500">, {profile.age}</span>
                    ) : null}
                  </p>
                  {(profile.city || profile.state) && (
                    <p className="text-sm text-gray-500 truncate">
                      {[profile.city, profile.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Passed {formatDistanceToNow(new Date(profile.passedAt), { addSuffix: true })}
                  </p>
                </button>

                <Button
                  size="sm"
                  disabled={pendingLike === profile.userId}
                  onClick={() => handleLike(profile.userId, profile.firstName ?? 'them')}
                >
                  <Heart className="h-4 w-4 mr-1.5" />
                  {pendingLike === profile.userId ? 'Liking...' : 'Like'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PublicProfileModal
        open={profileModalOpen}
        onClose={closeProfile}
        profile={selectedProfile}
        onLike={
          selectedProfile
            ? async () => {
                await handleLike(
                  selectedProfile.id,
                  selectedProfile.first_name ?? 'them'
                );
                closeProfile();
              }
            : undefined
        }
      />
    </div>
  );
}
