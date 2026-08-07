-- get_sent_likes RPC
--
-- Powers the "Sent Likes" page: profiles the CALLING user has liked
-- (likes.type = 'like') who they have not yet matched with. Runs as
-- SECURITY DEFINER for the same reason get_basic_profiles/get_public_profile
-- do — it needs to read the target's primary photo via `media`, which is
-- normally RLS-restricted to the media owner.
--
-- Deliberately takes NO parameters and reads auth.uid() directly, rather
-- than trusting a p_user_id argument the way discover_profiles/
-- get_basic_profiles do. Those RPCs only ever return public-safe profile
-- fields, so misusing the id argument is harmless. This RPC instead exposes
-- *who a specific user has sent likes to* — a caller-supplied p_user_id
-- would let any authenticated user enumerate someone else's private
-- sent-likes list, which the existing `likes_select_involved` RLS policy
-- never allows. Hardcoding auth.uid() makes that impossible by construction.
--
-- Excludes:
--   - profiles already mutually matched (they belong in Messages instead)
--   - profiles blocked in either direction
--   - profiles that are admin-disabled, self-paused, or otherwise not an
--     active/complete profile (mirrors the same flags discover_profiles
--     filters on, plus profiles.paused_at which postdates that RPC)
--
-- Reads the existing `likes` rows as-is (no backfill/rewrite) — historical
-- likes are included automatically since this is a pure read/view layer.
--
-- Deliberately does NOT return email. The "Send Intro" notification on the
-- Sent Likes page resolves the recipient's email server-side (via
-- recipientUserId, inside the send-notification-email Edge Function, which
-- already runs with service-role access) instead of round-tripping it
-- through the client the way the older Discover intro-request flow does.
--
-- Returns wali_required (needed to route the Send Intro notification to the
-- target vs. their wali) — the same field discover_profiles already exposes
-- to any authenticated caller for the identical purpose, so this isn't a new
-- exposure category.
--
-- Anonymous access: PostgreSQL grants EXECUTE to PUBLIC by default on
-- function creation. Explicitly revoked below and granted to `authenticated`
-- only — belt-and-suspenders alongside the auth.uid()-only WHERE clause,
-- which already makes an anon call (auth.uid() IS NULL) return zero rows
-- regardless, since `from_user_id = NULL` never matches.

CREATE OR REPLACE FUNCTION public.get_sent_likes()
RETURNS TABLE (
  id uuid,
  first_name text,
  city text,
  state text,
  dob date,
  profile_photo_url text,
  subscription_tier text,
  wali_required boolean,
  liked_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.first_name,
    p.city,
    p.state,
    p.dob,
    mp.url AS profile_photo_url,
    p.subscription_tier,
    p.wali_required,
    l.created_at AS liked_at
  FROM public.likes l
  JOIN public.profiles p ON p.id = l.to_user_id
  LEFT JOIN public.media mp ON mp.id = p.profile_photo_id
  WHERE l.from_user_id = auth.uid()
    AND l.type = 'like'
    AND coalesce(p.is_active, true) = true
    AND p.paused_at IS NULL
    AND coalesce(p.onboarding_completed, false) = true
    AND p.account_status = 'active'
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.user1_id = auth.uid() AND m.user2_id = p.id)
         OR (m.user2_id = auth.uid() AND m.user1_id = p.id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
         OR (b.blocker_id = p.id AND b.blocked_id = auth.uid())
    )
  ORDER BY l.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_sent_likes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_sent_likes() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_sent_likes() TO authenticated;
