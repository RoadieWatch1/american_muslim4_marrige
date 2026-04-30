import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type LikerProfile = {
  likeId: string;
  userId: string;
  likedAt: string;
  firstName: string | null;
  city: string | null;
  state: string | null;
  age: number | null;
  photoUrl: string | null;
};

export default function WhoLikedMe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedBack, setLikedBack] = useState<Set<string>>(new Set());
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [pendingLike, setPendingLike] = useState<string | null>(null);
  const [pendingPass, setPendingPass] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.id]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: likes, error: likesErr } = await supabase
        .from('likes')
        .select('id, from_user_id, created_at')
        .eq('to_user_id', user.id)
        .eq('type', 'like')
        .order('created_at', { ascending: false });

      if (likesErr) throw likesErr;
      if (!likes || likes.length === 0) {
        setLikers([]);
        return;
      }

      const userIds = likes.map((l) => l.from_user_id);

      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, first_name, city, state, dob, profile_photo_id')
        .in('id', userIds);

      if (profilesErr) throw profilesErr;

      const photoIds = (profiles ?? []).map((p) => p.profile_photo_id).filter(Boolean);
      const photoMap: Record<string, string> = {};
      if (photoIds.length > 0) {
        const { data: media } = await supabase
          .from('media')
          .select('id, url')
          .in('id', photoIds);
        for (const m of media ?? []) {
          photoMap[m.id] = m.url;
        }
      }

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
      const now = new Date();

      const merged: LikerProfile[] = likes.map((like) => {
        const p = profileMap[like.from_user_id];
        const age = p?.dob
          ? Math.floor((now.getTime() - new Date(p.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
          : null;
        return {
          likeId: like.id,
          userId: like.from_user_id,
          likedAt: like.created_at,
          firstName: p?.first_name ?? null,
          city: p?.city ?? null,
          state: p?.state ?? null,
          age,
          photoUrl: p?.profile_photo_id ? (photoMap[p.profile_photo_id] ?? null) : null,
        };
      });

      setLikers(merged);

      const { data: myLikes } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', user.id)
        .in('to_user_id', userIds)
        .eq('type', 'like');

      if (myLikes) {
        setLikedBack(new Set(myLikes.map((l) => l.to_user_id)));
      }
    } catch (err) {
      console.error('Failed to load likes:', err);
      toast.error('Could not load likes.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (targetUserId: string, targetName: string) => {
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

      const { error: likeErr } = await supabase.from('likes').upsert(
        { from_user_id: user.id, to_user_id: targetUserId, type: 'like' },
        { onConflict: 'from_user_id,to_user_id' }
      );

      if (likeErr) {
        console.error('Like upsert failed:', likeErr);
        toast.error(`Could not send like: ${likeErr.message}`);
        return;
      }

      setLikedBack((prev) => new Set([...prev, targetUserId]));
      toast.success(`You liked ${targetName} back!`);

      const { data: mutual } = await supabase
        .from('likes')
        .select('id')
        .eq('from_user_id', targetUserId)
        .eq('to_user_id', user.id)
        .eq('type', 'like')
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

  const handlePass = async (targetUserId: string) => {
    if (!user || pendingPass) return;

    setPendingPass(targetUserId);
    try {
      const { error: passErr } = await supabase.from('likes').upsert(
        { from_user_id: user.id, to_user_id: targetUserId, type: 'pass' },
        { onConflict: 'from_user_id,to_user_id' }
      );

      if (passErr) {
        console.error('Pass upsert failed:', passErr);
        toast.error(`Could not pass: ${passErr.message}`);
        return;
      }

      setPassed((prev) => new Set([...prev, targetUserId]));
    } finally {
      setPendingPass(null);
    }
  };

  // Hide rows the user has already responded to so the list mirrors the
  // unread badge count.
  const visibleLikers = likers.filter(
    (l) => !passed.has(l.userId) && !likedBack.has(l.userId)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Who Liked Me</h1>
          {visibleLikers.length > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {visibleLikers.length} new
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        ) : visibleLikers.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-1">
              {likers.length === 0 ? 'No likes yet' : 'All caught up!'}
            </h2>
            <p className="text-gray-500">
              {likers.length === 0
                ? "When someone likes your profile, they'll appear here."
                : "You've responded to everyone who liked you."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleLikers.map((liker) => (
              <div
                key={liker.likeId}
                className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-4"
              >
                <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {liker.photoUrl ? (
                    <img
                      src={liker.photoUrl}
                      alt={liker.firstName ?? 'Member'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {liker.firstName ?? 'Member'}
                    {liker.age ? (
                      <span className="font-normal text-gray-500">, {liker.age}</span>
                    ) : null}
                  </p>
                  {(liker.city || liker.state) && (
                    <p className="text-sm text-gray-500 truncate">
                      {[liker.city, liker.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(liker.likedAt), { addSuffix: true })}
                  </p>
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  disabled={pendingPass === liker.userId || pendingLike === liker.userId}
                  onClick={() => handlePass(liker.userId)}
                  title="Pass"
                  className="text-gray-500 hover:text-red-600 hover:border-red-300"
                >
                  <X className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant={likedBack.has(liker.userId) ? 'outline' : 'default'}
                  disabled={likedBack.has(liker.userId) || pendingLike === liker.userId || pendingPass === liker.userId}
                  onClick={() => handleLikeBack(liker.userId, liker.firstName ?? 'them')}
                  className={likedBack.has(liker.userId) ? 'text-teal-600 border-teal-300' : ''}
                >
                  <Heart
                    className={`h-4 w-4 mr-1.5 ${
                      likedBack.has(liker.userId) ? 'fill-teal-500 text-teal-500' : ''
                    }`}
                  />
                  {pendingLike === liker.userId
                    ? 'Liking...'
                    : likedBack.has(liker.userId)
                    ? 'Liked'
                    : 'Like Back'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
