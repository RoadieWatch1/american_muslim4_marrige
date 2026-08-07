import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import type { PublicProfile } from '@/components/profile/PublicProfileView';
import SubscriptionBadge from '@/components/profile/SubscriptionBadge';

type SentLikeProfile = {
  userId: string;
  firstName: string | null;
  city: string | null;
  state: string | null;
  age: number | null;
  photoUrl: string | null;
  subscriptionTier: string | null;
  waliRequired: boolean;
  likedAt: string;
};

export default function SentLikes() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState<SentLikeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingIntro, setPendingIntro] = useState<string | null>(null);
  const [sentIntro, setSentIntro] = useState<Set<string>>(new Set());
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
      // Excludes matched/blocked/inactive profiles server-side and reads
      // existing likes.created_at as-is, so historical likes (sent before
      // this page existed) appear immediately with no backfill needed.
      const { data, error } = await supabase.rpc('get_sent_likes');

      if (error) throw error;

      const now = new Date();
      const merged: SentLikeProfile[] = (data ?? []).map((row: any) => {
        const age = row.dob
          ? Math.floor(
              (now.getTime() - new Date(row.dob).getTime()) /
                (365.25 * 24 * 3600 * 1000)
            )
          : null;
        return {
          userId: row.id,
          firstName: row.first_name ?? null,
          city: row.city ?? null,
          state: row.state ?? null,
          age,
          photoUrl: row.profile_photo_url ?? null,
          subscriptionTier: row.subscription_tier ?? null,
          waliRequired: !!row.wali_required,
          likedAt: row.liked_at,
        };
      });

      setLikes(merged);
    } catch (err) {
      console.error('Failed to load sent likes:', err);
      toast.error('Could not load your sent likes.');
    } finally {
      setLoading(false);
    }
  };

  // Mirrors Discover.tsx's handleIntroRequest exactly — the existing
  // Super-Intro system already allows a one-way intro request independent
  // of prior like state, so this reuses that flow rather than inventing a
  // new way to start a conversation without a mutual match.
  const handleSendIntro = async (target: SentLikeProfile) => {
    if (!user || pendingIntro) return;

    setPendingIntro(target.userId);
    try {
      const { data: existing, error: existingError } = await supabase
        .from('intro_requests')
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('to_user_id', target.userId)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (existingError) console.error('Error checking existing intro request:', existingError);

      if (existing) {
        toast.info('You already have an active introduction request with this member.');
        setSentIntro((prev) => new Set([...prev, target.userId]));
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
        toast.error(
          'You have reached your Super-Intro limit for today. Please try again tomorrow.'
        );
        return;
      }

      const { data: insertedRow, error: insertError } = await supabase
        .from('intro_requests')
        .insert({
          from_user_id: user.id,
          to_user_id: target.userId,
          message: null,
        })
        .select('id, to_user_id, wali_id')
        .single();

      if (insertError) {
        console.error('Error creating intro request:', insertError);
        toast.error('Could not send introduction request. Please try again.');
        return;
      }

      const targetName = target.firstName || 'this member';
      const fromName =
        `${(profile as any)?.first_name ?? ''} ${(profile as any)?.last_name ?? ''}`.trim() ||
        'Someone';
      const appUrl = window.location.origin;

      try {
        if (target.waliRequired && (insertedRow as any)?.wali_id) {
          const waliId = (insertedRow as any).wali_id as string;

          // Name only — no email. The Edge Function resolves the wali's
          // email itself from recipientUserId (service-role access), so it
          // never needs to pass through the client.
          const { data: waliProfile, error: waliErr } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', waliId)
            .single();

          if (waliErr) console.error('Failed to load wali profile:', waliErr);

          const waliName =
            `${waliProfile?.first_name ?? ''} ${waliProfile?.last_name ?? ''}`.trim() ||
            'Guardian';

          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'intro_request',
              recipientUserId: waliId,
              data: {
                waliName,
                requesterName: fromName,
                recipientName: targetName,
                loginUrl: `${appUrl}/intro-requests`,
              },
            },
          });
        } else {
          // Same here — no client-side email lookup for the target. The
          // Edge Function resolves it from recipientUserId, or skips
          // sending gracefully if the target has no email on file.
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'intro_request',
              recipientUserId: target.userId,
              data: {
                requesterName: fromName,
                recipientName: targetName,
                loginUrl: `${appUrl}/intro-requests`,
              },
            },
          });
        }
      } catch (emailErr) {
        console.error('Failed to send intro request email:', emailErr);
      }

      setSentIntro((prev) => new Set([...prev, target.userId]));
      toast.success(
        target.waliRequired
          ? `Introduction request sent to ${targetName}. Their wali will review it in shaa Allah.`
          : `Introduction request sent to ${targetName}. They will be notified in shaa Allah.`
      );
    } catch (err) {
      console.error('Intro request error:', err);
      toast.error('Something went wrong while sending your request.');
    } finally {
      setPendingIntro(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Heart className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-900">Sent Likes</h1>
          {likes.length > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {likes.length} sent like{likes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-6 -mt-4">
          Profiles you've liked while you wait for a match.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          </div>
        ) : likes.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-1">
              No sent likes yet
            </h2>
            <p className="text-gray-500">
              You haven't sent any likes yet. Profiles you like will appear
              here while you wait for a match.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {likes.map((profile) => (
              <div
                key={profile.userId}
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
                      <Heart className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openProfile(profile.userId)}
                  className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                  title="View full profile"
                >
                  <p className="font-semibold text-gray-900 hover:text-teal-700 underline-offset-2 hover:underline flex items-center gap-2 flex-wrap">
                    <span>
                      {profile.firstName ?? 'Member'}
                      {profile.age ? (
                        <span className="font-normal text-gray-500">, {profile.age}</span>
                      ) : null}
                    </span>
                    <SubscriptionBadge tier={profile.subscriptionTier} />
                  </p>
                  {(profile.city || profile.state) && (
                    <p className="text-sm text-gray-500 truncate">
                      {[profile.city, profile.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-teal-500 text-teal-500" />
                    Liked — waiting for a match ·{' '}
                    {formatDistanceToNow(new Date(profile.likedAt), { addSuffix: true })}
                  </p>
                </button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={pendingIntro === profile.userId || sentIntro.has(profile.userId)}
                  onClick={() => handleSendIntro(profile)}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {sentIntro.has(profile.userId)
                    ? 'Request Sent'
                    : pendingIntro === profile.userId
                    ? 'Sending...'
                    : 'Send Intro'}
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
        onSendIntro={
          selectedProfile
            ? (() => {
                const target = likes.find((l) => l.userId === selectedProfile.id);
                if (!target || sentIntro.has(target.userId)) return undefined;
                return async () => {
                  await handleSendIntro(target);
                  closeProfile();
                };
              })()
            : undefined
        }
      />
    </div>
  );
}
