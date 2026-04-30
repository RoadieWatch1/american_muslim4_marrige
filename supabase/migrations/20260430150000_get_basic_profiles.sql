-- get_basic_profiles RPC
--
-- Returns minimal profile fields + the profile photo URL for a list of
-- user IDs. Runs as SECURITY DEFINER so it can read public.media on
-- behalf of the caller without depending on the media table's RLS
-- policies (which typically restrict SELECT to the media owner).
--
-- Used by the Look Back and Who Liked Me pages to display the photo
-- of users the caller has interacted with. Without this RPC the
-- client must hit `media` directly and RLS suppresses the URL.

CREATE OR REPLACE FUNCTION public.get_basic_profiles(p_user_ids uuid[])
RETURNS TABLE (
  id uuid,
  first_name text,
  city text,
  state text,
  dob date,
  profile_photo_url text
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
    mp.url AS profile_photo_url
  FROM public.profiles p
  LEFT JOIN public.media mp ON mp.id = p.profile_photo_id
  WHERE p.id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_basic_profiles(uuid[]) TO authenticated;
