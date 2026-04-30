-- get_public_profile RPC
--
-- Returns the full public-facing profile (matching the PublicProfile
-- TypeScript shape) for a single user. Runs as SECURITY DEFINER so
-- the caller can view a profile the regular SELECT RLS on `profiles`
-- might restrict (e.g. when viewing a previously-passed user from
-- the Look Back page). Mirrors the columns returned by
-- discover_profiles for consistency.

CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
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
  intro_video_url text
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
    mv.url AS intro_video_url
  FROM public.profiles p
  LEFT JOIN public.media mp ON mp.id = p.profile_photo_id
  LEFT JOIN public.media mv ON mv.id = p.intro_video_id
  WHERE p.id = p_user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
