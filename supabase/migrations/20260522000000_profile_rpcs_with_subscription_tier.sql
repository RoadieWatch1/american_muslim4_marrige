-- Expose subscription_tier from the two public profile RPCs so other users
-- can see a Silver/Gold badge next to a paying member's profile.
--
-- The column already exists on `profiles`; this just widens the RPC return
-- shape. No data migration.
--
-- Postgres refuses CREATE OR REPLACE when the TABLE return shape changes
-- ("cannot change return type of existing function"), so we DROP first.
-- DROP also revokes grants, so each function explicitly re-grants EXECUTE
-- to authenticated below.
--
-- discover_profiles already returns subscription_tier — not touched here.

-- ─────────────────────────────────────────────
-- get_public_profile — used by ChatInterface, profile detail modal.
-- ─────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

CREATE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  state text,
  country text,
  denomination text,
  practice_level text,
  prayer_regular text,
  marital_status text,
  has_children boolean,
  education text,
  occupation text,
  ethnicity text,
  bio text,
  nikah_timeline text,
  wali_required boolean,
  verified_badge boolean,
  languages_spoken text[],
  lifestyle_choices jsonb,
  profile_photo_url text,
  intro_video_url text,
  subscription_tier text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    floor(extract(year from age(current_date, p.dob)))::int AS age,
    p.city,
    p.state,
    p.country,
    p.denomination,
    p.practice_level,
    p.prayer_regular,
    p.marital_status,
    p.has_children,
    p.education,
    p.occupation,
    p.ethnicity,
    p.bio,
    p.nikah_timeline,
    p.wali_required,
    p.verified_badge,
    p.languages_spoken,
    p.lifestyle_choices,
    mp.url AS profile_photo_url,
    mv.url AS intro_video_url,
    p.subscription_tier
  FROM public.profiles p
  LEFT JOIN public.media mp ON mp.id = p.profile_photo_id
  LEFT JOIN public.media mv ON mv.id = p.intro_video_id
  WHERE p.id = p_user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- ─────────────────────────────────────────────
-- get_basic_profiles — used by Messages inbox, WhoLikedMe, LookBack.
-- ─────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_basic_profiles(uuid[]);

CREATE FUNCTION public.get_basic_profiles(p_user_ids uuid[])
RETURNS TABLE (
  id uuid,
  first_name text,
  city text,
  state text,
  dob date,
  profile_photo_url text,
  subscription_tier text
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
    p.subscription_tier
  FROM public.profiles p
  LEFT JOIN public.media mp ON mp.id = p.profile_photo_id
  WHERE p.id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_basic_profiles(uuid[]) TO authenticated;
